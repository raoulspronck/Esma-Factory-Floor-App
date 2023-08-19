import {
  AlertDialog,
  Text,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  Flex,
  Icon,
  Box,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { GoAlert } from "react-icons/go";

interface CallingAlertProps {
  onClose: () => void;
  isOpen: boolean;
}

const CallingAlert: React.FC<CallingAlertProps> = ({ isOpen, onClose }) => {
  const cancelRef = useRef();
  const [closingTimer, setClosingTimer] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setClosingTimer((e) => e + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      setClosingTimer(0);
    };
  }, []);

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            {status === "" ? (
              <Flex alignItems={"start"}>
                <Text ml="2" fontSize={"25px"} fontWeight="medium">
                  John bellen?
                </Text>
              </Flex>
            ) : (
              <Flex alignItems={"start"}>
                <Icon as={GoAlert} color="blue.400" fontSize={"35px"} />

                <Text ml="2" fontSize={"25px"} fontWeight="medium">
                  John is gebeld
                </Text>
              </Flex>
            )}
          </AlertDialogHeader>

          {status === "" ? null : (
            <AlertDialogBody fontSize={"24px"} bgColor="blue.400" color="white">
              John heeft nog niet gereageerd ({closingTimer})
            </AlertDialogBody>
          )}

          <AlertDialogFooter>
            {status === "" ? (
              <Button
                ref={cancelRef}
                onClick={() => setStatus(new Date().toISOString())}
                mr={3}
                colorScheme="twitter"
                bgColor="blue.400"
              >
                Bellen
              </Button>
            ) : (
              <Button
                ref={cancelRef}
                onClick={onClose}
                mr={3}
                colorScheme="twitter"
                bgColor="blue.400"
              >
                Opniew bellen
              </Button>
            )}

            <Button ref={cancelRef} onClick={onClose}>
              Sluiten
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default CallingAlert;
