import {
  Box,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import React from "react";
import RS232Monitor from "../../../pages/RS232Monitor";
import { useConnectionStore } from "../../../stores/connectionStore";

interface RS232MonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RS232MonitorModal: React.FC<RS232MonitorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const rs232Error = useConnectionStore((s) => s.rs232Error);
  const fileSend = useConnectionStore((s) => s.fileSend);
  const fileReceive = useConnectionStore((s) => s.fileReceive);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
      <ModalOverlay />
      <ModalContent bgColor="gray.900" color="white" height="80vh">
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          RS-232 monitor
        </ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody
          p={0}
          display="flex"
          flexDir="column"
          overflow="hidden"
          position="relative"
        >
          <Box flex="1" minHeight={0} width="100%">
            <RS232Monitor />
          </Box>

          {rs232Error && !fileSend && !fileReceive && (
            <Flex
              width="100%"
              height="70px"
              position="absolute"
              bottom="20px"
              justifyContent="center"
            >
              <Flex
                height="100%"
                width={["250px", "300px", "400px"]}
                backgroundColor="red"
                color="white"
                justifyContent="center"
                alignItems="center"
                borderRadius={["12px", "16px", "20px"]}
                fontSize={["12px", "16px", "20px"]}
                fontWeight="medium"
                p="5"
              >
                {rs232Error}
              </Flex>
            </Flex>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default RS232MonitorModal;
