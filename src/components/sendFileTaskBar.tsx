import {
  Box,
  Button,
  Flex,
  Icon,
  LightMode,
  Progress,
  Spacer,
  Spinner,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React from "react";
import { AiFillCheckCircle } from "react-icons/ai";
import { BsFileEarmarkBreak } from "react-icons/bs";
import { MdError } from "react-icons/md";

interface SendFileTaskBarProps {
  error: string;
  fileSendStatus: string;
  fileSendProgress: string;
  setFileSend: React.Dispatch<React.SetStateAction<boolean>>;
}

const SendFileTaskBar: React.FC<SendFileTaskBarProps> = ({
  error,
  fileSendProgress,
  fileSendStatus,
  setFileSend,
}) => {
  const buttonSize = useBreakpointValue(["xs", "xs", "sm"]);

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
      <Text fontSize={["12px", "12px", "15px"]} fontWeight="medium">
        Status:
      </Text>

      {error == "" ? (
        fileSendStatus == "Send completed" ? (
          <Flex
            width={["150px", "160px", "180px"]}
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
            <Icon as={AiFillCheckCircle} />
            <Spacer />
            <Text>Transfer completed</Text>
            <Spacer />
          </Flex>
        ) : fileSendStatus == "Started transfer" ? (
          <>
            <Flex
              width={["95px", "100px", "110px"]}
              alignItems="center"
              justifyContent={"center"}
              backgroundColor="twitter.500"
              height={["24px", "24px", "31px"]}
              borderRadius="5px"
              fontSize={buttonSize}
              fontWeight="semibold"
              ml={[1, 2, 3]}
            >
              <Spacer />
              <Icon as={BsFileEarmarkBreak} />
              <Spacer />
              <Text>Sending</Text>
              <Spacer />
            </Flex>

            {fileSendProgress != "" ? (
              <>
                <Box
                  mr={[1, 2]}
                  ml={[1, 2]}
                  height={["60%", "70%", "80%"]}
                  width={"2px"}
                  backgroundColor={"blackAlpha.400"}
                />

                <Text fontSize={["12px", "12px", "15px"]} fontWeight="medium">
                  Progress:
                </Text>

                <Box
                  ml={[1, 2, 3]}
                  minWidth={`${
                    fileSendProgress.split("/")[1].length * 6 * 2 + 40
                  }px   `}
                >
                  <Text fontSize={["12px", "12px", "15px"]} fontWeight="medium">
                    {fileSendProgress.split("/")[0]} /
                    {fileSendProgress.split("/")[1]} bytes
                  </Text>

                  <Progress
                    size={buttonSize}
                    hasStripe
                    value={
                      (parseInt(fileSendProgress.split("/")[0]) /
                        parseInt(fileSendProgress.split("/")[1])) *
                      100
                    }
                    height={"2px"}
                    color="twitter.500"
                    mt={1}
                  />
                </Box>
              </>
            ) : null}
          </>
        ) : fileSendStatus == "Pauzed" ? (
          <Flex
            width={["90px", "100px", "110px"]}
            alignItems="center"
            justifyContent={"center"}
            backgroundColor="twitter.500"
            height={["24px", "24px", "31px"]}
            borderRadius="5px"
            fontSize={buttonSize}
            fontWeight="semibold"
            ml={[1, 2, 3]}
          >
            <Spacer />
            <Icon as={Spinner} />
            <Spacer />
            <Text>Pauzed</Text>
            <Spacer />
          </Flex>
        ) : (
          <Flex
            width={["90px", "100px", "110px"]}
            alignItems="center"
            justifyContent={"center"}
            backgroundColor="twitter.500"
            height={["24px", "24px", "31px"]}
            borderRadius="5px"
            fontSize={buttonSize}
            fontWeight="semibold"
            ml={[1, 2, 3]}
          >
            <Spacer />
            <Icon as={Spinner} />
            <Spacer />
            <Text>Starting up</Text>
            <Spacer />
          </Flex>
        )
      ) : (
        <Flex
          width={["60px", "70px", "80px"]}
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
          <Icon as={MdError} />
          <Spacer />
          <Text>Error</Text>
          <Spacer />
        </Flex>
      )}
      <LightMode>
        <Button
          ml={"auto"}
          mr={"3"}
          size={buttonSize}
          colorScheme="red"
          onClick={() => {
            invoke("stop_rs232", {})
              .then((_e) => setFileSend(false))
              .catch((e) => {
                console.log(e);
              });
          }}
        >
          Exit
        </Button>
      </LightMode>
    </Flex>
  );
};

export default SendFileTaskBar;
