/* eslint-disable  no-unused-vars */

import {
  Box,
  Button,
  Flex,
  Icon,
  LightMode,
  Progress,
  Spinner,
  Text,
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

const StatusChip: React.FC<{
  color: string;
  icon: React.ReactElement;
  label: string;
}> = ({ color, icon, label }) => (
  <Flex
    alignItems="center"
    gap={2}
    backgroundColor={color}
    height="40px"
    borderRadius="full"
    px={5}
    fontSize="md"
    fontWeight="semibold"
    ml={3}
    flexShrink={0}
  >
    {icon}
    <Text>{label}</Text>
  </Flex>
);

const ReceiveFileTaskbar: React.FC<ReceiveFileTaskbarProps> = ({
  error,
  fileSendProgress,
  fileSendStatus,
  setFileReceive,
  fileReceivePath,
}) => {
  const [loading, setLoading] = useState(false);

  return (
    <Flex
      height="64px"
      alignItems="center"
      bgColor="gray.700"
      color="white"
      pl={4}
      borderBottom="1px solid"
      borderColor="blackAlpha.500"
    >
      <Text fontSize="md" fontWeight="medium" color="whiteAlpha.800">
        Status:
      </Text>

      {error === "" ? (
        fileSendStatus === "Finished file" ? (
          <>
            <StatusChip
              color="green.500"
              icon={<Icon as={AiFillCheckCircle} boxSize="20px" />}
              label="File transfer complete"
            />

            <Box mx={4} height="60%" width="2px" backgroundColor="whiteAlpha.300" />

            <Text fontSize="md" fontWeight="medium">
              {fileSendProgress} characters gelezen
            </Text>
          </>
        ) : fileSendStatus === "Ready to receive" ? (
          <StatusChip
            color="brand.500"
            icon={<Spinner size="sm" />}
            label="Ready to receive file"
          />
        ) : fileSendStatus === "Started reading" ? (
          <>
            <StatusChip
              color="brand.500"
              icon={<Icon as={BsFileEarmarkBreak} boxSize="18px" />}
              label="Receiving"
            />

            <Box mx={4} height="60%" width="2px" backgroundColor="whiteAlpha.300" />

            <Box minW="220px">
              <Text fontSize="md" fontWeight="medium">
                {fileSendProgress} characters gelezen
              </Text>

              <Progress
                isIndeterminate
                height="8px"
                borderRadius="full"
                colorScheme="brand"
                bg="whiteAlpha.300"
                mt={1}
              />
            </Box>
          </>
        ) : (
          <StatusChip
            color="brand.500"
            icon={<Spinner size="sm" />}
            label="Starting up"
          />
        )
      ) : (
        <StatusChip
          color="red.500"
          icon={<Icon as={MdError} boxSize="20px" />}
          label={`Error: ${error}`}
        />
      )}
      <LightMode>
        <Button
          ml="auto"
          mr={3}
          size="md"
          colorScheme="red"
          isLoading={loading}
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
