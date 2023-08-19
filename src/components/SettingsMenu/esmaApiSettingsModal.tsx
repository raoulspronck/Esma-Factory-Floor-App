import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
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

interface EsmaApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;

  apiUsername: string;
  setApiUsername: React.Dispatch<React.SetStateAction<string>>;
  apiPassword: string;
  setApiPassword: React.Dispatch<React.SetStateAction<string>>;
}

const EsmaApiSettingsModal: React.FC<EsmaApiSettingsModalProps> = ({
  isOpen,
  onClose,
  apiPassword,
  apiUsername,
  setApiPassword,
  setApiUsername,
}) => {
  const modalSize = useBreakpointValue(["xs", "sm", "lg"]);
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);
  const toast = useToast();

  const saveSettings = async () => {
    try {
      return await new Promise((res) =>
        invoke("save_api_settings", {
          username: apiUsername,
          password: apiPassword,
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
          Esma API settings
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          <Box mt={[-2, 0, 2]}>
            <FormControl>
              <FormLabel fontSize={["xs", "sm", "md"]}>Username</FormLabel>

              <Input
                size={buttonSize}
                fontSize={["xs", "sm", "md"]}
                value={apiUsername}
                onChange={(e) => setApiUsername(e.target.value)}
                placeholder="username"
              />
            </FormControl>
          </Box>

          <Box mt={3}>
            <FormControl>
              <Flex>
                <FormLabel fontSize={["xs", "sm", "md"]}>password</FormLabel>
              </Flex>

              <Input
                size={buttonSize}
                fontSize={["xs", "sm", "md"]}
                value={apiPassword}
                onChange={(e) => setApiPassword(e.target.value)}
                type="password"
                placeholder="password"
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
                  title: "Your api credentials are saved succesfully",
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

export default EsmaApiSettingsModal;
