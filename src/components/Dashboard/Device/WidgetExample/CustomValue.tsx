import {
  Stat,
  Flex,
  StatLabel,
  StatNumber,
  Box,
  StatHelpText,
} from "@chakra-ui/react";
import React from "react";

interface CustomValueProps {}

const CustomValue: React.FC<CustomValueProps> = ({}) => {
  return (
    <>
      <Stat>
        <Flex alignItems={"center"}>
          <StatLabel fontSize={"20px"}>Custom title</StatLabel>

          <Box ml="auto" textAlign={"right"}>
            <StatNumber fontSize={"34px"}>Custom</StatNumber>
            <StatHelpText>Custom format</StatHelpText>
          </Box>
        </Flex>
      </Stat>
    </>
  );
};

export default CustomValue;
