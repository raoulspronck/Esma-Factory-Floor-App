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
  Text,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { v4 } from "uuid";
import CircularProgressWidget from "./WidgetExample/circularProgressWidget";
import TimerWidget from "./WidgetExample/TimerWidget";
import WidgetSetup from "./WidgetSetup";
import CustomInputExampleWidget from "./WidgetExample/CustomInputExampleWidget";
import { useDashboardStore } from "../../../stores/dashboardStore";
import { useDeviceData } from "../../../hooks/useDeviceData";
import { Widget } from "../../../types";
import { findFreeSlot } from "../../../utils/gridPacking";

interface WidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string | null;
  deviceName?: string;
}

interface WidgetSize {
  w: number;
  h: number;
}

const SIZE_OPTIONS: (WidgetSize & { label: string })[] = [
  { w: 1, h: 1, label: "1×1" },
  { w: 2, h: 1, label: "2×1" },
  { w: 1, h: 2, label: "1×2" },
  { w: 2, h: 2, label: "2×2" },
];

const defaultSizeFor = (widgetType: string): WidgetSize => {
  if (widgetType === "Circular progress") return { w: 2, h: 2 };
  if (widgetType.startsWith("Two Default")) return { w: 2, h: 1 };
  return { w: 1, h: 1 };
};

const WidgetModal: React.FC<WidgetModalProps> = ({ isOpen, onClose, deviceId, deviceName }) => {
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);
  const toast = useToast();
  const dashboard = useDashboardStore((s) => s.dashboard);
  const addWidget = useDashboardStore((s) => s.addWidget);
  const deviceData = useDeviceData(deviceId ?? "");
  const dataPoints = deviceData?.dataPoint ?? [];

  const [widget, setWidget] = useState("Default");
  const [finalWidget, setFinalWidget] = useState("Default");
  const [widgetSelected, setWidgetSelected] = useState(false);
  const [dataPointsSelected, setDataPointsSelected] = useState([]);
  const [size, setSize] = useState<WidgetSize>({ w: 1, h: 1 });

  useEffect(() => {
    if (widgetSelected) setSize(defaultSizeFor(widget));
  }, [widgetSelected, widget]);

  const saveSettings = async () => {
    if (!deviceId) return false;

    // Placement is local to this device's own 2x8 strip — other devices'
    // widgets live in their own strips and can't collide.
    const device = dashboard.devices.find((d) => d.id === deviceId);
    const { x, y } = findFreeSlot(device?.widgets ?? [], size.w, size.h);

    const newWidget: Widget = {
      id: v4(),
      name: finalWidget,
      x,
      y,
      w: size.w,
      h: size.h,
      datapoints: dataPointsSelected,
    };

    try {
      await addWidget(deviceId, newWidget);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  };

  const resetAndClose = () => {
    setWidget("Default");
    setFinalWidget("Default");
    setWidgetSelected(false);
    setDataPointsSelected([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} size={"lg"} closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent className="notdraggable">
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          Add widget{deviceName ? ` to ${deviceName}` : ""}
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          {widgetSelected ? (
            <Flex flexDir={"column"}>
              <Heading size={"md"} mt={-5} fontWeight="medium">
                Widget: {widget.split("/")[0]}
              </Heading>

              <Box mt={5}>
                <Text fontSize={["sm", "md", "lg"]} mb={2} fontWeight="medium">
                  Widget size
                </Text>
                <Flex gap={3}>
                  {SIZE_OPTIONS.map((opt) => {
                    const selected = size.w === opt.w && size.h === opt.h;
                    return (
                      <Flex
                        key={opt.label}
                        as="button"
                        type="button"
                        onClick={() => setSize({ w: opt.w, h: opt.h })}
                        direction="column"
                        alignItems="center"
                        justifyContent="center"
                        p={2}
                        minW="60px"
                        borderRadius="md"
                        border="2px solid"
                        borderColor={selected ? "twitter.400" : "whiteAlpha.300"}
                        bg={selected ? "whiteAlpha.200" : "transparent"}
                      >
                        <Box width={`${opt.w * 18}px`} height={`${opt.h * 18}px`} bg="whiteAlpha.600" borderRadius="sm" mb={1} />
                        <Text fontSize="xs">{opt.label}</Text>
                      </Flex>
                    );
                  })}
                </Flex>
              </Box>

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
              <Radio value="Custom input" mt={5}>
                <Box width={"370px"}>
                  <CustomInputExampleWidget />
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

                    resetAndClose();
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
              <Button colorScheme="gray" onClick={resetAndClose} size={buttonSize}>
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
