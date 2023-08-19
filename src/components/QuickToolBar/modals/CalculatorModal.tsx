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
  const actions = ["/", "*", "+", "-", "."];
  const updateCalculation = (value: any) => {
    if (
      (actions.includes(value) && calculation === "") ||
      (actions.includes(value) && actions.includes(calculation.slice(-1)))
    ) {
      return;
    }
    setCalculation(calculation + value);

    if (!actions.includes(value)) {
      setOutput(eval(calculation + value).toString());
    }
  };

  const calculate = () => {
    setCalculation(eval(calculation).toString());
  };
  const clear = () => {
    if (calculation === "") {
      return;
    }
    const value = calculation.slice(0, -1);
    setCalculation(value);
  };

  const clearAll = () => {
    if (calculation === "") {
      return;
    }
    setCalculation("");
    setOutput("");
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

              {output ? (
                <Text fontSize={"20px"} color="gray.400">
                  {output}
                </Text>
              ) : (
                ""
              )}
            </Flex>
            <Flex mt={"5"}>
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"135px"}
                height="65px"
                onClick={clearAll}
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
              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => {
                  updateCalculation("*");
                }}
              >
                &#215;
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
                onClick={() => updateCalculation("7")}
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
                onClick={() => updateCalculation("8")}
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
                onClick={() => updateCalculation("9")}
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
                  updateCalculation("/");
                }}
              >
                &#247;
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
                onClick={() => updateCalculation("4")}
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
                onClick={() => updateCalculation("5")}
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
                onClick={() => updateCalculation("6")}
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
                  updateCalculation("-");
                }}
              >
                -
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
                onClick={() => updateCalculation("1")}
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
                onClick={() => updateCalculation("2")}
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
                onClick={() => updateCalculation("3")}
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
                  updateCalculation("+");
                }}
              >
                +
              </Button>
            </Flex>
            <Flex mt={"2"}>
              <Box mr="2" width={"65px"} height="65px" />

              <Button
                size={"lg"}
                mr="2"
                bgColor="gray.700"
                _hover={{ bg: "gray.600" }}
                width={"65px"}
                height="65px"
                onClick={() => {
                  updateCalculation("0");
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
                  updateCalculation(".");
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
                colorScheme={"twitter"}
                onClick={calculate}
              >
                =
              </Button>
            </Flex>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="twitter" onClick={onClose} size={"lg"}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CalculatorModal;
