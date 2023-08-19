import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  PinInput,
  PinInputField,
  useToast,
} from "@chakra-ui/react";
import React, { useState, useEffect, useRef } from "react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  setLogin: React.Dispatch<React.SetStateAction<boolean>>;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  setLogin,
}) => {
  const toast = useToast();

  const [code, setCode] = useState("");

  const firstInput = useRef(null);

  useEffect(() => {
    if (code.length === 4) {
      if (code === "1234") {
        toast({
          title: "Succesvol ingelogd",
          status: "success",
        });

        onClose();
        setLogin(true);
        return;
      }
      toast({
        title: "Foute code, probeer opnieuw",
        status: "error",
      });
      setCode("");
      if (firstInput.current !== null) {
        firstInput.current.focus();
      }
    }
  }, [code]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"lg"}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          Login om alle functies te kunnen gebruiken
        </ModalHeader>
        <ModalCloseButton size={"lg"} />
        <ModalBody>
          <Flex>
            <PinInput
              size={"lg"}
              autoFocus={true}
              value={code}
              onChange={(e) => setCode(e)}
            >
              <PinInputField ref={firstInput} />
              <PinInputField />
              <PinInputField />
              <PinInputField />
            </PinInput>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="gray" onClick={onClose} size={"lg"}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default LoginModal;
