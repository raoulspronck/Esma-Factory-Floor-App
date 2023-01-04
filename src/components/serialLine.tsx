import { Flex, Icon, Box, Text } from "@chakra-ui/react";
import React, { useState } from "react";
import { BiChevronDown, BiChevronLeft } from "react-icons/bi";
import { MdOutlineManageSearch } from "react-icons/md";

interface SerialLineProps {
  item: {
    time: string;
    message: string;
    hex: string;
  };
}

const SerialLine: React.FC<SerialLineProps> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Flex>
      <Text
        color="whiteAlpha.700"
        mr={3}
        lineHeight="22px"
        minW={"fit-content"}
      >
        {item.time}
      </Text>
      <Flex
        mr={1}
        cursor="pointer"
        height={"22px"}
        alignItems="center"
        onClick={() => {
          setExpanded((e) => !e);
        }}
      >
        <Icon
          as={MdOutlineManageSearch}
          color="whiteAlpha.800"
          cursor="pointer"
        />
        {expanded ? (
          <Icon as={BiChevronDown} color="whiteAlpha.800" />
        ) : (
          <Icon as={BiChevronLeft} color="whiteAlpha.800" />
        )}
      </Flex>
      <Box lineHeight="22px">
        <Text color="whiteAlpha.900">{item.message}</Text>
        {expanded ? <Text color="whiteAlpha.900">{item.hex}</Text> : null}
      </Box>
    </Flex>
  );
};

export default SerialLine;
