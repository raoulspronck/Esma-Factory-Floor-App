import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightAddon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  useBreakpointValue,
} from "@chakra-ui/react";
import React, { useState } from "react";

interface SaveInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  serialInput: {
    time: string;
    message: string;
    hex: string;
  }[];
}

const SaveInputModal: React.FC<SaveInputModalProps> = ({
  isOpen,
  onClose,
  serialInput,
}) => {
  const [fileName, setFileName] = useState("");
  const [timeStamp, setTimeStamp] = useState(false);
  const [ascii, setAscii] = useState(true);
  const [decimal, setDecimal] = useState(false);

  const modalSize = useBreakpointValue(["sm", "lg", "2xl"]);
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);

  function DownloadInput() {
    const fileData = serialInput.map((e) => {
      return `${timeStamp ? e.time + "  " : ""}${
        ascii ? e.message + "  " : ""
      }${decimal ? e.hex : ""}\r\n`;
    });

    const blob = new Blob(fileData, { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${fileName !== "" ? fileName : "input"}.txt`;
    link.href = url;
    link.click();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          Save input
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          <Box mt={[-2, 0, 2]}>
            <FormControl fontSize={["sm", "md", "lg"]}>
              <Flex alignItems="center">
                <FormLabel fontSize={["sm", "md", "lg"]}>Include</FormLabel>
              </Flex>
              <Stack spacing={[1, 5]} direction={["column", "row"]}>
                <Checkbox
                  isChecked={ascii}
                  onChange={(e) => setAscii(e.target.checked)}
                >
                  ASCII
                </Checkbox>
                <Checkbox
                  isChecked={timeStamp}
                  onChange={(e) => setTimeStamp(e.target.checked)}
                >
                  TimeStamp
                </Checkbox>

                <Checkbox
                  isChecked={decimal}
                  onChange={(e) => setDecimal(e.target.checked)}
                >
                  Decimal
                </Checkbox>
              </Stack>
            </FormControl>
          </Box>

          <Box mt={3}>
            <FormControl fontSize={["sm", "md", "lg"]}>
              <Flex alignItems="center">
                <FormLabel fontSize={["sm", "md", "lg"]}>File name</FormLabel>
              </Flex>
              <InputGroup size={buttonSize}>
                <Input
                  fontSize={["sm", "md", "lg"]}
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
                <InputRightAddon children=".txt" />
              </InputGroup>
            </FormControl>
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme={"twitter"}
            mr={3}
            size={buttonSize}
            onClick={() => {
              DownloadInput();
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

export default SaveInputModal;
