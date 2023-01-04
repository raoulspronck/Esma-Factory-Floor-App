import { Flex, Text } from "@chakra-ui/react";
import React from "react";

interface StartWerkOrderProcesProps {}

const StartWerkOrderProces: React.FC<StartWerkOrderProcesProps> = ({}) => {
  return (
    <Flex flexDir={"column"}>
      <Flex alignItems={"center"} height="30px">
        <Text>1. Materiaal uitzoeken</Text>
      </Flex>
      <Flex alignItems={"center"} height="30px">
        <Text>2. Instellen Doal 330NC</Text>
      </Flex>
      <Flex alignItems={"center"} height="30px">
        <Text>3. Op maat zagen</Text>
      </Flex>
      <Flex alignItems={"center"} height="30px">
        <Text>5. Afbramen in- en uitwendig</Text>
      </Flex>
      <Flex alignItems={"center"} height="30px">
        <Text>9. Inpakken voor vernikkelen</Text>
      </Flex>
      <Flex alignItems={"center"} height="30px">
        <Text>12. Instellen draaien</Text>
      </Flex>
      <Flex alignItems={"center"} height="30px">
        <Text>13. Draaien Schroefdraad M14.5*0.5</Text>
      </Flex>
      <Flex alignItems={"center"} height="30px">
        <Text>14. Opbergen magazijn</Text>
      </Flex>
    </Flex>
  );
};

export default StartWerkOrderProces;
