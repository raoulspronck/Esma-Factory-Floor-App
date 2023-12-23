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
import { invoke } from "@tauri-apps/api";
import React, { useEffect, useRef, useState } from "react";
import { GoAlert } from "react-icons/go";

interface CallingAlertProps {
  onClose: () => void;
  isOpen: boolean;
}

const CallingAlert: React.FC<CallingAlertProps> = ({ isOpen, onClose }) => {
  const [send, setSend] = useState(false);
  const cancelRef = React.useRef();
  const [deviceName, setDeviceName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && deviceName === "") {
      invoke("get_own_device")
        .then((e: any) => {
          const device = JSON.parse(e);
          setDeviceName(device.name);
          setLoading(false);
        })
        .catch();
    } else if (deviceName !== "") {
      setLoading(false);
    }

    return () => {
      setLoading(true);
    };
  }, [isOpen]);

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={() => {
        setSend(false);
        onClose();
      }}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          {loading ? (
            <>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Loading
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button
                  ref={cancelRef}
                  onClick={() => {
                    setSend(false);
                    onClose();
                  }}
                >
                  Sluiten
                </Button>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                {send ? (
                  <Flex alignItems={"start"}>
                    <Text ml="2" fontSize={"25px"} fontWeight="medium">
                      Message sent!
                    </Text>
                  </Flex>
                ) : (
                  <Flex alignItems={"start"}>
                    <Icon as={GoAlert} color="blue.400" fontSize={"35px"} />

                    <Text ml="2" fontSize={"25px"} fontWeight="medium">
                      John verwittigen?
                    </Text>
                  </Flex>
                )}
              </AlertDialogHeader>

              <AlertDialogFooter>
                {send ? null : (
                  <Button
                    onClick={() => {
                      invoke("send_message", {
                        deviceKey: "b63ab95c-8c42-4ac2-971e-762e1125ec2c",
                        datapoint: "Bel-john",
                        value: `John gevraagd aan scherm: ${deviceName}`,
                      })
                        .then((e) => {
                          if (e) {
                            setSend(true);
                          }
                        })
                        .catch((err) => {
                          console.log(err);
                        });
                    }}
                    mr={3}
                    colorScheme="twitter"
                    bgColor="blue.400"
                  >
                    Ja
                  </Button>
                )}

                <Button
                  ref={cancelRef}
                  onClick={() => {
                    setSend(false);
                    onClose();
                  }}
                >
                  Sluiten
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export default CallingAlert;
