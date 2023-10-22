import { Flex, Box, IconButton } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { AiOutlineMinusSquare } from "react-icons/ai";
import CircularProgressWidget from "./Widgets/CircularProgressWidget";
import CircularProgressWidgetWithVariableColor from "./Widgets/CircularProgressWidgetWithVariableColor";
import DefaultWidget from "./Widgets/DefaultWidget";
import TimerWidget from "./Widgets/TimerWidget";
import ValueWithProgressWidget from "./Widgets/ValueWithProgressWidget";
import TimePredictionWidget from "./Widgets/TimePredictionWidget";

interface DisplayWidgetProps {
  deviceKey: string;
  deviceId: string;
  layoutChangable: boolean;
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
  widget: {
    id: string;
    name: string;
    height: number;
    datapoints: string[];
  };
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  dataPoints: any[];
}

const DisplayWidget: React.FC<DisplayWidgetProps> = ({
  deviceKey,
  widget,
  deviceId,
  layoutChangable,
  dashboard,
  setDashboard,
  setRefresh,
  dataPoints,
}) => {
  const deleteWidget = async () => {
    let widgetHeight = 1;

    if (
      widget.name === "Circular progress" ||
      widget.name === "Circular progress with variable color"
    ) {
      widgetHeight = 3;
    }

    const newLayout = dashboard.layout.map((e) => {
      if (e.i === deviceId) {
        let newLay = e;
        newLay.h = e.h - widgetHeight;
        return newLay;
      }
      return e;
    });

    const newDevices = dashboard.devices.map((e) => {
      if (e.id === deviceId) {
        return {
          id: e.id,
          name: e.name,
          key: e.key,
          display: true,
          widgets: e.widgets.filter((i: any) => i.id !== widget.id),
        };
      }

      return e;
    });

    setDashboard({
      layout: newLayout,
      devices: newDevices,
    });

    setRefresh(true);
    setTimeout(() => {
      setRefresh(false);
    }, 10);
  };

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
        <Flex alignItems={"center"}>
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
        <Flex alignItems={"center"}>
          <Box width={"100%"}>
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
        <Flex alignItems={"center"}>
          <Box width={"100%"}>
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

    case "Timer":
      return (
        <Flex alignItems={"center"}>
          <Box width={"100%"}>
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
        <Flex alignItems={"center"}>
          <Box width={"100%"}>
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
        <Flex alignItems={"center"}>
          <Box width={"100%"}>
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
        <Flex alignItems={"center"}>
          <Box width={"100%"}>
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
        <Flex alignItems={"center"}>
          <Box width={"100%"}>
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
