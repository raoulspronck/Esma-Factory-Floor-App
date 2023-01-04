import {
  Box,
  Button,
  Checkbox,
  Flex,
  Icon,
  IconButton,
  LightMode,
  Spacer,
  Text,
  Tooltip,
  useBreakpointValue,
} from "@chakra-ui/react";
import React, { useState } from "react";
import {
  IoMdPlay,
  IoMdSquare,
  IoMdPause,
  IoIosSave,
  IoIosHelpCircle,
  IoIosHelp,
} from "react-icons/io";
import { MdWifiTethering, MdWifiTetheringOff } from "react-icons/md";
import ExaliseLogoBox from "./exaliseLogoBox";
import { Spinner } from "@chakra-ui/spinner";

interface MainTaskBarProps {
  restartRs232Monitoring: () => void;
  TrheadStarted: boolean;
  localThreadStarted: boolean;
  setlocalThreadStarted: React.Dispatch<React.SetStateAction<boolean>>;
  autoScroll: React.MutableRefObject<boolean>;
  onOpenSaveInput: () => void;
  exaliseConn: boolean;
  setExaliseConn: React.Dispatch<React.SetStateAction<boolean>>;
  exaliseStatus: string;
}

const MainTaskBar: React.FC<MainTaskBarProps> = ({
  restartRs232Monitoring,
  TrheadStarted,
  localThreadStarted,
  setlocalThreadStarted,
  autoScroll,
  onOpenSaveInput,
  exaliseConn,
  setExaliseConn,
  exaliseStatus,
}) => {
  const buttonSize = useBreakpointValue(["xs", "xs", "sm"]);
  const logoSize = useBreakpointValue([22, 26, 28]);
  const [checkBox, setCheckBox] = useState(autoScroll.current);

  return (
    <Flex
      height={["35px", "40px", "50px"]}
      alignItems="center"
      bgColor={"#5c5c5c"}
      color="white"
      pl={[2, 3]}
      borderBottom={"1px solid"}
      borderColor="blackAlpha.900"
    >
      <LightMode>
        <IconButton
          icon={<IoIosSave />}
          aria-label="stop serial communication"
          colorScheme={"blackAlpha"}
          size={buttonSize}
          fontSize={["16px", "16px", "22px"]}
          height={["25px", "25px", "34px"]}
          width={["27px", "27px", "34px"]}
          onClick={onOpenSaveInput}
        />
      </LightMode>

      <Box
        mr={[1, 2]}
        ml={[1, 2]}
        height={["60%", "70%", "80%"]}
        width={"2px"}
        backgroundColor={"blackAlpha.400"}
      />

      {TrheadStarted ? (
        <>
          <Flex
            justifyContent={"center"}
            alignItems="center"
            borderRadius={"5px"}
            minHeight={["24px", "24px", "31px"]}
            minWidth={["24px", "24px", "31px"]}
            backgroundColor="green.500"
          >
            <Icon as={IoMdPlay} fontSize={["14px", "14px", "16px"]} />
          </Flex>
          {TrheadStarted === localThreadStarted ? (
            <LightMode>
              <IconButton
                icon={<IoMdPause />}
                aria-label="stop serial communication"
                colorScheme={"blackAlpha"}
                size={buttonSize}
                onClick={() => {
                  restartRs232Monitoring();
                  setlocalThreadStarted(false);
                }}
                ml={2}
              />
            </LightMode>
          ) : (
            <LightMode>
              <IconButton
                icon={<IoMdPause />}
                aria-label="stop serial communication"
                colorScheme={"blackAlpha"}
                size={buttonSize}
                ml={2}
                isLoading
              />
            </LightMode>
          )}
        </>
      ) : (
        <>
          <Flex
            justifyContent={"center"}
            alignItems="center"
            borderRadius={"5px"}
            minHeight={["24px", "24px", "31px"]}
            minWidth={["24px", "24px", "31px"]}
            backgroundColor="red.500"
          >
            <Icon as={IoMdSquare} fontSize={["14px", "14px", "16px"]} />
          </Flex>

          {TrheadStarted === localThreadStarted ? (
            <LightMode>
              <IconButton
                icon={<IoMdPlay />}
                aria-label="start serial communication"
                colorScheme={"blackAlpha"}
                size={buttonSize}
                ml={2}
                isDisabled={exaliseConn && exaliseStatus != "disconnected"}
                onClick={() => {
                  restartRs232Monitoring();
                  setlocalThreadStarted(true);
                }}
              />
            </LightMode>
          ) : (
            <LightMode>
              <IconButton
                icon={<IoMdPlay />}
                aria-label="start serial communication"
                colorScheme={"blackAlpha"}
                size={buttonSize}
                ml={2}
                isLoading
              />
            </LightMode>
          )}
        </>
      )}

      <Box
        mr={[1, 2]}
        ml={[1, 2]}
        height={["60%", "70%", "80%"]}
        width={"2px"}
        backgroundColor={"blackAlpha.400"}
      />

      <LightMode>
        <Checkbox
          isChecked={checkBox}
          onChange={(e) => {
            autoScroll.current = e.target.checked;
            setCheckBox(e.target.checked);
          }}
        >
          <Text fontSize={["12px", "12px", "15px"]} fontWeight="medium">
            Auto scroll
          </Text>
        </Checkbox>
      </LightMode>

      <Box
        mr={[1, 2]}
        ml={[1, 2]}
        height={["60%", "70%", "80%"]}
        width={"2px"}
        backgroundColor={"blackAlpha.400"}
      />
      <LightMode>
        <Checkbox
          isChecked={exaliseConn}
          onChange={(e) => {
            setExaliseConn(e.target.checked);
          }}
          mr={2}
          isDisabled={TrheadStarted || localThreadStarted}
        />
      </LightMode>
      <ExaliseLogoBox size={logoSize} />
      <Text
        fontSize={["17px"]}
        fontWeight="medium"
        fontFamily="Helvetica"
        letterSpacing="widest"
        style={{ transform: "scale(1, 0.9)" }}
        mt={1}
        ml={2}
        display={["none", "block"]}
      >
        Exalise
      </Text>

      {exaliseStatus == "disconnected" && TrheadStarted && exaliseConn ? (
        <Flex
          width={["110px", "130px", "140px"]}
          alignItems="center"
          justifyContent={"center"}
          backgroundColor="red.500"
          height={["24px", "24px", "31px"]}
          borderRadius="5px"
          fontSize={buttonSize}
          fontWeight="semibold"
          ml={[1, 2, 3]}
        >
          <Spacer />
          <Icon as={Spinner} />
          <Spacer />
          <Text>connecting...</Text>
          <Spacer />
        </Flex>
      ) : exaliseStatus == "disconnected" ? (
        <Flex
          width={["110px", "130px", "140px"]}
          alignItems="center"
          justifyContent={"center"}
          backgroundColor="red.500"
          height={["24px", "24px", "31px"]}
          borderRadius="5px"
          fontSize={buttonSize}
          fontWeight="semibold"
          ml={[1, 2, 3]}
        >
          <Spacer />
          <Icon as={MdWifiTetheringOff} />
          <Spacer />
          <Text>disconnected</Text>
          <Spacer />
        </Flex>
      ) : null}

      {exaliseStatus == "connected" && !TrheadStarted && exaliseConn ? (
        <Flex
          width={["110px", "130px", "140px"]}
          alignItems="center"
          justifyContent={"center"}
          backgroundColor="red.500"
          height={["24px", "24px", "31px"]}
          borderRadius="5px"
          fontSize={buttonSize}
          fontWeight="semibold"
          ml={[1, 2, 3]}
        >
          <Spacer />
          <Icon as={Spinner} />
          <Spacer />
          <Text>disconnecting...</Text>
          <Spacer />
        </Flex>
      ) : exaliseStatus == "connected" ? (
        <Flex
          width={["110px", "130px", "140px"]}
          alignItems="center"
          justifyContent={"center"}
          backgroundColor="green.500"
          height={["24px", "24px", "31px"]}
          borderRadius="5px"
          fontSize={buttonSize}
          fontWeight="semibold"
          ml={[1, 2, 3]}
        >
          <Spacer />
          <Icon as={MdWifiTethering} />
          <Spacer />
          <Text>connected</Text>
          <Spacer />
        </Flex>
      ) : null}

      <Tooltip
        label='Als u bent verbonden wordt elke lijn in het formaat "topic-payload" doorgestuurd naar Exalise.'
        fontSize={buttonSize}
        backgroundColor={"#4a4a4a"}
        color="white"
      >
        <Flex
          justifyContent={"center"}
          alignItems="center"
          maxHeight={["20px", "20px", "22px"]}
          maxWidth={["20px", "20px", "22px"]}
          backgroundColor="blackAlpha.400"
          borderRadius={"50%"}
          ml={2}
        >
          <Icon as={IoIosHelp} fontSize={["22px", "22px", "30px"]} />
        </Flex>
      </Tooltip>
    </Flex>
  );
};

export default MainTaskBar;
