import { Box, Text, Input, Button, Flex } from "@chakra-ui/react";
import React from "react";

interface CustomInputExampleWidgetProps {}

const CustomInputExampleWidget: React.FC<
  CustomInputExampleWidgetProps
> = ({}) => {
  return (
    <Box width={"100%"}>
      <Flex>
        <Input placeholder="value" disabled />
        <Button ml={2}>Send</Button>
      </Flex>
    </Box>
  );
};

export default CustomInputExampleWidget;
