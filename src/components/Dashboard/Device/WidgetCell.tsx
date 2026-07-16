import React from "react";
import { Box } from "@chakra-ui/react";
import DisplayWidget from "./DisplayWidget";
import { WidgetErrorBoundary } from "../../WidgetErrorBoundary";
import { Widget } from "../../../types";

interface WidgetCellProps {
  widget: Widget;
  deviceId: string;
  deviceKey: string;
  layoutChangable: boolean;
  dataPoints: any[];
}

// The card shell around a single widget inside its device strip. Device
// identity (name/status/actions) lives on the strip's header (DeviceColumn),
// not here. Content sizes itself from measured space (ResizeObserver in the
// widgets), so no remount tricks are needed on grid resize.
const WidgetCell: React.FC<WidgetCellProps> = ({
  widget,
  deviceId,
  deviceKey,
  layoutChangable,
  dataPoints,
}) => (
  <Box
    bgGradient="linear(to-b, gray.800, gray.900)"
    border="1px solid"
    borderColor="whiteAlpha.100"
    borderRadius="10px"
    height="100%"
    overflow="hidden"
    boxShadow="0 4px 14px rgba(0, 0, 0, 0.35)"
    style={{ userSelect: "none" }}
  >
    <WidgetErrorBoundary widgetName={widget.name ?? "Widget"}>
      <DisplayWidget
        widget={widget}
        deviceKey={deviceKey}
        deviceId={deviceId}
        layoutChangable={layoutChangable}
        dataPoints={dataPoints}
      />
    </WidgetErrorBoundary>
  </Box>
);

export default WidgetCell;
