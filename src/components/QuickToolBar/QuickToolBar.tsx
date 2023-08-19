import { Box, Flex, IconButton, useDisclosure } from "@chakra-ui/react";
import React from "react";
import { FaCalculator } from "react-icons/fa";
import CncIcon from "../icons/CncIcon";
import CalculatorModal from "./modals/CalculatorModal";
import SpindleModal from "./modals/SpindleModal";

const QuickToolBar: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const {
    isOpen: isOpenCalculator,
    onOpen: onOpenCalculator,
    onClose: onCloseCalculator,
  } = useDisclosure();
  const {
    isOpen: isOpenSpindle,
    onOpen: onOpenSpindle,
    onClose: onCloseSpindle,
  } = useDisclosure();

  /*  const {
    isOpen: isOpenCallingAlert,
    onOpen: onOpenCallingAlert,
    onClose: onCloseCallingAlert,
  } = useDisclosure(); */

  /*  const callJohn = () => {
    onOpenCallingAlert();
  }; */

  return (
    <Flex
      width={"100%"}
      height="150px"
      bgColor={"gray.900"}
      alignItems="center"
      pl="5"
    >
      {children}

      <Box bgColor={"gray.400"} width="2px" height={"80%"} mr="5" ml="5" />

      {/* <IconButton
        icon={<GiBugleCall />}
        aria-label="Bel john"
        colorScheme={"blackAlpha"}
        height={"80px"}
        width="80px"
        fontSize={"50px"}
        onClick={() => callJohn()}
        mr={3}
      /> */}

      <IconButton
        icon={<FaCalculator />}
        aria-label="rekenmachine"
        colorScheme={"blackAlpha"}
        height={"80px"}
        width="80px"
        fontSize={"50px"}
        onClick={onOpenCalculator}
      />

      <IconButton
        ml={3}
        icon={<CncIcon color={"white"} />}
        aria-label="frees"
        colorScheme={"blackAlpha"}
        height={"80px"}
        width="80px"
        fontSize={"50px"}
        onClick={onOpenSpindle}
      />

      <CalculatorModal isOpen={isOpenCalculator} onClose={onCloseCalculator} />
      <SpindleModal isOpen={isOpenSpindle} onClose={onCloseSpindle} />

      {/*  <CallingAlert isOpen={isOpenCallingAlert} onClose={onCloseCallingAlert} /> */}
    </Flex>
  );
};

export default QuickToolBar;
