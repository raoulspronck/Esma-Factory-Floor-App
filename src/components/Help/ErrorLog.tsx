import {
  Badge,
  Button,
  Flex,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Checkbox,
  LightMode,
  Box,
  Spinner,
  useBreakpointValue,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { MdRefresh } from "react-icons/md";

import { readLogFile } from "../../api/logs";
import { LogEntry } from "../../stores/connectionStore";

interface ErrorLogProps {
  isOpen: boolean;
  onClose: () => void;
  appLog: LogEntry[];
}

const CATEGORY_COLORS: Record<string, string> = {
  mqtt: "blue",
  dashboard: "purple",
  device: "teal",
  system: "gray",
};

const WARNING_PATTERN = /failed|error|warning/i;

/// Parses one `logs.txt` line: `{timestamp} - [{category}] {message}`.
/// Lines written before this format existed have no `[category]` tag - those
/// fall back to category "other" so they still render instead of vanishing.
function parseLogLine(line: string): LogEntry | null {
  const separator = " - ";
  const separatorIndex = line.indexOf(separator);
  if (separatorIndex < 0) return null;

  const timestamp = line.substring(0, separatorIndex);
  const rest = line.substring(separatorIndex + separator.length);

  const categoryMatch = rest.match(/^\[(\w+)\]\s?(.*)$/);
  if (categoryMatch) {
    return { timestamp, category: categoryMatch[1], message: categoryMatch[2] };
  }
  return { timestamp, category: "other", message: rest };
}

const LogRow: React.FC<{ entry: LogEntry }> = ({ entry }) => {
  const isWarning = WARNING_PATTERN.test(entry.message);
  return (
    <Flex mb={2} alignItems="baseline" gap={2}>
      <Text
        fontStyle="italic"
        textColor="gray.500"
        minW="fit-content"
        fontSize="sm"
      >
        {entry.timestamp.substring(0, Math.min(entry.timestamp.length, 19))}
      </Text>
      <Badge
        colorScheme={CATEGORY_COLORS[entry.category] ?? "gray"}
        minW="fit-content"
        fontSize="xs"
      >
        {entry.category}
      </Badge>
      <Text textColor={isWarning ? "red.500" : "gray.700"} fontWeight={isWarning ? "medium" : "normal"}>
        {entry.message}
      </Text>
    </Flex>
  );
};

const LiveTab: React.FC<{ appLog: LogEntry[] }> = ({ appLog }) => {
  const autoScroll = useRef(true);
  const [checkBox, setCheckBox] = useState(autoScroll.current);
  const endOfDiv = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endOfDiv.current !== null && autoScroll.current) {
      endOfDiv.current.scrollIntoView();
    }
  }, [appLog]);

  return (
    <>
      <Box mt={2} ml={5}>
        <LightMode>
          <Checkbox
            isChecked={checkBox}
            onChange={(e) => {
              autoScroll.current = e.target.checked;
              setCheckBox(e.target.checked);
            }}
            borderColor="gray.400"
          >
            <Text fontSize="15px" fontWeight="medium" color="gray.800">
              Auto scroll
            </Text>
          </Checkbox>
        </LightMode>
      </Box>

      <Flex flexDir="column" p={5} maxHeight="60vh" overflow="auto">
        {appLog.map((entry, key) => (
          <LogRow key={key} entry={entry} />
        ))}
        <div ref={endOfDiv} style={{ marginTop: "20px" }}></div>
      </Flex>
    </>
  );
};

const LogFileTab: React.FC = () => {
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    readLogFile()
      .then((content) => {
        const parsed = content
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0)
          .map(parseLogLine)
          .filter((e): e is LogEntry => e !== null);
        setEntries(parsed);
      })
      .catch(() => setError("Could not read the log file."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Flex mt={2} ml={5} alignItems="center" gap={3}>
        <IconButton
          aria-label="Refresh"
          icon={<MdRefresh />}
          size="sm"
          onClick={load}
          isLoading={loading}
        />
        <Text fontSize="13px" color="gray.500">
          Showing entries from the last 30 days
        </Text>
      </Flex>

      <Flex flexDir="column" p={5} maxHeight="60vh" overflow="auto">
        {loading && entries === null && <Spinner size="md" alignSelf="center" />}
        {error && <Text color="red.500">{error}</Text>}
        {entries?.length === 0 && !loading && (
          <Text color="gray.500">No log entries found.</Text>
        )}
        {entries?.map((entry, key) => (
          <LogRow key={key} entry={entry} />
        ))}
      </Flex>
    </>
  );
};

const ErrorLog: React.FC<ErrorLogProps> = ({ isOpen, onClose, appLog }) => {
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize="25px" mt={[-2, -2, -1]}>
          App Logs
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          <Tabs colorScheme="brand">
            <TabList>
              <Tab>Live</Tab>
              <Tab>Log file</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <LiveTab appLog={appLog} />
              </TabPanel>
              <TabPanel px={0}>
                <LogFileTab />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="gray" onClick={onClose} size={buttonSize}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ErrorLog;
