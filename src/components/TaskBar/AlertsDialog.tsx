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
  const [subscribedAlerts, setSubscribedAlerts] = useState<string[]>([]);

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

  // Subscribe to notification events for each alert when the alerts list changes
  useEffect(() => {
    for (let i = 0; i < alerts.length; i++) {
      const alert_key = `notification---${alerts[i].device_key}---${alerts[i].data_point}`;
      if (!subscribedAlerts.includes(alert_key)) {
        listen(alert_key, (event) => {
          const message = event.payload as string;
          const notification_key = `${alert_key}/${message}/${alerts[i].require_accept}`;
          if (!activeAlerts.current.includes(notification_key)) {
            const updated = [notification_key, ...activeAlerts.current];
            activeAlerts.current = updated;
            setDisplayActiveAlerts([...updated]);
            onOpen();
          }
        });
        setSubscribedAlerts((prev) => [...prev, alert_key]);
      }
    }
  }, [alerts]);

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
