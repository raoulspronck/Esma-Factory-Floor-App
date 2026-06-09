import { useEffect, useRef } from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Flex,
  Text,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { MdPowerOff } from "react-icons/md";

import { useConnectionStore } from "../stores/connectionStore";

export default function ShutdownCountdownDialog() {
  const shutdownSecondsLeft = useConnectionStore((s) => s.shutdownSecondsLeft);
  const setShutdownCountdown = useConnectionStore((s) => s.setShutdownCountdown);

  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (shutdownSecondsLeft === null) return;
    if (shutdownSecondsLeft <= 0) {
      setShutdownCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setShutdownCountdown(shutdownSecondsLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [shutdownSecondsLeft, setShutdownCountdown]);

  const handleCancel = async () => {
    await invoke("cancel_shutdown");
    setShutdownCountdown(null);
  };

  const isOpen = shutdownSecondsLeft !== null;
  const isUrgent = shutdownSecondsLeft !== null && shutdownSecondsLeft <= 10;

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={() => {}}
      closeOnOverlayClick={false}
      isCentered
    >
      <AlertDialogOverlay backdropFilter="blur(4px)">
        <AlertDialogContent bg="gray.900" color="white" mx={4}>
          <AlertDialogHeader pb={2}>
            <Flex alignItems="center" gap={3}>
              <MdPowerOff size={32} color={isUrgent ? "#FC8181" : "#F6AD55"} />
              <Text fontSize="22px" fontWeight="semibold">
                Shutting down
              </Text>
            </Flex>
          </AlertDialogHeader>

          <AlertDialogBody textAlign="center" py={6}>
            <Text fontSize="16px" color="gray.400" mb={4}>
              This computer will turn off in:
            </Text>
            <Text
              fontSize="88px"
              fontWeight="bold"
              color={isUrgent ? "red.400" : "orange.300"}
              lineHeight="1"
            >
              {shutdownSecondsLeft}
            </Text>
            <Text fontSize="16px" color="gray.500" mt={2}>
              seconds
            </Text>
          </AlertDialogBody>

          <AlertDialogFooter justifyContent="center" pb={6}>
            <Button
              ref={cancelRef}
              colorScheme="green"
              size="lg"
              onClick={handleCancel}
              minW="200px"
            >
              Cancel shutdown
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}
