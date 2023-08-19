import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React from "react";
import { Store } from "tauri-plugin-store-api";

interface ExaliseSettingModalProps {
  isOpen: boolean;
  onClose: () => void;

  mqttKey: string;
  setMqttKey: React.Dispatch<React.SetStateAction<string>>;
  mqttSecret: string;
  setMqttSecret: React.Dispatch<React.SetStateAction<string>>;
  deviceKey: string;
  setDeviceKey: React.Dispatch<React.SetStateAction<string>>;
}

const ExaliseSettingModal: React.FC<ExaliseSettingModalProps> = ({
  isOpen,
  onClose,
  mqttKey,
  setMqttKey,
  mqttSecret,
  setMqttSecret,
  deviceKey,
  setDeviceKey,
}) => {
  const modalSize = useBreakpointValue(["xs", "sm", "lg"]);
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);

  const [show, setShow] = React.useState(false);
  const handleClick = () => setShow(!show);

  const toast = useToast();

  const saveSettings = async () => {
    try {
      return await new Promise((res) =>
        invoke("save_exalise_mqtt_settings", {
          mqttKey,
          mqttSecret,
          deviceKey,
        })
          .then((_e) => res(true))
          .catch((_e) => {
            res(false);
          })
      );
    } catch (error) {
      return false;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          Exalise mqtt settings
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          <Box mt={[-2, 0, 2]}>
            <FormControl>
              <FormLabel fontSize={["xs", "sm", "md"]}>Mqtt key</FormLabel>

              <Input
                size={buttonSize}
                fontSize={["xs", "sm", "md"]}
                value={mqttKey}
                onChange={(e) => setMqttKey(e.target.value)}
              />
            </FormControl>
          </Box>

          <Box mt={3}>
            <FormControl>
              <FormLabel fontSize={["xs", "sm", "md"]}>Mqtt secret</FormLabel>

              <InputGroup size={buttonSize}>
                <Input
                  type={show ? "text" : "password"}
                  value={mqttSecret}
                  onChange={(e) => setMqttSecret(e.target.value)}
                  fontSize={["xs", "sm", "md"]}
                />
                <InputRightElement width="4.5rem">
                  <Button h="1.75rem" size="sm" onClick={handleClick}>
                    {show ? "Hide" : "Show"}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </Box>

          <Box mt={3}>
            <FormControl>
              <FormLabel fontSize={["xs", "sm", "md"]}>Device key</FormLabel>

              <Input
                size={buttonSize}
                fontSize={["xs", "sm", "md"]}
                value={deviceKey}
                onChange={(e) => setDeviceKey(e.target.value)}
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
              const save = await saveSettings();
              if (save) {
                toast({
                  title: "Your credentials are saved succesfully",
                  status: "success",
                });

                if (!toast.isActive("reload-toast")) {
                  toast({
                    id: "reload-toast",
                    title:
                      "Sluit en herstart deze app om de verandering in werking te zetten",
                    status: "warning",
                    duration: null,
                    isClosable: false,
                  });
                }

                onClose();
                return;
              }
              toast({
                title: "Something went wrong. Try again later",
                status: "error",
              });
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

export default ExaliseSettingModal;
