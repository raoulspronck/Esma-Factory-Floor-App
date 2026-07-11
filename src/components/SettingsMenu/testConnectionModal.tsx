import {
  Badge,
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React from "react";

interface ConnectionTestResult {
  api_key: string;
  device_key: string;
  status_code: number;
  success: boolean;
  message: string;
}

interface TestConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TestConnectionModal: React.FC<TestConnectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const modalSize = useBreakpointValue(["xs", "sm", "lg"]);
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);
  const toast = useToast();

  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<ConnectionTestResult | null>(
    null
  );

  const runTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await invoke<ConnectionTestResult>(
        "test_exalise_connection"
      );
      setResult(res);
    } catch (error) {
      toast({
        title: "Could not run the connection test.",
        description: String(error),
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReport = () => {
    if (!result) return;

    const report = [
      `API key: ${result.api_key}`,
      `Device key: ${result.device_key}`,
      `Status code: ${result.status_code}`,
      `Result: ${result.success ? "SUCCESS" : "FAILED"}`,
      `Message: ${result.message}`,
    ].join("\n");

    navigator.clipboard.writeText(report);
    toast({ title: "Diagnostic report copied to clipboard", status: "success" });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setResult(null);
        onClose();
      }}
      size={modalSize}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          Test Exalise API connection
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          <Text fontSize={["xs", "sm", "md"]} opacity={0.8}>
            Sends a real authenticated request to api.exalise.com using the
            credentials currently configured on this machine, so you can see
            exactly what is being sent and what the server said back.
          </Text>

          {loading ? (
            <Flex justifyContent="center" mt={5}>
              <Spinner />
            </Flex>
          ) : result ? (
            <Box mt={4}>
              <Flex alignItems="center" mb={2}>
                <Badge
                  colorScheme={result.success ? "green" : "red"}
                  fontSize={["10px", "12px", "14px"]}
                >
                  {result.success ? "SUCCESS" : "FAILED"}
                </Badge>
                <Text ml={2} fontSize={["10px", "12px", "14px"]} opacity={0.7}>
                  HTTP {result.status_code === 0 ? "no response" : result.status_code}
                </Text>
              </Flex>

              <Box mt={3}>
                <Text fontWeight="semibold" fontSize={["xs", "sm", "md"]}>
                  API key used
                </Text>
                <Text
                  fontSize={["9px", "11px", "13px"]}
                  style={{ wordBreak: "break-all" }}
                >
                  {result.api_key || "(empty)"}
                </Text>
              </Box>

              <Box mt={3}>
                <Text fontWeight="semibold" fontSize={["xs", "sm", "md"]}>
                  Device key used
                </Text>
                <Text
                  fontSize={["9px", "11px", "13px"]}
                  style={{ wordBreak: "break-all" }}
                >
                  {result.device_key || "(empty)"}
                </Text>
              </Box>

              <Box mt={3}>
                <Text fontWeight="semibold" fontSize={["xs", "sm", "md"]}>
                  Server response
                </Text>
                <Text
                  fontSize={["10px", "12px", "14px"]}
                  style={{ wordBreak: "break-word" }}
                >
                  {result.message}
                </Text>
              </Box>
            </Box>
          ) : (
            <Flex justifyContent="center" mt={5}>
              <Text fontSize={["xs", "sm", "md"]} opacity={0.6}>
                Click "Run test" to check this machine's connection.
              </Text>
            </Flex>
          )}
        </ModalBody>

        <ModalFooter>
          {result ? (
            <Button
              colorScheme="gray"
              mr={3}
              size={buttonSize}
              onClick={copyReport}
            >
              Copy report
            </Button>
          ) : null}
          <Button
            colorScheme={"twitter"}
            mr={3}
            size={buttonSize}
            isLoading={loading}
            onClick={runTest}
          >
            Run test
          </Button>
          <Button
            colorScheme="gray"
            onClick={() => {
              setResult(null);
              onClose();
            }}
            size={buttonSize}
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TestConnectionModal;
