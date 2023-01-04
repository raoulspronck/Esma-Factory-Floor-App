import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React, { useState } from "react";
import { BiRefresh } from "react-icons/bi";
import { Store } from "tauri-plugin-store-api";

interface SerialPortSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SerialPortSettingModal: React.FC<SerialPortSettingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const modalSize = useBreakpointValue(["xs", "sm", "md"]);
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);

  const [portsAv, setPortsAv] = useState<string[]>([]);
  const [port, setPort] = useState("");
  const [dataBits, setDataBits] = useState(8);
  const [stopBits, setStopBits] = useState(1);
  const [parity, setParity] = useState(0);
  const [baudRate, setBaudRate] = useState(9600);

  const getAllAvailbleComs = () => {
    invoke("get_all_availble_ports")
      .then((message) => {
        setPortsAv(message as string[]);
      })
      .catch((error) => console.error(error));
  };

  const toast = useToast();

  const saveSettings = async () => {
    try {
      const store = new Store(".settings.dat");
      await store.set("port", port);
      await store.set("dataBits", dataBits);
      await store.set("stopBits", stopBits);
      await store.set("parity", parity);
      await store.set("baudRate", baudRate);
      await store.save();
      return true;
    } catch (error) {
      return false;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          Serial port settings
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          <Box mt={[-2, 0, 2]}>
            <FormControl>
              <FormLabel fontSize={["sm", "md", "lg"]}>Port</FormLabel>

              <Flex>
                <Select
                  mr={2}
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  size={buttonSize}
                >
                  <option value={""}>Select port</option>
                  {portsAv.map((e, key) => {
                    return (
                      <option value={e} key={key}>
                        {e}
                      </option>
                    );
                  })}
                </Select>

                <IconButton
                  size={buttonSize}
                  icon={<BiRefresh />}
                  aria-label="Load available ports"
                  onClick={() => {
                    getAllAvailbleComs();
                    if (portsAv.length > 0) setPort(portsAv[0]);
                  }}
                />
              </Flex>
            </FormControl>
          </Box>

          <Box mt={3}>
            <FormControl>
              <FormLabel fontSize={["sm", "md", "lg"]}>Baud rate</FormLabel>

              <Select
                size={buttonSize}
                ml="auto"
                value={baudRate}
                onChange={(e) => setBaudRate(parseInt(e.target.value))}
              >
                <option value={"300"}>300</option>
                <option value={"1200"}>1200</option>
                <option value={"2400"}>2400</option>
                <option value={"4800"}>4800</option>
                <option value={"9600"}>9600</option>
                <option value={"19200"}>19200</option>
                <option value={"38400"}>38400</option>
                <option value={"57600"}>57600</option>
                <option value={"115200"}>115200</option>
              </Select>
            </FormControl>
          </Box>

          <Box mt={3}>
            <FormControl>
              <FormLabel fontSize={["sm", "md", "lg"]}>Data bits</FormLabel>

              <NumberInput
                size={buttonSize}
                defaultValue={7}
                min={5}
                max={8}
                value={dataBits}
                onChange={(e) => setDataBits(parseInt(e))}
                ml="auto"
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </Box>

          <Box mt={3}>
            <FormControl>
              <FormLabel fontSize={["sm", "md", "lg"]}>Stop bits</FormLabel>

              <NumberInput
                size={buttonSize}
                defaultValue={1}
                min={1}
                max={2}
                value={stopBits}
                onChange={(e) => setStopBits(parseInt(e))}
                ml="auto"
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </Box>

          <Box mt={3}>
            <FormControl>
              <FormLabel fontSize={["sm", "md", "lg"]}>Parity</FormLabel>

              <Select
                size={buttonSize}
                value={parity}
                onChange={(e) => setParity(parseInt(e.target.value))}
                ml="auto"
              >
                <option value={"0"}>None</option>
                <option value={"2"}>Even</option>
                <option value={"1"}>Odd</option>
              </Select>
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

                onClose();
                return;
              }
              toast({
                title: "Something went wrong. Try again later",
                status: "error",
              });
            }}
          >
            Save and restart
          </Button>

          <Button colorScheme="gray" onClick={onClose} size={buttonSize}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SerialPortSettingModal;
