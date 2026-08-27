import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Flex,
  Icon,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import { GoAlert } from "react-icons/go";

import DisplayAlert from "../DisplayAlert";
import { useConnectionStore } from "../../stores/connectionStore";

export default function AlertsDialog() {
  const alerts = useConnectionStore((s) => s.alerts);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<any>();

  const activeAlerts = useRef<string[]>([]);
  const [displayActiveAlerts, setDisplayActiveAlerts] = useState<string[]>([]);

  const acceptNotification = (notification: string) => {
    const parts = notification.split("/");
    const message = parts[1] + "/ alert accepted";
    invoke("send_message", {
      deviceKey: parts[0].split("---")[1],
      datapoint: parts[0].split("---")[2],
      value: message,
    }).catch(console.log);
  };

  // Gesture control — acknowledge first active alert on Thumb_Up
  useEffect(() => {
    listen("gesture", (e) => {
      if (e.payload === "Thumb_Up" && activeAlerts.current.length > 0) {
        const first = activeAlerts.current[0];
        if (first.split("/")[2] !== "No") {
          acceptNotification(first);
        }
      }
    });
  }, []);

  // Subscribe to the notification event of every configured alert. The backend
  // relays *all* MQTT traffic as `notification---<deviceKey>---<datapoint>`,
  // so an alert fires regardless of whether its device is on the dashboard.
  //
  // Re-runs whenever the alert list changes and tears its listeners down again:
  // the previous version tracked "already subscribed" in state and only ever
  // added, so an alert removed in "Manage alerts" kept firing until restart.
  useEffect(() => {
    let cancelled = false;
    const unlisteners: Array<() => void> = [];

    for (const alert of alerts) {
      const alertKey = `notification---${alert.device_key}---${alert.data_point}`;

      listen<string>(alertKey, (event) => {
        const notificationKey = `${alertKey}/${event.payload}/${alert.require_accept}`;
        if (activeAlerts.current.includes(notificationKey)) return;
        const updated = [notificationKey, ...activeAlerts.current];
        activeAlerts.current = updated;
        setDisplayActiveAlerts([...updated]);
        onOpen();
      }).then((unlisten) => {
        // The effect may already have been cleaned up by the time Tauri
        // resolves the registration - drop the listener instead of leaking it.
        if (cancelled) unlisten();
        else unlisteners.push(unlisten);
      });
    }

    return () => {
      cancelled = true;
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, [alerts, onOpen]);

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      closeOnOverlayClick={false}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            <Flex alignItems="start">
              <Icon as={GoAlert} color="orange.400" fontSize="35px" />
              <Text ml="2" fontSize="25px" fontWeight="medium">
                Alert
              </Text>
            </Flex>
          </AlertDialogHeader>

          <AlertDialogBody fontSize="24px" bgColor="orange.400" color="white">
            {displayActiveAlerts.map((a) => (
              <DisplayAlert
                key={a}
                activeAlerts={activeAlerts}
                alert={a}
                alertSplit={a.split("/")}
                onClose={onClose}
                setDisplayActiveAlerts={setDisplayActiveAlerts}
              />
            ))}
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button
              colorScheme="gray"
              onClick={() => {
                setDisplayActiveAlerts([]);
                activeAlerts.current = [];
                onClose();
              }}
            >
              Sluit
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}
