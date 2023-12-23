import { Box, Flex, IconButton, useDisclosure } from "@chakra-ui/react";
import React from "react";
import { FaCalculator } from "react-icons/fa";
import CncIcon from "../icons/CncIcon";
import CalculatorModal from "./modals/CalculatorModal";
import SpindleModal from "./modals/SpindleModal";
import CallingAlert from "./alerts/CallingAlert";
import DynamicComponent from "../DynamicIconImport";
import { MdQuiz } from "react-icons/md";
import QuizModal from "./modals/QuizModal";

const QuickToolBar: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const {
    isOpen: isOpenCalculator,
    onOpen: onOpenCalculator,
    onClose: onCloseCalculator,
  } = useDisclosure();
  const {
    isOpen: isOpenQuiz,
    onOpen: onOpenQuiz,
    onClose: onCloseQuiz,
  } = useDisclosure();

  const {
    isOpen: isOpenCallingAlert,
    onOpen: onOpenCallingAlert,
    onClose: onCloseCallingAlert,
  } = useDisclosure();

  const callJohn = () => {
    onOpenCallingAlert();
  };

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

      <IconButton
        icon={<DynamicComponent techs={["CallSharp"]} />}
        aria-label="Bel john"
        colorScheme={"blackAlpha"}
        height={"80px"}
        width="80px"
        fontSize={"50px"}
        onClick={() => callJohn()}
        mr={3}
      />

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
        icon={<MdQuiz color={"white"} />}
        aria-label="quiz"
        colorScheme={"blackAlpha"}
        height={"80px"}
        width="80px"
        fontSize={"50px"}
        onClick={onOpenQuiz}
      />

      <CallingAlert isOpen={isOpenCallingAlert} onClose={onCloseCallingAlert} />
      <CalculatorModal isOpen={isOpenCalculator} onClose={onCloseCalculator} />
      <QuizModal isOpen={isOpenQuiz} onClose={onCloseQuiz} />
    </Flex>
  );
};

export default QuickToolBar;
