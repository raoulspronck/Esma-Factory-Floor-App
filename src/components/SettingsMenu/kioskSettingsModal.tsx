import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import React, { useState } from "react";

import { saveKioskSettings } from "../../api/settings";

interface KioskSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;

  kioskKey: string;
  setKioskKey: React.Dispatch<React.SetStateAction<string>>;
  kioskSecret: string;
  setKioskSecret: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Accepts either the full setup link the dashboard hands out
 * (https://iot.exalise.com/kiosk/setup?key=..&secret=..) or just its query
 * string, so the pair can be pasted straight out of the email rather than
 * transcribed field by field - the credential is long enough that typing it by
 * hand on a factory floor screen is a real source of failed pairings.
 */
export function parseKioskSetupInput(
  input: string
): { key: string; secret: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let queryString = trimmed;
  try {
    queryString = new URL(trimmed).search;
  } catch {
    const qIndex = trimmed.indexOf("?");
    queryString = qIndex >= 0 ? trimmed.slice(qIndex) : trimmed;
  }

  const params = new URLSearchParams(queryString);
  const key = params.get("key");
  const secret = params.get("secret");
  if (!key || !secret) return null;

  return { key, secret };
}

const KioskSettingsModal: React.FC<KioskSettingsModalProps> = ({
  isOpen,
  onClose,
  kioskKey,
  setKioskKey,
  kioskSecret,
  setKioskSecret,
}) => {
  const modalSize = useBreakpointValue(["xs", "sm", "lg"]);
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);
  const toast = useToast();

  const [setupLink, setSetupLink] = useState("");

  const applySetupLink = () => {
    const parsed = parseKioskSetupInput(setupLink);
    if (!parsed) {
      toast({
        title: "That does not look like a kiosk setup link",
        status: "error",
      });
      return;
    }
    setKioskKey(parsed.key);
    setKioskSecret(parsed.secret);
    setSetupLink("");
    toast({ title: "Setup link read - press Save to store it", status: "info" });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          Time clock settings
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          <Text fontSize={["xs", "sm", "md"]} color="gray.600" mb={4}>
            Issue a kiosk device in the Exalise dashboard under Time management
            &gt; Kiosk devices, then paste the setup link below. This terminal
            then clocks employees in and out exactly like a wall tablet.
          </Text>

          <Box>
            <FormControl>
              <FormLabel fontSize={["xs", "sm", "md"]}>Setup link</FormLabel>
              <Input
                size={buttonSize}
                fontSize={["xs", "sm", "md"]}
                value={setupLink}
                onChange={(e) => setSetupLink(e.target.value)}
                placeholder="https://iot.exalise.com/kiosk/setup?key=...&secret=..."
              />
              <FormHelperText fontSize={["xs", "xs", "sm"]}>
                Optional - fills in both fields below.
              </FormHelperText>
            </FormControl>
            <Button
              mt={2}
              size={buttonSize}
              colorScheme="gray"
              onClick={applySetupLink}
              isDisabled={setupLink.trim().length === 0}
            >
              Read link
            </Button>
          </Box>

          <Box mt={5}>
            <FormControl>
              <FormLabel fontSize={["xs", "sm", "md"]}>Kiosk key</FormLabel>
              <Input
                size={buttonSize}
                fontSize={["xs", "sm", "md"]}
                value={kioskKey}
                onChange={(e) => setKioskKey(e.target.value)}
                placeholder="kiosk key"
              />
            </FormControl>
          </Box>

          <Box mt={3}>
            <FormControl>
              <FormLabel fontSize={["xs", "sm", "md"]}>Kiosk secret</FormLabel>
              <Input
                size={buttonSize}
                fontSize={["xs", "sm", "md"]}
                value={kioskSecret}
                onChange={(e) => setKioskSecret(e.target.value)}
                type="password"
                placeholder="kiosk secret"
              />
            </FormControl>
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme={"twitter"}
            mr={3}
            size={buttonSize}
            onClick={async () => {
              try {
                await saveKioskSettings(kioskKey, kioskSecret);
              } catch {
                toast({
                  title: "Something went wrong. Try again later",
                  status: "error",
                });
                return;
              }
              // No restart notice here, unlike the other credential modals: the
              // time clock reads these from config on every call, so a new pair
              // takes effect the next time somebody opens the modal.
              toast({
                title: "Time clock credentials saved",
                status: "success",
              });
              onClose();
            }}
          >
            Save
          </Button>

          <Button colorScheme="gray" onClick={onClose} size={buttonSize}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default KioskSettingsModal;
