import { Flex, Box, IconButton } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { AiOutlineMinusSquare } from "react-icons/ai";
import CircularProgressWidget from "./Widgets/CircularProgressWidget";
import CircularProgressWidgetWithVariableColor from "./Widgets/CircularProgressWidgetWithVariableColor";
import DefaultWidget from "./Widgets/DefaultWidget";
import TimerWidget from "./Widgets/TimerWidget";
import ValueWithProgressWidget from "./Widgets/ValueWithProgressWidget";
import TimePredictionWidget from "./Widgets/TimePredictionWidget";
import SwitchWidget from "./Widgets/SwitchWidget";
import SliderWidget from "./Widgets/SliderWidget";
import CustomInputWidget from "./Widgets/CustomInputWidget";
import { STAT_DIVIDER_COLOR } from "./Widgets/widgetTokens";
import { useDashboardStore } from "../../../stores/dashboardStore";

interface DisplayWidgetProps {
  deviceKey: string;
  deviceId: string;
  layoutChangable: boolean;
  widget: {
    id: string;
    name: string;
    datapoints: string[];
  };
  dataPoints: any[];
  small?: number;
}

const DisplayWidget: React.FC<DisplayWidgetProps> = ({
  deviceKey,
  widget,
  deviceId,
  layoutChangable,
  dataPoints,
  small,
}) => {
  const removeWidget = useDashboardStore((s) => s.removeWidget);
  const deleteWidget = () => removeWidget(deviceId, widget.id);

  const [type, setType] = useState([]);

  useEffect(() => {
    try {
      const types = [];
      for (let index = 0; index < widget.datapoints.length; index++) {
        const currentDatapointType = dataPoints.find(
          (e) => e.key === widget.datapoints[index]
        ).type;
        types.push(currentDatapointType);
      }

      setType(types);
    } catch (_error) {}
  }, [dataPoints]);

  switch (widget.name.split("/")[0]) {
    case "Two Default":
      return (
        <Flex alignItems={"stretch"} height="100%">
          <Box flex="1" minW={0}>
            {widget.name.split("/")[1] === "Time prediction" ? (
              <TimePredictionWidget
                dataPoints={widget.datapoints}
                deviceKey={deviceKey}
                deviceId={deviceId}
                types={type}
                small={0}
              />
            ) : (
              <DefaultWidget
                dataPoints={widget.datapoints}
                deviceKey={deviceKey}
                deviceId={deviceId}
                types={type}
                small={0}
              />
            )}
          </Box>

          <Box width="1px" alignSelf="stretch" bg={STAT_DIVIDER_COLOR} my={4} />

          <Box flex="1" minW={0}>
            {widget.name.split("/")[2] === "Time prediction" ? (
              <TimePredictionWidget
                dataPoints={widget.datapoints}
                deviceKey={deviceKey}
                deviceId={deviceId}
                types={type}
                small={1}
              />
            ) : (
              <DefaultWidget
                dataPoints={widget.datapoints}
                deviceKey={deviceKey}
                deviceId={deviceId}
                types={type}
                small={1}
              />
            )}
          </Box>

          {layoutChangable ? (
            <IconButton
              icon={<AiOutlineMinusSquare />}
              aria-label="Delete widget"
              colorScheme={"blackAlpha"}
              size="sm"
              ml="1"
              onClick={deleteWidget}
            />
          ) : null}
        </Flex>
      );

    case "Circular progress with variable color":
      return (
        <Flex alignItems={"center"} height="100%">
          <Box width={"100%"} height="100%">
            <CircularProgressWidgetWithVariableColor
              deviceId={deviceId}
              dataPoints={widget.datapoints}
              deviceKey={deviceKey}
            />
          </Box>

          {layoutChangable ? (
            <IconButton
              icon={<AiOutlineMinusSquare />}
              aria-label="Delete widget"
              colorScheme={"blackAlpha"}
              size="sm"
              ml="1"
              onClick={deleteWidget}
            />
          ) : null}
        </Flex>
      );

    case "Circular progress":
      return (
        <Flex alignItems={"center"} height="100%">
          <Box width={"100%"} height="100%">
            <CircularProgressWidget
              deviceId={deviceId}
              dataPoints={widget.datapoints}
              deviceKey={deviceKey}
            />
          </Box>

          {layoutChangable ? (
            <IconButton
              icon={<AiOutlineMinusSquare />}
              aria-label="Delete widget"
              colorScheme={"blackAlpha"}
              size="sm"
              ml="1"
              onClick={deleteWidget}
            />
          ) : null}
        </Flex>
      );

    case "Switch":
      return (
        <Flex alignItems={"center"} height="100%">
          <Box width={"100%"} height="100%">
            <SwitchWidget
              deviceId={deviceId}
              dataPoints={widget.datapoints}
              deviceKey={deviceKey}
              types={type}
            />
          </Box>

          {layoutChangable ? (
            <IconButton
              icon={<AiOutlineMinusSquare />}
              aria-label="Delete widget"
              colorScheme={"blackAlpha"}
              size="sm"
              ml="1"
              onClick={deleteWidget}
            />
          ) : null}
        </Flex>
      );

    case "Custom input":
      return (
        <Flex alignItems={"center"} height="100%">
          <Box width={"100%"} height="100%">
            <CustomInputWidget
              deviceId={deviceId}
              dataPoints={widget.datapoints}
              deviceKey={deviceKey}
              types={type}
            />
          </Box>

          {layoutChangable ? (
            <IconButton
              icon={<AiOutlineMinusSquare />}
              aria-label="Delete widget"
              colorScheme={"blackAlpha"}
              size="sm"
              ml="1"
              onClick={deleteWidget}
            />
          ) : null}
        </Flex>
      );

    case "Slider":
      return (
        <Flex alignItems={"center"} height="100%">
          <Box width={"100%"} height="100%">
            <SliderWidget
              deviceId={deviceId}
              dataPoints={widget.datapoints}
              deviceKey={deviceKey}
              types={type}
            />
          </Box>

          {layoutChangable ? (
            <IconButton
              icon={<AiOutlineMinusSquare />}
              aria-label="Delete widget"
              colorScheme={"blackAlpha"}
              size="sm"
              ml="1"
              onClick={deleteWidget}
            />
          ) : null}
        </Flex>
      );

    case "Timer":
      return (
        <Flex alignItems={"center"} height="100%">
          <Box width={"100%"} height="100%">
            <TimerWidget
              deviceId={deviceId}
              dataPoints={widget.datapoints}
              deviceKey={deviceKey}
            />
          </Box>

          {layoutChangable ? (
            <IconButton
              icon={<AiOutlineMinusSquare />}
              aria-label="Delete widget"
              colorScheme={"blackAlpha"}
              size="sm"
              ml="1"
              onClick={deleteWidget}
            />
          ) : null}
        </Flex>
      );

    case "Default progress up":
      return (
        <Flex alignItems={"center"} height="100%">
          <Box width={"100%"} height="100%">
            <ValueWithProgressWidget
              up={true}
              dataPoints={widget.datapoints}
              deviceKey={deviceKey}
              deviceId={deviceId}
              types={type}
            />
          </Box>

          {layoutChangable ? (
            <IconButton
              icon={<AiOutlineMinusSquare />}
              aria-label="Delete widget"
              colorScheme={"blackAlpha"}
              size="sm"
              ml="1"
              onClick={deleteWidget}
            />
          ) : null}
        </Flex>
      );

    case "Default progress down":
      return (
        <Flex alignItems={"center"} height="100%">
          <Box width={"100%"} height="100%">
            <ValueWithProgressWidget
              up={false}
              dataPoints={widget.datapoints}
              deviceKey={deviceKey}
              deviceId={deviceId}
              types={type}
            />
          </Box>

          {layoutChangable ? (
            <IconButton
              icon={<AiOutlineMinusSquare />}
              aria-label="Delete widget"
              colorScheme={"blackAlpha"}
              size="sm"
              ml="1"
              onClick={deleteWidget}
            />
          ) : null}
        </Flex>
      );

    case "Time prediction":
      return (
        <Flex alignItems={"center"} height="100%">
          <Box width={"100%"} height="100%">
            <TimePredictionWidget
              dataPoints={widget.datapoints}
              deviceKey={deviceKey}
              deviceId={deviceId}
              types={type}
            />
          </Box>

          {layoutChangable ? (
            <IconButton
              icon={<AiOutlineMinusSquare />}
              aria-label="Delete widget"
              colorScheme={"blackAlpha"}
              size="sm"
              ml="1"
              onClick={deleteWidget}
            />
          ) : null}
        </Flex>
      );

    default:
      return (
        <Flex alignItems={"center"} height="100%">
          <Box width={"100%"} height="100%">
            <DefaultWidget
              dataPoints={widget.datapoints}
              deviceKey={deviceKey}
              deviceId={deviceId}
              types={type}
            />
          </Box>

          {layoutChangable ? (
            <IconButton
              icon={<AiOutlineMinusSquare />}
              aria-label="Delete widget"
              colorScheme={"blackAlpha"}
              size="sm"
              ml="1"
              onClick={deleteWidget}
            />
          ) : null}
        </Flex>
      );
  }
};

export default DisplayWidget;
