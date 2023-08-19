/* eslint-disable  no-unused-vars */

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
import React, { useState } from "react";
import { AiFillCheckCircle } from "react-icons/ai";
import { BsFileEarmarkBreak } from "react-icons/bs";
import { MdError } from "react-icons/md";

interface ReceiveFileTaskbarProps {
  error: string;
  fileSendStatus: string;
  fileSendProgress: string;
  setFileReceive: React.Dispatch<React.SetStateAction<boolean>>;
  fileReceivePath: string;
}

const ReceiveFileTaskbar: React.FC<ReceiveFileTaskbarProps> = ({
  error,
  fileSendProgress,
  fileSendStatus,
  setFileReceive,
  fileReceivePath,
}) => {
  const [loading, setLoading] = useState(false);
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

      {error === "" ? (
        fileSendStatus === "Finished file" ? (
          <>
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
              <Text>File transfer complete</Text>
              <Spacer />
            </Flex>

            <Box
              mr={[1, 2]}
              ml={[1, 2]}
              height={["60%", "70%", "80%"]}
              width={"2px"}
              backgroundColor={"blackAlpha.400"}
            />

            <Box>
              <Text fontSize={["12px", "12px", "15px"]} fontWeight="medium">
                {fileSendProgress} characters gelezen
              </Text>
            </Box>
          </>
        ) : fileSendStatus === "Ready to receive" ? (
          <Flex
            width={["150px", "160px", "170px"]}
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
            <Text>Ready to receive file</Text>
            <Spacer />
          </Flex>
        ) : fileSendStatus === "Started reading" ? (
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
              <Text>Receiving</Text>
              <Spacer />
            </Flex>

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

            <Box ml={[1, 2, 3]}>
              <Text fontSize={["12px", "12px", "15px"]} fontWeight="medium">
                {fileSendProgress} characters gelezen
              </Text>

              <Progress
                size={buttonSize}
                isIndeterminate
                height={"2px"}
                color="twitter.500"
                mt={1}
              />
            </Box>
          </>
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
          width={"fit-content"}
          pl={2}
          pr={2}
          alignItems="center"
          justifyContent={"center"}
          backgroundColor="red.500"
          height={["24px", "24px", "31px"]}
          borderRadius="5px"
          fontSize={buttonSize}
          fontWeight="semibold"
          ml={[1, 2, 3]}
        >
          <Icon as={MdError} />
          <Text ml="1">Error:</Text>
          <Text ml="2">{error}</Text>
        </Flex>
      )}
      <LightMode>
        <Button
          ml={"auto"}
          mr={"3"}
          size={buttonSize}
          colorScheme="red"
          onClick={async () => {
            if (fileSendStatus === "Finished file") {
              setFileReceive(false);
              return;
            }

            setLoading(true);
            invoke("stop_file_receive", {
              filePath: fileReceivePath,
            })
              .then((_e) => {
                setFileReceive(false);
                setLoading(false);
              })
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

export default ReceiveFileTaskbar;
