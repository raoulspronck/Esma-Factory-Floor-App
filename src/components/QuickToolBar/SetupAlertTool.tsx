import { Box, RadioGroup, Radio, Text } from "@chakra-ui/react";
import React from "react";
import * as IO from "react-icons/io5";

interface SetupAlertToolProps {}

const SetupAlertTool: React.FC<SetupAlertToolProps> = ({}) => {
  return (
    <>
      <Text>Pick an Icon</Text>
      <Box maxH={"500px"} overflowY={"scroll"}>
        <RadioGroup>
          {Object.values(IO).map((IconComponent, index) => (
            <Radio key={index} value={IconComponent.name}>
              <Box width={"40px"} height={"40px"} fontSize={"30px"}>
                <IconComponent />
              </Box>
            </Radio>
          ))}
        </RadioGroup>
      </Box>
    </>
  );
};

export default SetupAlertTool;
