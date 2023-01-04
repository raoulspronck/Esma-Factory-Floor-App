import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  LightMode,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  useBreakpointValue,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React, { useEffect, useState } from "react";
import { BiRefresh } from "react-icons/bi";
import { Store } from "tauri-plugin-store-api";

interface SerialPortSettingTaskBarProps {
  port: string;
  setPort: React.Dispatch<React.SetStateAction<string>>;
  dataBits: number;
  setDataBits: React.Dispatch<React.SetStateAction<number>>;
  stopBits: number;
  setStopBits: React.Dispatch<React.SetStateAction<number>>;
  parity: number;
  setParity: React.Dispatch<React.SetStateAction<number>>;
  baudRate: number;
  setBaudRate: React.Dispatch<React.SetStateAction<number>>;
  restartRs232Monitoring: () => void;
}

const SerialPortSettingTaskBar: React.FC<SerialPortSettingTaskBarProps> = ({
  port,
  baudRate,
  dataBits,
  parity,
  setBaudRate,
  setDataBits,
  setParity,
  setPort,
  setStopBits,
  stopBits,
  restartRs232Monitoring,
}) => {
  const buttonSize = useBreakpointValue(["xs", "xs", "sm"]);
  const fontSize = useBreakpointValue(["12px", "14px", "16px"]);

  const [portsAv, setPortsAv] = useState<string[]>([]);

  const [unsavedchanges, setunsavedchanges] = useState(false);

  const getAllAvailbleComs = () => {
    invoke("get_all_availble_ports")
      .then((message) => {
        setPortsAv(message as string[]);
      })
      .catch((error) => console.error(error));
  };

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

  useEffect(() => {
    getAllAvailbleComs();
  }, []);

  return (
    <Flex
      height={["70px", "80px", "50px"]}
      bgColor={"#5c5c5c"}
      color="white"
      pl={[1, 2, 3]}
      borderBottom={"1px solid"}
      borderColor="blackAlpha.900"
      alignItems={"center"}
    >
      <Flex flexDir={["column", "column", "row"]} width={"fit-content"}>
        <Flex alignItems="center" width={"fit-content"}>
          <FormControl size={buttonSize} width={["165px", "190px", "220px"]}>
            <Flex alignItems="center">
              <FormLabel fontSize={fontSize} mt="2" mr="1">
                Port:
              </FormLabel>
              <LightMode>
                <Select
                  fontSize={fontSize}
                  width={"fit-content"}
                  mr={[1, 2, 2]}
                  value={port}
                  onChange={(e) => {
                    setPort(e.target.value);
                    setunsavedchanges(true);
                  }}
                  size={buttonSize}
                  className={"taskbarSelect"}
                  height={["25px", "25px", "30px"]}
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
              </LightMode>
              <LightMode>
                <IconButton
                  colorScheme={"blackAlpha"}
                  size={buttonSize}
                  fontSize={["18px", "18px", "22px"]}
                  icon={<BiRefresh />}
                  aria-label="Load available ports"
                  onClick={() => {
                    getAllAvailbleComs();
                    if (portsAv.length > 0) setPort(portsAv[0]);
                  }}
                />
              </LightMode>
            </Flex>
          </FormControl>

          <FormControl
            size={buttonSize}
            width={["165px", "165px", "185px"]}
            //ml="-2"
          >
            <Flex alignItems="center">
              <FormLabel fontSize={fontSize} mt="2" mr="1">
                Baud rate:
              </FormLabel>
              <LightMode>
                <Select
                  size={buttonSize}
                  width="fit-content"
                  value={baudRate}
                  onChange={(e) => {
                    setBaudRate(parseInt(e.target.value));
                    setunsavedchanges(true);
                  }}
                  className={"taskbarSelect"}
                  height={["25px", "25px", "30px"]}
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
              </LightMode>
            </Flex>
          </FormControl>
        </Flex>
        <Flex alignItems="center" width={"fit-content"}>
          <FormControl
            size={buttonSize}
            width={["110px", "120px", "140px"]}
            ml={[0, 0, 2]}
          >
            <Flex alignItems="center">
              <FormLabel fontSize={fontSize} mt="2" mr={1}>
                Data bits:
              </FormLabel>
              <NumberInput
                size={buttonSize}
                defaultValue={7}
                min={5}
                max={8}
                value={dataBits}
                onChange={(e) => {
                  setDataBits(parseInt(e));
                  setunsavedchanges(true);
                }}
                width={["50px", "55px", "65px"]}
                height={["25px", "25px", "30px"]}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Flex>
          </FormControl>

          <FormControl
            size={buttonSize}
            width={["110px", "120px", "140px"]}
            ml={[1, 3, 5]}
          >
            <Flex alignItems="center">
              <FormLabel fontSize={fontSize} mt="2" mr={1}>
                Stop bits:
              </FormLabel>
              <NumberInput
                size={buttonSize}
                defaultValue={1}
                min={1}
                max={2}
                value={stopBits}
                onChange={(e) => {
                  setStopBits(parseInt(e));
                  setunsavedchanges(true);
                }}
                width={["50px", "55px", "65px"]}
                height={["25px", "25px", "30px"]}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Flex>
          </FormControl>

          <FormControl
            size={buttonSize}
            width={["120px", "120px", "135px"]}
            ml={[1, 3, 5]}
          >
            <Flex alignItems="center">
              <FormLabel fontSize={fontSize} mt="2" mr={1}>
                Parity:
              </FormLabel>
              <LightMode>
                <Select
                  size={buttonSize}
                  value={parity}
                  onChange={(e) => {
                    setParity(parseInt(e.target.value));
                    setunsavedchanges(true);
                  }}
                  width={"fit-content"}
                  className={"taskbarSelect"}
                  height={["25px", "25px", "30px"]}
                >
                  <option value={"0"}>None</option>
                  <option value={"2"}>Even</option>
                  <option value={"1"}>Odd</option>
                </Select>
              </LightMode>
            </Flex>
          </FormControl>
        </Flex>
      </Flex>
      {unsavedchanges ? (
        <LightMode>
          <Button
            colorScheme={"twitter"}
            height={["35px", "40px", "30px"]}
            ml="auto"
            mr={3}
            size={buttonSize}
            onClick={async () => {
              const save = await saveSettings();
              if (save) {
                setunsavedchanges(false);
                return;
              }
            }}
          >
            Save
          </Button>
        </LightMode>
      ) : null}
    </Flex>
  );
};

export default SerialPortSettingTaskBar;
