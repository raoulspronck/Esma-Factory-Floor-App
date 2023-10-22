import {
  Box,
  Button,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React, { useState } from "react";
import { v4 } from "uuid";
import CircularProgressWidget from "./WidgetExample/circularProgressWidget";
import TimerWidget from "./WidgetExample/TimerWidget";
import WidgetSetup from "./WidgetSetup";

interface WidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataPoints: string[];
  deviceBlock: {
    id: string;
    key: string;
    name: string;
    display: boolean;
    widgets: any[];
  };
  setDashboard: React.Dispatch<
    React.SetStateAction<{
      layout: {
        i: string;
        x: number;
        y: number;
        w: number;
        h: number;
        static: boolean;
      }[];
      devices: any[];
    }>
  >;
  dashboard: {
    layout: {
      i: string;
      x: number;
      y: number;
      w: number;
      h: number;
      static: boolean;
    }[];
    devices: any[];
  };
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

const WidgetModal: React.FC<WidgetModalProps> = ({
  isOpen,
  onClose,
  dataPoints,
  deviceBlock,
  setDashboard,
  dashboard,
  setRefresh,
}) => {
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);
  const toast = useToast();
  const [widget, setWidget] = useState("Default");
  const [finalWidget, setFinalWidget] = useState("Default");
  const [widgetSelected, setWidgetSelected] = useState(false);
  const [dataPointsSelected, setDataPointsSelected] = useState([]);

  const saveSettings = async () => {
    let widgetHeight = 1;

    if (
      finalWidget === "Circular progress" ||
      finalWidget === "Circular progress with variable color"
    ) {
      widgetHeight = 3;
    }

    const newLayout = dashboard.layout.map((e) => {
      if (e.i === deviceBlock.id) {
        let newLay = e;

        newLay.h = e.h + widgetHeight;

        return newLay;
      }
      return e;
    });

    const newDevices = dashboard.devices.map((e: any) => {
      if (e.id === deviceBlock.id) {
        return {
          id: deviceBlock.id,
          name: deviceBlock.name,
          key: deviceBlock.key,
          display: deviceBlock.display,
          widgets: [
            {
              id: v4(),
              name: finalWidget,
              height: widgetHeight,
              datapoints: dataPointsSelected,
            },
            ...deviceBlock.widgets,
          ],
        };
      }

      return e;
    });

    return await new Promise((res) =>
      invoke("save_widget_to_dashboard", {
        dashboard: {
          layout: newLayout,
          devices: newDevices,
        },
        deviceKey: deviceBlock.key,
        dataPointsSelected,
      })
        .then((e) => {
          setDashboard(e as any);
          setRefresh(true);
          setTimeout(() => {
            setRefresh(false);
          }, 10);
          res(true);
        })
        .catch((err) => {
          console.log(err);
          res(false);
        })
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={"lg"}
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent className="notdraggable">
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          Add widget to device
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          {widgetSelected ? (
            <Flex flexDir={"column"}>
              <Heading size={"md"} mt={-5} fontWeight="medium">
                Widget: {widget.split("/")[0]}
              </Heading>

              <WidgetSetup
                widget={widget}
                dataPoints={dataPoints}
                setDataPointsSelected={setDataPointsSelected}
                dataPointsSelected={dataPointsSelected}
                finalWidget={finalWidget}
                setFinalWidget={setFinalWidget}
              />
            </Flex>
          ) : (
            <RadioGroup onChange={setWidget} value={widget}>
              <Radio value="Default">
                <Box width={"370px"}>
                  <Stat>
                    <Flex alignItems={"center"}>
                      <StatLabel fontSize={"20px"}>Aantal stuks af</StatLabel>

                      <Box ml="auto" textAlign={"right"}>
                        <StatNumber fontSize={"34px"}>234</StatNumber>
                        <StatHelpText>13h 30m 24s 20 Feb 2023</StatHelpText>
                      </Box>
                    </Flex>
                  </Stat>
                </Box>
              </Radio>

              <Radio value="Two Default/Default/Default">
                <Box width={"370px"} mt="20px">
                  <Stat>
                    <Flex>
                      <Flex alignItems={"center"} flexDir={"column"}>
                        <StatLabel fontSize={"18px"}>Aantal stuks af</StatLabel>

                        <Box ml="auto" textAlign={"right"}>
                          <StatNumber fontSize={"30px"}>234</StatNumber>
                          <StatHelpText fontSize={"12px"}>
                            13h 30m 24s 20 Feb 2023
                          </StatHelpText>
                        </Box>
                      </Flex>
                      <Flex alignItems={"center"} flexDir={"column"} ml="auto">
                        <StatLabel fontSize={"18px"}>Aantal stuks af</StatLabel>

                        <Box ml="auto" textAlign={"right"}>
                          <StatNumber fontSize={"30px"}>234</StatNumber>
                          <StatHelpText fontSize={"12px"}>
                            13h 30m 24s 20 Feb 2023
                          </StatHelpText>
                        </Box>
                      </Flex>
                    </Flex>
                  </Stat>
                </Box>
              </Radio>

              {/* <Radio value="Stat">
                <Box width={"370px"}>
                  <Stat>
                    <Flex alignItems={"center"}>
                      <StatLabel fontSize={"20px"}>Stop tijd</StatLabel>

                      <Box ml="auto" textAlign={"right"}>
                        <Flex alignItems={"end"}>
                          <StatHelpText mr={2} fontSize="16px">
                            <StatArrow type="decrease" boxSize={5} />
                            9.05%
                          </StatHelpText>
                          <StatNumber fontSize={"34px"}>00:01:23</StatNumber>
                        </Flex>
                        <StatHelpText>13h 30m 24s 20 Feb 2023</StatHelpText>
                      </Box>
                    </Flex>
                  </Stat>
                </Box>
              </Radio> */}

              <Radio value="Circular progress">
                <Box width={"370px"}>
                  <CircularProgressWidget
                    color="green"
                    maxValue={100}
                    value={60}
                  />
                </Box>
              </Radio>
              <Radio value="Timer">
                <Box width={"370px"}>
                  <TimerWidget />
                </Box>
              </Radio>
            </RadioGroup>
          )}
        </ModalBody>

        <ModalFooter>
          {widgetSelected ? (
            <>
              <Button
                colorScheme={"twitter"}
                mr={3}
                size={buttonSize}
                onClick={async () => {
                  const save = await saveSettings();
                  if (save) {
                    toast({
                      title: "Widgets are saved succesfully",
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
                Save
              </Button>
              <Button
                colorScheme="gray"
                onClick={() => {
                  setDataPointsSelected([]);
                  setWidgetSelected(false);
                }}
                size={buttonSize}
              >
                Back
              </Button>
            </>
          ) : (
            <>
              <Button
                colorScheme={"twitter"}
                mr={3}
                size={buttonSize}
                onClick={() => setWidgetSelected(true)}
              >
                Next
              </Button>
              <Button colorScheme="gray" onClick={onClose} size={buttonSize}>
                Close
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default WidgetModal;
