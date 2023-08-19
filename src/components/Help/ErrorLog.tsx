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

interface ErrorLogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ErrorLog: React.FC<ErrorLogProps> = ({ isOpen, onClose }) => {
  const modalSize = useBreakpointValue(["xs", "sm", "lg"]);
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          App Logs
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody></ModalBody>

        <ModalFooter>
          <Button colorScheme="gray" onClick={onClose} size={buttonSize}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ErrorLog;
