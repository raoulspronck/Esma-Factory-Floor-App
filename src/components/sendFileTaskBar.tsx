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

const SendFileTaskBar: React.FC<SendFileTaskBarProps> = ({
  error,
  fileSendProgress,
  fileSendStatus,
  setFileSend,
}) => {
  const sent = parseInt(fileSendProgress.split("/")[0]);
  const total = parseInt(fileSendProgress.split("/")[1]);

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
        fileSendStatus === "Send completed" ? (
          <StatusChip
            color="green.500"
            icon={<Icon as={AiFillCheckCircle} boxSize="20px" />}
            label="Transfer completed"
          />
        ) : fileSendStatus === "Started transfer" ? (
          <>
            <StatusChip
              color="brand.500"
              icon={<Icon as={BsFileEarmarkBreak} boxSize="18px" />}
              label="Sending"
            />

            {fileSendProgress !== "" ? (
              <>
                <Box mx={4} height="60%" width="2px" backgroundColor="whiteAlpha.300" />

                <Box minW="220px">
                  <Text fontSize="md" fontWeight="medium">
                    {fileSendProgress.split("/")[0]} / {fileSendProgress.split("/")[1]} bytes
                  </Text>

                  <Progress
                    hasStripe
                    value={(sent / total) * 100}
                    height="8px"
                    borderRadius="full"
                    colorScheme="brand"
                    bg="whiteAlpha.300"
                    mt={1}
                  />
                </Box>
              </>
            ) : null}
          </>
        ) : fileSendStatus === "Pauzed" ? (
          <StatusChip
            color="orange.500"
            icon={<Spinner size="sm" />}
            label="Pauzed"
          />
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
          onClick={() => {
            invoke("stop_file_send", {})
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
