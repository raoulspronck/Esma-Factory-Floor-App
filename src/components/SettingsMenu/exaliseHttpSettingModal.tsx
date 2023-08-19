/* eslint-disable  no-unused-vars */

import {
  Box,
  Button,
  Flex,
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
  Textarea,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React from "react";
import { Store } from "tauri-plugin-store-api";

interface ExaliseHttpSettingModalProps {
  isOpen: boolean;
  onClose: () => void;

  httpKey: string;
  setHttpKey: React.Dispatch<React.SetStateAction<string>>;
  httpSecret: string;
  setHttpSecret: React.Dispatch<React.SetStateAction<string>>;
}

const ExaliseHttpSettingModal: React.FC<ExaliseHttpSettingModalProps> = ({
  isOpen,
  onClose,
  httpKey,
  httpSecret,
  setHttpKey,
  setHttpSecret,
}) => {
  const modalSize = useBreakpointValue(["xs", "sm", "lg"]);
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);
  const toast = useToast();

  const saveSettings = async () => {
    try {
      return await new Promise((res) =>
        invoke("save_exalise_http_settings", {
          httpKey,
          httpSecret,
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
          Exalise http settings
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          <Box mt={[-2, 0, 2]}>
            <FormControl>
              <FormLabel fontSize={["xs", "sm", "md"]}>Http key</FormLabel>

              <Textarea
                size={buttonSize}
                fontSize={["xs", "sm", "md"]}
                value={httpKey}
                onChange={(e) => setHttpKey(e.target.value)}
                rows={5}
                style={{ resize: "none" }}
              />
            </FormControl>
          </Box>

          <Box mt={3}>
            <FormControl>
              <Flex>
                <FormLabel fontSize={["xs", "sm", "md"]}>Http secret</FormLabel>
              </Flex>

              <InputGroup size={buttonSize}>
                <Textarea
                  rows={6}
                  value={httpSecret}
                  onChange={(e) => setHttpSecret(e.target.value)}
                  fontSize={["xs", "sm", "md"]}
                  style={{ resize: "none" }}
                />
              </InputGroup>
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
                  title: "Your http credentials are saved succesfully",
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

export default ExaliseHttpSettingModal;
