import {
  Box,
  Button,
  Circle,
  Flex,
  Grid,
  Heading,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { listen } from "@tauri-apps/api/event";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BsArrowLeft } from "react-icons/bs";
import { MdCheck, MdClose, MdRefresh, MdSearch } from "react-icons/md";

import {
  kioskClock,
  kioskGetEmployees,
  kioskRegisterScreen,
  kioskSetInitialPin,
} from "../../../api/kiosk";
import { getExaliseSettings } from "../../../api/settings";
import { ClockUpdate, KioskEmployee, KioskOutcome } from "../../../types";
import { PendingClockEvent, clockEventIdFor } from "../../../utils/clockEventId";

// Datapoint the message handler pushes clock events to this screen under. It
// arrives on this machine's own device topic, because the broker only ever
// lets a device subscribe to its own - the fan-out to every terminal happens
// server side (see kioskScreens.ts in message-handler.exalise.com).
const TIMECLOCK_DATAPOINT = "exalise-timeclock";

// How often a screen re-announces itself while the time clock is open. Well
// inside the server's registration TTL, so one missed call does not quietly
// end the live updates.
const REGISTER_INTERVAL_MS = 5 * 60 * 1000;

// A push tells us the new state but not always the whole truth - undoing a
// check-out reopens a session whose original check-in time this screen never
// saw. So the pushed state is applied at once for the tile, and the list is
// refetched shortly after to reconcile. Waiting a moment collapses the burst
// of taps at a shift change into a single fetch.
const RECONCILE_DELAY_MS = 1500;

// Floor under every view, so the dialog does not snap between wildly different
// sizes as somebody moves from the name grid to the keypad and on to the
// result. Roughly the height of the two-row grid, which is the view it opens
// on and the one it spends most of its time showing.
//
// Sizes throughout this file are set for a wall-mounted touchscreen operated
// with work gloves and dirty hands, not a mouse: anything tappable - a name
// tile, a keypad key, Back - is deliberately far larger than a desktop
// control would be. Decoration (the avatar above the keypad, status labels)
// stays modest, because every pixel it takes is a pixel the keypad loses on a
// 768px-tall screen.
const VIEW_MIN_HEIGHT = "480px";

// The same avatar palette the web kiosk uses, so a person's tile is the same
// colour whichever screen they walk up to.
const AVATAR_COLORS = ["#439be3", "#3ecf8e", "#a374ff", "#ff9f43", "#ff6b6b"];

