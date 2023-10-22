/* eslint no-eval: 0 */

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Text,
  Button,
  Flex,
  Icon,
  Box,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { BsArrowLeft } from "react-icons/bs";
let basicMath = require("advanced-calculator");

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalculatorModal: React.FC<CalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [calculation, setCalculation] = useState("");
  const [output, setOutput] = useState("");

  const [openBrackets, setOpenBrackets] = useState(0);

  const actions = ["/", "*", "+", "-", "^"];

  const specialActions = ["sin(", "cos(", "tan(", "ln(", "log(", "sqrt(", "-("];

  const pre_special_action = [
    "/",
    "*",
    "+",
    "-",
    "^",
    "sin(",
    "cos(",
    "tan(",
    "log(",
    "ln(",
    "sqrt(",
    "-(",
    "(",
  ];

  const pre_action = [
    "/",
    "*",
    "+",
    "-",
    "^",
    "sin(",
    "cos(",
    "tan(",
    "log(",
    "ln(",
    "sqrt(",
    "-(",
    "(",
  ];

  const pre_comma = [
    "/",
    "*",
    "+",
    "-",
    "^",
    "sin(",
    "cos(",
    "tan(",
    "log(",
    "ln(",
    "sqrt(",
    "-(",
    "(",
    ")",
    ".",
  ];

  const pre_number = [
    "/",
    "*",
    "+",
    "-",
    "^",
    "sin(",
    "cos(",
    "tan(",
    "log(",
    "ln(",
    "sqrt(",
    "-(",
    "(",
  ];

  const pre_open_bracket = [
    "/",
    "*",
    "+",
    "-",
    "^",
    "sin(",
    "cos(",
    "tan(",
    "log(",
    "sqrt(",
    "ln(",
    "-(",
    "(",
  ];

  const pre_close_bracket = [
    "/",
    "*",
    "+",
    "-",
    "^",
    "sin(",
    "cos(",
    "tan(",
    "log(",
    "ln(",
    "sqrt(",
    "-(",
    "(",
    ".",
  ];

  const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "pi"];

  const everything_except_number = [
    "/",
    "*",
    "+",
    "-",
    "^",
    "sin(",
    "cos(",
    "tan(",
    "log(",
    "ln(",
    "sqrt(",
    "-(",
    "(",
    ")",
    "pi",
  ];

  const [calculationArray, setCalculationArray] = useState([]);

  const updateCalculation = (array: string[]) => {
    let stringCalculation = "";

    for (let index = 0; index < array.length; index++) {
      stringCalculation += array[index];
    }
    setCalculation(stringCalculation);
  };

  const addToCalculation = (value: any) => {
    const array = calculationArray;

    // if array is empty, it can only start with a number or special actions besides 0 or a comma
    if (array.length === 0) {
      if (numbers.includes(value) && value !== "0") {
        array.push(value);
        setCalculationArray(array);
        // update calculation
        updateCalculation(array);
        return;
      } else if (value === ".") {
        array.push("0");
        array.push(value);
        setCalculationArray(array);
        updateCalculation(array);
        return;
      } else if (value === "(") {
        array.push(value);
        setCalculationArray(array);
        updateCalculation(array);
        // add open
        setOpenBrackets((e) => e + 1);
        return;
      } else if (specialActions.includes(value)) {
        array.push(value);
        setCalculationArray(array);
        updateCalculation(array);
        // add open
        setOpenBrackets((e) => e + 1);
        return;
      } else {
        return;
      }
    }

    // check what the type is
    if (actions.includes(value)) {
      // type is action
      // Action can not precede an other action or special action because a number has to be in it
      if (!pre_action.includes(array[array.length - 1])) {
        array.push(value);
        setCalculationArray(array);
        updateCalculation(array);
      }
    } else if (specialActions.includes(value)) {
      // type is special action
      if (pre_special_action.includes(array[array.length - 1])) {
        array.push(value);
        setCalculationArray(array);
        updateCalculation(array);
        // add open
        setOpenBrackets((e) => e + 1);
      }
    } else if (value === ".") {
      // previous value can not be special char and number can not already contain comma
      if (
        !pre_comma.includes(array[array.length - 1]) &&
        !array[array.length - 1].includes(".")
      ) {
        let number = array[array.length - 1] + ".";
        array[array.length - 1] = number;
        setCalculationArray(array);
        updateCalculation(array);
      }
    } else if (value === "(") {
      if (pre_open_bracket.includes(array[array.length - 1])) {
        array.push(value);
        setCalculationArray(array);
        updateCalculation(array);
        // add open
        setOpenBrackets((e) => e + 1);
      }
    } else if (value === ")") {
      if (!pre_close_bracket.includes(array[array.length - 1])) {
        // can only close if there was a bracket open

        if (openBrackets > 0) {
          array.push(value);
          setCalculationArray(array);
          updateCalculation(array);
          // add open
          setOpenBrackets((e) => e - 1);
        }
      }
    } else {
      // type is number
      // Can always be added, if 0 is the first number, add a komma automaticaly
      if (pre_number.includes(array[array.length - 1]) && value === "0") {
        array.push(value);
        array.push(",");
        setCalculationArray(array);
        updateCalculation(array);
      } else if (pre_number.includes(array[array.length - 1])) {
        array.push(value);
        setCalculationArray(array);
        updateCalculation(array);
      } else if (array[array.length - 1] !== ")") {
        let number = array[array.length - 1] + value;
        array[array.length - 1] = number;
        setCalculationArray(array);
        updateCalculation(array);
      }
    }
  };

  const calculate = () => {
    const anwser = basicMath.evaluate(calculation);
    setCalculation(anwser);
    setCalculationArray([anwser]);
  };

  const clear = () => {
    if (calculation === "") {
      return;
    }

    if (
      everything_except_number.includes(
        calculationArray[calculationArray.length - 1]
      )
    ) {
      // it is not a number
      if (calculationArray[calculationArray.length - 1] === ")") {
        setOpenBrackets((e) => e + 1);
      } else if (calculationArray[calculationArray.length - 1] === "(") {
        setOpenBrackets((e) => e - 1);
      }

      const array = calculationArray.slice(0, -1);
      setCalculationArray(array);
      updateCalculation(array);
    } else if (calculationArray[calculationArray.length - 1].length > 1) {
      const array = calculationArray;
      array[array.length - 1] = array[array.length - 1].slice(0, -1);
      setCalculationArray(array);
      updateCalculation(array);
    } else {
      const array = calculationArray.slice(0, -1);
      setCalculationArray(array);
      updateCalculation(array);
    }
  };

  const clearAll = () => {
    if (calculation === "") {
      return;
    }
    setCalculation("");
    setOutput("");
    setCalculationArray([]);
    setOpenBrackets(0);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"3xl"}>
      <ModalOverlay />
      <ModalContent bgColor={"gray.900"} color="white">
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          Rekenmachine
        </ModalHeader>
        <ModalCloseButton size={"lg"} />
        <ModalBody>
          <Flex flexDir={"column"} alignItems="center">
            <Flex
              height={"100px"}
              bgColor="gray.700"
              width={"70%"}
              flexDir="column"
              textAlign={"right"}
              pr={5}
            >
              <Text color="white" fontSize={"35px"}>
                {calculation || "0"}
              </Text>
            </Flex>
            <Flex mt={"5"}>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                fontWeight={300}
                width={"65px"}
                height="65px"
                onClick={() => {
                  addToCalculation("(");
                }}
              >
                &#40;
              </Button>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                fontWeight={300}
                width={"65px"}
                height="65px"
                onClick={() => {
                  addToCalculation(")");
                }}
              >
                &#41;
              </Button>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                fontWeight={300}
                width={"65px"}
                height="65px"
                onClick={() => {
                  addToCalculation("^");
                }}
              >
                ^
              </Button>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                fontWeight={300}
                width={"65px"}
                height="65px"
                onClick={() => {
                  addToCalculation("sqrt(");
                }}
              >
                Sqrt()
              </Button>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                fontWeight={300}
                width={"65px"}
                height="65px"
                onClick={() => {
                  addToCalculation("log(");
                }}
              >
                Log()
              </Button>
            </Flex>
            <Flex mt={"2"}>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => addToCalculation("7")}
              >
                7
              </Button>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => addToCalculation("8")}
              >
                8
              </Button>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => addToCalculation("9")}
              >
                9
              </Button>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => {
                  addToCalculation("/");
                }}
              >
                &#247;
              </Button>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                fontWeight={300}
                onClick={() => {
                  addToCalculation("ln(");
                }}
              >
                Ln()
              </Button>
            </Flex>

            <Flex mt={"2"}>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => addToCalculation("4")}
              >
                4
              </Button>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => addToCalculation("5")}
              >
                5
              </Button>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => addToCalculation("6")}
              >
                6
              </Button>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => {
                  addToCalculation("*");
                }}
              >
                &#215;
              </Button>

              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                fontWeight={300}
                width={"65px"}
                height="65px"
                onClick={() => {
                  addToCalculation("tan(");
                }}
              >
                tan()
              </Button>
            </Flex>
            <Flex mt={"2"}>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => addToCalculation("1")}
              >
                1
              </Button>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => addToCalculation("2")}
              >
                2
              </Button>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => addToCalculation("3")}
              >
                3
              </Button>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => {
                  addToCalculation("-");
                }}
              >
                -
              </Button>

              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                fontWeight={300}
                width={"65px"}
                height="65px"
                onClick={() => {
                  addToCalculation("sin(");
                }}
              >
                sin()
              </Button>
            </Flex>
            <Flex mt={"2"}>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => {
                  addToCalculation(".");
                }}
              >
                ,
              </Button>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => {
                  addToCalculation("0");
                }}
              >
                0
              </Button>

              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => {
                  addToCalculation("-(");
                }}
              >
                &#40;-&#41;
              </Button>

              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => {
                  addToCalculation("+");
                }}
              >
                +
              </Button>

              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                fontWeight={300}
                width={"65px"}
                height="65px"
                onClick={() => {
                  addToCalculation("cos(");
                }}
              >
                cos()
              </Button>
            </Flex>

            <Flex mt={"2"}>
              <Button
                size={"lg"}
                mr="2"
                bgColor="twitter.700"
                _hover={{ bg: "twitter.600" }}
                width={"215px"}
                height="65px"
                onClick={calculate}
              >
                =
              </Button>

              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={clearAll}
                fontWeight={300}
              >
                CE
              </Button>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={clear}
              >
                <Icon as={BsArrowLeft} />
              </Button>
            </Flex>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button
            bgColor="gray.500"
            _hover={{ bg: "gray.400" }}
            onClick={onClose}
            size={"lg"}
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CalculatorModal;

/*


              
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                fontWeight={300}
                width={"65px"}
                height="65px"
                onClick={() => {
                  addToCalculation("(");
                }}
              >
                &#40;
              </Button>

               

              

*/
