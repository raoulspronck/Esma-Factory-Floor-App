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
  useBreakpointValue,
  Text,
  Checkbox,
  LightMode,
  Box,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";

interface ErrorLogProps {
  isOpen: boolean;
  onClose: () => void;
  connectionErrorText: string[];
}

const ErrorLog: React.FC<ErrorLogProps> = ({
  isOpen,
  onClose,
  connectionErrorText,
}) => {
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);
  const autoScroll = useRef(true);
  const [checkBox, setCheckBox] = useState(autoScroll.current);
  const endOfDiv = useRef(null);

  useEffect(() => {
    if (endOfDiv.current !== null && autoScroll.current) {
      endOfDiv.current.scrollIntoView();
    }
  }, [connectionErrorText]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"4xl"}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize={"25px"} mt={[-2, -2, -1]}>
          App Logs
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          <Box mt={2} ml={5}>
            <LightMode>
              <Checkbox
                isChecked={checkBox}
                onChange={(e) => {
                  autoScroll.current = e.target.checked;
                  setCheckBox(e.target.checked);
                }}
                borderColor="gray.400"
              >
                <Text fontSize={"15px"} fontWeight="medium" color="gray.800">
                  Auto scroll
                </Text>
              </Checkbox>
            </LightMode>
          </Box>

          <Flex flexDir={"column"} p={5} maxHeight={"65vh"} overflow={"auto"}>
            {connectionErrorText.map((e, key) => {
              const split = e.split("+01:00 -");

              return (
                <Flex key={key} mb={2}>
                  <Text
                    fontStyle={"italic"}
                    textColor={"gray.500"}
                    mr={2}
                    minW="fit-content"
                  >
                    {split[0].substring(0, 19)}
                  </Text>
                  <Text textColor={"gray.700"}>{split[1]}</Text>
                </Flex>
              );
            })}
            <div ref={endOfDiv} style={{ marginTop: "20px" }}></div>
          </Flex>
        </ModalBody>

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