const avatarColorFor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const initialsFor = (firstName: string, lastName: string): string =>
  `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

const fullName = (e: KioskEmployee): string => `${e.firstName} ${e.lastName}`;

type View = "grid" | "pin" | "choose-pin" | "result";

type ClockResultView = {
  ok: boolean;
  message: string;
  submessage?: string;
};

interface TimeClockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The floor terminal's time clock: the same flow as the wall-mounted kiosk
 * tablet, run from the quick tool bar of a machine that is already standing in
 * the workshop. Tap a name, enter a 4-digit PIN, and the tap is recorded as a
 * check-in or check-out.
 *
 * The one thing it does that the tablet does not: somebody who has never been
 * given a PIN picks one here, on the spot. A personnel record created in the
 * dashboard starts with no PIN at all, and without this the only way to get one
 * was the invite email and the phone app - which is exactly the thing a factory
 * floor worker does not have. The API only ever accepts a *first* PIN from a
 * terminal credential, never a change, so this cannot be used to take over a
 * colleague's account.
 *
 * Nothing here needs configuring. It authenticates with the Exalise
 * credentials the installation already holds, and while it is open it tells
 * the server so, which is what makes a tap on the terminal by the saw show up
 * on the one by the press a moment later.
 */
const TimeClockModal: React.FC<TimeClockModalProps> = ({ isOpen, onClose }) => {
  const [employees, setEmployees] = useState<KioskEmployee[] | null>(null);
  const [listOutcome, setListOutcome] = useState<KioskOutcome>("ok");
  const [loading, setLoading] = useState(false);

  const [view, setView] = useState<View>("grid");
  const [selected, setSelected] = useState<KioskEmployee | null>(null);
  const [nameSearch, setNameSearch] = useState("");

  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [cooldownMs, setCooldownMs] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Two-step so a mistyped first PIN is caught here rather than locking someone
  // out of the terminal they just enrolled on.
  const [choosePinStage, setChoosePinStage] = useState<"enter" | "confirm">("enter");
  const [firstPin, setFirstPin] = useState("");

  const [result, setResult] = useState<ClockResultView | null>(null);

  // Held between attempts so a tap whose reply never arrived can be retried
  // under the same identity. Scoped to the employee it belongs to: this is a
  // shared screen, and reusing one person's id for the next person's tap would
  // hand them somebody else's replayed result.
  const pendingClockEvent = useRef<(PendingClockEvent & { employeeId: string }) | null>(
    null
  );

  // This machine's own device key, which is the MQTT topic clock events for
  // this screen arrive on. Read once and kept for the life of the component -
  // changing it means changing the Exalise settings, which restarts the app.
  const [deviceKey, setDeviceKey] = useState<string | null>(null);

  const reconcileTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadEmployees = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    try {
      const response = await kioskGetEmployees();
      setListOutcome(response.outcome);
      if (response.outcome === "ok") setEmployees(response.data ?? []);
    } catch {
      setListOutcome("error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetched on every open rather than cached: a screen that has been sitting
  // on the dashboard all morning would otherwise show yesterday's check-in
  // states, and somebody enrolled an hour ago would have no tile at all.
  useEffect(() => {
    if (!isOpen) return;
    loadEmployees(employees === null);
  }, [isOpen, loadEmployees]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getExaliseSettings()
      .then((settings) => setDeviceKey(settings?.mqtt_settings?.device_key ?? null))
      // A machine with no settings file yet simply gets no live updates; the
      // list it fetches on open is still correct.
      .catch(() => setDeviceKey(null));
  }, []);

  // Announce this screen for as long as the time clock is on it. Registration
  // lapses on its own, so closing the modal or switching the machine off needs
  // no counterpart - which is the point: there is nothing to un-configure.
  useEffect(() => {
    if (!isOpen) return;

    kioskRegisterScreen().catch(() => undefined);
    const id = setInterval(
      () => kioskRegisterScreen().catch(() => undefined),
      REGISTER_INTERVAL_MS
    );
    return () => clearInterval(id);
  }, [isOpen]);

  /**
   * Applies a clock event that happened somewhere else, then schedules a
   * refetch to fill in what the push could not say.
   *
   * Deliberately does not touch `selected`, `pin` or the current view: these
   * arrive while somebody may be halfway through typing their PIN, and a
   * colleague clocking in two machines away must not throw them back to the
   * grid.
   */
  const applyClockUpdate = useCallback((update: ClockUpdate) => {
    setEmployees((current) => {
      if (!current) return current;
      return current.map((e) =>
        e.id === update.employeeId
          ? {
              ...e,
              isCheckedIn: update.isCheckedIn,
              // Only a check-in carries a time this screen can trust. An undo
              // that reopens a session has an earlier check-in time that was
              // never sent here, so the old value is kept until the refetch
              // below corrects it.
              checkedInSince:
                update.status === "IN"
                  ? update.time
                  : update.isCheckedIn
                    ? e.checkedInSince
                    : null,
            }
          : e
      );
    });

    if (reconcileTimer.current) clearTimeout(reconcileTimer.current);
    reconcileTimer.current = setTimeout(() => {
      reconcileTimer.current = null;
      loadEmployees(false);
    }, RECONCILE_DELAY_MS);
  }, [loadEmployees]);

  // Only listened to while the modal is open: the events stop being published
  // to this screen shortly after it closes anyway, and there is nothing behind
  // the modal that renders a clock state.
  useEffect(() => {
    if (!isOpen || !deviceKey) return;

    let unlisten: (() => void) | undefined;
    let cancelled = false;

    listen<string>(
      `notification---${deviceKey}---${TIMECLOCK_DATAPOINT}`,
      (event) => {
        try {
          applyClockUpdate(JSON.parse(event.payload) as ClockUpdate);
        } catch {
          // A payload this screen cannot read is not worth acting on; the
          // reconcile fetch on the next real event will catch up regardless.
        }
      }
    ).then((fn) => {
      // The modal can close before the listener is registered, in which case
      // the cleanup below has already run and has nothing to remove yet.
      if (cancelled) fn();
      else unlisten = fn;
    });

    return () => {
      cancelled = true;
      unlisten?.();
      if (reconcileTimer.current) {
        clearTimeout(reconcileTimer.current);
        reconcileTimer.current = null;
      }
    };
  }, [isOpen, deviceKey, applyClockUpdate]);

  const returnToGrid = useCallback(() => {
    setView("grid");
    setSelected(null);
    setPin("");
    setPinError(null);
    setCooldownMs(null);
    setResult(null);
    setChoosePinStage("enter");
    setFirstPin("");
  }, []);

  // A modal reopened later must never resume somebody else's half-entered PIN.
  useEffect(() => {
    if (!isOpen) {
      returnToGrid();
      setNameSearch("");
    }
  }, [isOpen, returnToGrid]);

  // Alphabetical, so someone's tile stays in the same place day after day - the
  // API returns them in creation order, which reshuffles whenever a colleague
  // is added.
  const sortedEmployees = useMemo(
    () =>
      [...(employees ?? [])].sort((a, b) => fullName(a).localeCompare(fullName(b))),
    [employees]
  );

  const showNameSearch = sortedEmployees.length > 12;

  const visibleEmployees = useMemo(() => {
    const term = nameSearch.trim().toLowerCase();
    if (!term) return sortedEmployees;
    return sortedEmployees.filter((e) => fullName(e).toLowerCase().includes(term));
  }, [sortedEmployees, nameSearch]);

  // Ticks the cooldown down to 0, then clears it so the keypad re-enables
  // itself - no need to back out and re-tap a name once the window has passed.
  useEffect(() => {
    if (cooldownMs === null) return;
    if (cooldownMs <= 0) {
      setCooldownMs(null);
      return;
    }
    const id = setTimeout(
      () => setCooldownMs((ms) => (ms !== null ? Math.max(0, ms - 250) : null)),
      250
    );
    return () => clearTimeout(id);
  }, [cooldownMs]);

  // A success means the person is done and the screen belongs to the machine
  // again; a failure drops back to the grid so the next attempt costs one tap.
  useEffect(() => {
    if (!result) return;
    const id = setTimeout(() => {
      if (result.ok) onClose();
      else returnToGrid();
    }, result.ok ? 2200 : 2600);
    return () => clearTimeout(id);
  }, [result, onClose, returnToGrid]);

  const describeFailure = (outcome: KioskOutcome, message?: string): string => {
    switch (outcome) {
      case "unconfigured":
        return "No Exalise credentials on this machine - see Settings > Exalise http";
      case "unauthenticated":
        return "Exalise refused this machine's credentials - see Settings > Exalise http";
      case "offline":
        return "No connection - nothing was registered";
      case "not_found":
        return "Employee no longer exists";
      case "no_pin":
        return "No PIN set for this employee";
      default:
        return message ?? "Something went wrong";
    }
  };

  const submitClock = async (employee: KioskEmployee, enteredPin: string, pinJustSet: boolean) => {
    setSubmitting(true);

    const previous =
      pendingClockEvent.current?.employeeId === employee.id
        ? pendingClockEvent.current
        : null;
    const clockEvent = clockEventIdFor(previous);
    pendingClockEvent.current = { ...clockEvent, employeeId: employee.id };

    try {
      const response = await kioskClock(employee.id, enteredPin, clockEvent.id);

      // Anything but a lost request is a decision the handler actually reached,
      // so this tap is settled. "offline" leaves it pending: the event may or
      // may not have been written, and reusing the id is what makes the next
      // attempt safe either way.
      if (response.outcome !== "offline") pendingClockEvent.current = null;

      if (response.outcome === "ok" && response.data) {
        const label =
          response.data.status === "IN"
            ? "Checked in"
            : response.data.status === "OUT"
              ? "Checked out"
              : "Undone";
        setResult({
          ok: true,
          message: `${response.data.employeeName} - ${label}`,
          submessage: pinJustSet ? "Your PIN has been saved" : undefined,
        });
        setView("result");
        loadEmployees(false); // refresh grid statuses in the background
        return;
      }

      if (response.outcome === "wrong_pin") {
        // Stay on the PIN screen so the same person can retry immediately,
        // instead of bouncing back to the grid and re-tapping their name.
        setPinError("Incorrect PIN");
        setView("pin");
        return;
      }

      if (response.outcome === "cooldown") {
        setCooldownMs(response.retryAfterMs ?? 10000);
        setView("pin");
        return;
      }

      // The list on this screen and the server disagree about whether a PIN
      // exists. Both directions are worth recovering from in place rather than
      // as an error: send them to the screen the server's answer implies, and
      // refresh the tiles behind them.
      if (response.outcome === "no_pin") {
        loadEmployees(false);
        if (pinJustSet) {
          // Set moments ago on another screen, so a PIN does exist - ours just
          // was not the one that won.
          setPinError("Incorrect PIN");
          setView("pin");
        } else {
          setPin("");
          setFirstPin("");
          setChoosePinStage("enter");
          setPinError(null);
          setView("choose-pin");
        }
        return;
      }

      setResult({ ok: false, message: describeFailure(response.outcome, response.message) });
      setView("result");
    } catch {
      setResult({ ok: false, message: "Something went wrong" });
      setView("result");
    } finally {
      setSubmitting(false);
      setPin("");
    }
  };

  const savePinThenClock = async (employee: KioskEmployee, chosenPin: string) => {
    setSubmitting(true);
    try {
      const response = await kioskSetInitialPin(employee.id, chosenPin);

      if (response.outcome === "ok") {
        setSubmitting(false);
        // Straight on to the clock tap: the person walked up to register their
        // arrival, not to fill in a form.
        await submitClock(employee, chosenPin, true);
        return;
      }

      // Somebody already set one - either this person on another screen, or the
      // list on this screen is stale. Either way the keypad is the right answer.
      if (response.message === "PIN already set") {
        setChoosePinStage("enter");
        setFirstPin("");
        setPin("");
        setPinError("A PIN already exists for this person - enter it");
        setView("pin");
        loadEmployees(false);
        return;
      }

      setResult({ ok: false, message: describeFailure(response.outcome, response.message) });
      setView("result");
    } catch {
      setResult({ ok: false, message: "Something went wrong" });
      setView("result");
    } finally {
      setSubmitting(false);
    }
  };

  const selectEmployee = (employee: KioskEmployee) => {
    setSelected(employee);
    setPin("");
    setPinError(null);
    setCooldownMs(null);
    setFirstPin("");
    setChoosePinStage("enter");
    setView(employee.hasPin ? "pin" : "choose-pin");
  };

  const handleDigit = (digit: string) => {
    if (submitting || cooldownMs !== null || pin.length >= 4) return;
    setPinError(null);
    const next = pin + digit;
    setPin(next);

    if (next.length < 4 || !selected) return;

    if (view === "pin") {
      submitClock(selected, next, false);
      return;
    }

    // choose-pin: first entry is remembered, the second has to match it.
    if (choosePinStage === "enter") {
      setFirstPin(next);
      setChoosePinStage("confirm");
      setPin("");
      return;
    }

    if (next === firstPin) {
      setPin("");
      savePinThenClock(selected, next);
    } else {
      setPin("");
      setFirstPin("");
      setChoosePinStage("enter");
      setPinError("The two PINs did not match - try again");
    }
  };

  const handleBackspace = () => {
    if (submitting) return;
    setPinError(null);
    setPin((p) => p.slice(0, -1));
  };

  const keypadDisabled = submitting || cooldownMs !== null;

  const renderKeypad = () => (
    <SimpleGrid columns={3} spacing={3} width="100%" maxW="380px">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
        <Button
          key={digit}
          height="88px"
          fontSize="34px"
          bg="whiteAlpha.200"
          color="white"
          _hover={{ bg: "whiteAlpha.300" }}
          _active={{ bg: "whiteAlpha.400" }}
          isDisabled={keypadDisabled}
          onClick={() => handleDigit(digit)}
        >
          {digit}
        </Button>
      ))}
      <Box />
      <Button
        height="88px"
        fontSize="34px"
        bg="whiteAlpha.200"
        color="white"
        _hover={{ bg: "whiteAlpha.300" }}
        _active={{ bg: "whiteAlpha.400" }}
        isDisabled={keypadDisabled}
        onClick={() => handleDigit("0")}
      >
        0
      </Button>
      <Button
        height="88px"
        fontSize="30px"
        bg="whiteAlpha.100"
        color="white"
        _hover={{ bg: "whiteAlpha.200" }}
        isDisabled={keypadDisabled || pin.length === 0}
        onClick={handleBackspace}
        aria-label="Backspace"
      >
        <Icon as={BsArrowLeft} />
      </Button>
    </SimpleGrid>
  );

  const renderPinDots = () => (
    <Flex gap={4} mb={2}>
      {[0, 1, 2, 3].map((i) => (
        <Circle
          key={i}
          size="24px"
          bg={i < pin.length ? "brand.400" : "transparent"}
          border="2px solid"
          borderColor={pinError ? "red.400" : "whiteAlpha.500"}
        />
      ))}
    </Flex>
  );

  const renderHeader = (title: string, subtitle?: string) => (
    <Flex direction="column" align="center" mb={4}>
      {selected && (
        <Circle
          size="64px"
          bg={avatarColorFor(fullName(selected))}
          color="white"
          fontSize="26px"
          fontWeight="bold"
          mb={3}
        >
          {initialsFor(selected.firstName, selected.lastName)}
        </Circle>
      )}
      <Heading size="lg" color="white" textAlign="center">
        {title}
      </Heading>
      {subtitle && (
        <Text color="whiteAlpha.700" fontSize="md" mt={1} textAlign="center">
          {subtitle}
        </Text>
      )}
    </Flex>
  );

  const renderBackButton = () => (
    <Button
      leftIcon={<Icon as={BsArrowLeft} />}
      variant="ghost"
      color="whiteAlpha.800"
      _hover={{ bg: "whiteAlpha.200" }}
      size="lg"
      onClick={returnToGrid}
      isDisabled={submitting}
    >
      Back
    </Button>
  );

  const renderGrid = () => {
    if (loading && employees === null) {
      return (
        <Flex minH={VIEW_MIN_HEIGHT} align="center" justify="center">
          <Spinner size="xl" color="brand.400" thickness="4px" />
        </Flex>
      );
    }

    if (listOutcome !== "ok") {
      return (
        <Flex minH={VIEW_MIN_HEIGHT} align="center" justify="center" direction="column" px={6}>
          <Heading size="lg" color="white" mb={3} textAlign="center">
            {listOutcome === "unconfigured"
              ? "No Exalise credentials on this machine"
              : listOutcome === "unauthenticated"
                ? "Exalise refused this machine's credentials"
                : listOutcome === "offline"
                  ? "No connection"
                  : "Could not load the employee list"}
          </Heading>
          <Text color="whiteAlpha.700" fontSize="lg" textAlign="center" maxW="560px">
            {listOutcome === "unconfigured" || listOutcome === "unauthenticated"
              ? "Open Settings > Exalise http and check this machine's API key and secret. There is no separate time clock login any more."
              : "Check the network connection and try again."}
          </Text>
          <Button
            mt={6}
            size="lg"
            colorScheme="brand"
            leftIcon={<Icon as={MdRefresh} />}
            onClick={() => loadEmployees(true)}
            isLoading={loading}
          >
            Try again
          </Button>
        </Flex>
      );
    }

    if (sortedEmployees.length === 0) {
      return (
        <Flex minH={VIEW_MIN_HEIGHT} align="center" justify="center" direction="column">
          <Heading size="lg" color="white" mb={2}>
            No employees yet
          </Heading>
          <Text color="whiteAlpha.700" fontSize="lg">
            Add them in the Exalise dashboard first.
          </Text>
        </Flex>
      );
    }

    return (
      <Box>
        <Flex align="center" mb={4} gap={3}>
          <Heading size="lg" color="white">
            Who is clocking in or out?
          </Heading>
          {showNameSearch && (
            <InputGroup maxW="280px" ml="auto">
              <InputLeftElement height="48px" pointerEvents="none">
                <Icon as={MdSearch} color="whiteAlpha.600" boxSize="22px" />
              </InputLeftElement>
              <Input
                size="lg"
                placeholder="Search name"
                bg="whiteAlpha.100"
                color="white"
                border="none"
                _placeholder={{ color: "whiteAlpha.500" }}
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
              />
            </InputGroup>
          )}
          <IconButton
            ml={showNameSearch ? 0 : "auto"}
            aria-label="Refresh"
            icon={<Icon as={MdRefresh} boxSize="26px" />}
            size="lg"
            bg="whiteAlpha.200"
            color="white"
            _hover={{ bg: "whiteAlpha.300" }}
            isLoading={loading}
            onClick={() => loadEmployees(true)}
          />
        </Flex>

        <Grid templateColumns="repeat(auto-fill, minmax(190px, 1fr))" gap={4}>
          {visibleEmployees.map((employee) => (
            <Flex
              key={employee.id}
              as="button"
              direction="column"
              align="center"
              justify="center"
              bg="whiteAlpha.100"
              borderRadius="2xl"
              border="2px solid"
              borderColor={employee.isCheckedIn ? "#3ecf8e" : "transparent"}
              py={5}
              px={4}
              transition="background 0.15s ease"
              _hover={{ bg: "whiteAlpha.200" }}
              _active={{ bg: "whiteAlpha.300" }}
              onClick={() => selectEmployee(employee)}
            >
              <Circle
                size="72px"
                bg={avatarColorFor(fullName(employee))}
                color="white"
                fontSize="28px"
                fontWeight="bold"
                mb={3}
              >
                {initialsFor(employee.firstName, employee.lastName)}
              </Circle>
              <Text color="white" fontSize="2xl" fontWeight="semibold" noOfLines={1}>
                {employee.firstName}
              </Text>
              <Text color="whiteAlpha.700" fontSize="lg" noOfLines={1}>
                {employee.lastName}
              </Text>
              <Text
                mt={2}
                fontSize="sm"
                fontWeight="semibold"
                color={employee.isCheckedIn ? "#3ecf8e" : "whiteAlpha.500"}
              >
                {employee.isCheckedIn ? "CHECKED IN" : "CHECKED OUT"}
              </Text>
              {!employee.hasPin && (
                <Text mt={1} fontSize="sm" color="#ff9f43">
                  Choose a PIN
                </Text>
              )}
            </Flex>
          ))}
        </Grid>
      </Box>
    );
  };

  const renderPinView = () => (
    <Flex direction="column" align="center" justify="center" minH={VIEW_MIN_HEIGHT}>
      {renderHeader(
        selected ? fullName(selected) : "",
        cooldownMs !== null
          ? `Just registered - wait ${Math.ceil(cooldownMs / 1000)}s`
          : "Enter your PIN"
      )}
      {renderPinDots()}
      <Box height="28px" mb={3}>
        {pinError && (
          <Text color="red.300" fontSize="md">
            {pinError}
          </Text>
        )}
        {submitting && !pinError && <Spinner size="sm" color="brand.400" />}
      </Box>
      {renderKeypad()}
      <Box mt={4}>{renderBackButton()}</Box>
    </Flex>
  );

  const renderChoosePinView = () => (
    <Flex direction="column" align="center" justify="center" minH={VIEW_MIN_HEIGHT}>
      {renderHeader(
        selected ? fullName(selected) : "",
        choosePinStage === "enter"
          ? "You have no PIN yet - choose a 4-digit PIN"
          : "Enter the same PIN again to confirm"
      )}
      {renderPinDots()}
      <Box height="28px" mb={3}>
        {pinError && (
          <Text color="red.300" fontSize="md">
            {pinError}
          </Text>
        )}
        {submitting && !pinError && <Spinner size="sm" color="brand.400" />}
      </Box>
      {renderKeypad()}
      <Text color="whiteAlpha.600" fontSize="sm" mt={4} maxW="380px" textAlign="center">
        You will use this PIN every time you clock in or out. Keep it to yourself.
      </Text>
      <Box mt={2}>{renderBackButton()}</Box>
    </Flex>
  );

  const renderResultView = () => (
    <Flex direction="column" align="center" justify="center" minH={VIEW_MIN_HEIGHT}>
      <Circle size="128px" bg={result?.ok ? "#3ecf8e" : "#ff6b6b"} mb={6}>
        <Icon as={result?.ok ? MdCheck : MdClose} boxSize="72px" color="white" />
      </Circle>
      <Heading size="xl" color="white" textAlign="center" px={8}>
        {result?.message}
      </Heading>
      {result?.submessage && (
        <Text color="whiteAlpha.700" fontSize="lg" mt={3}>
          {result.submessage}
        </Text>
      )}
    </Flex>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" motionPreset="none" isCentered>
      <ModalOverlay />
      <ModalContent bg="gray.900" color="white" borderRadius="2xl">
        <ModalCloseButton size="lg" top={4} right={4} zIndex={2} />
        <ModalBody p={8}>
          {/*
            Height follows the content, floored so the short views (a result,
            an empty list) do not collapse into a sliver and capped so the
            keypad still scrolls rather than overflowing a small screen. With
            eight or so people the grid is two rows, and pinning this to the
            tallest view would have left most of the dialog empty on the view
            that opens first. The cap is generous because the keypad view is
            the tall one and it is the one that must not scroll under a finger,
            and it subtracts this body's own padding so the dialog can never
            grow taller than the screen it is on.
          */}
          <Box minH={VIEW_MIN_HEIGHT} maxH="calc(85vh - 64px)" overflowY="auto">
            {view === "grid" && renderGrid()}
            {view === "pin" && renderPinView()}
            {view === "choose-pin" && renderChoosePinView()}
            {view === "result" && renderResultView()}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TimeClockModal;
