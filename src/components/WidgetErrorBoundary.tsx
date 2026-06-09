import React from "react";
import { Box, Text } from "@chakra-ui/react";

interface Props {
  children: React.ReactNode;
  widgetName?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export class WidgetErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          p={2}
          border="1px solid"
          borderColor="red.300"
          borderRadius="md"
          bg="red.50"
          fontSize="xs"
          color="red.700"
        >
          <Text fontWeight="bold">{this.props.widgetName ?? "Widget"} error</Text>
          <Text>{this.state.message}</Text>
        </Box>
      );
    }
    return this.props.children;
  }
}
