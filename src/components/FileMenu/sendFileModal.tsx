import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import * as Dialog from "@tauri-apps/api/dialog";
import React, { useEffect, useState } from "react";
import { BsChevronDown, BsChevronRight } from "react-icons/bs";
import { FiFile, FiFolder, FiSend } from "react-icons/fi";
import { Store } from "tauri-plugin-store-api";
import { readTextFile } from "@tauri-apps/api/fs";

import TouchNumberInput from "../ui/TouchNumberInput";

interface SendFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  StartFileSending: (
    filePath: string,
    enableBreaks: number,
    maxChar: number,
    delay: number,
    listenCnc: number,
    stopChar: number,
    restartChar: number
  ) => Promise<string>;
  setFileSend: React.Dispatch<React.SetStateAction<boolean>>;
}

const SendFileModal: React.FC<SendFileModalProps> = ({
  isOpen,
  onClose,
  StartFileSending,
  setFileSend,
}) => {
  const [filePathFile, setFilePathFile] = useState("");
  const modalSize = useBreakpointValue(["lg", "2xl", "3xl"]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [advanceSettings, setAdvanceSettings] = useState(false);

  const [enableBreaks, setEnableBreaks] = useState(0);
  const [maxChar, setMaxChar] = useState(5000);
  const [delay, setDelay] = useState(1000);

  const [softwareBreaks, setSoftwareBreaks] = useState(0);
  const [stop, setStop] = useState(19);
  const [resume, setResume] = useState(17);

  const [filePreviewLines, setFilePreviewLines] = useState([""]);

  useEffect(() => {
    const store = new Store(".settings.dat");

    const loadInt = (key: string, set: (v: number) => void) => {
      store
        .get(key)
        .then((e: any) =>
          typeof e === "string"
            ? set(parseInt(e))
            : e === null
            ? null
            : set(parseInt(JSON.stringify(e)))
        )
        .catch((_e: any) => null);
    };

    store
      .get("sendFilePath")
      .then((e: any) =>
        typeof e === "string"
          ? setFilePathFile(e)
          : e === null
          ? null
          : setFilePathFile(JSON.stringify(e))
      )
      .catch((_e: any) => null);

    loadInt("enableBreaks", setEnableBreaks);
    loadInt("maxChar", setMaxChar);
    loadInt("delay", setDelay);
    loadInt("softwareBreaks", setSoftwareBreaks);
    loadInt("stop", setStop);
    loadInt("resume", setResume);
  }, []);

  useEffect(() => {
    const loadFilePreview = async () => {
      if (filePathFile !== "") {
        try {
          const content = await readTextFile(filePathFile);
          const lines = content.split(/\r?\n/);
          setFilePreviewLines(lines);
        } catch (err) {
          setFilePreviewLines(["⚠️ Unable to read file"]);
        }
      } else {
        setFilePreviewLines([""]);
      }
    };

    loadFilePreview();
  }, [filePathFile]);

  const pickFile = () => {
    Dialog.open({
      defaultPath: "\\\\ESMA-AD\\Public2\\CNC_PROGRAMMAAS+MEET\\CNC FREES",
      directory: false,
      multiple: false,
      filters: [
        {
          name: ".txt",
          extensions: ["txt"],
        },
      ],
    })
      .then((e) => {
        if (e !== null) {
          setFilePathFile(e as string);
        }
      })
      .catch((e) => console.log("error", e));
  };

  const fileName = filePathFile.split(/[\\/]/).pop() ?? "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent>
        <ModalHeader>Send file</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {/* One large tap target to pick the file */}
          <FormControl>
            <FormLabel>File to transfer</FormLabel>
            <Flex
              as="button"
              onClick={pickFile}
              width="100%"
              minH="84px"
              align="center"
              px={5}
              gap={4}
              borderRadius="2xl"
              borderWidth="2px"
              borderStyle={filePathFile === "" ? "dashed" : "solid"}
              borderColor={filePathFile === "" ? "gray.300" : "brand.500"}
              bg={filePathFile === "" ? "gray.50" : "brand.50"}
              _hover={{ borderColor: "brand.500", bg: "brand.50" }}
              _active={{ bg: "brand.100" }}
              transition="all 0.15s ease"
              textAlign="left"
            >
              <Flex
                boxSize="52px"
                borderRadius="xl"
                bg={filePathFile === "" ? "gray.200" : "brand.500"}
                color={filePathFile === "" ? "gray.600" : "white"}
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon as={filePathFile === "" ? FiFolder : FiFile} boxSize="26px" />
              </Flex>
              {filePathFile === "" ? (
                <Text fontSize="lg" fontWeight="medium" color="gray.600">
                  Tap to choose a file…
                </Text>
              ) : (
                <Box overflow="hidden">
                  <Text fontSize="lg" fontWeight="bold" noOfLines={1}>
                    {fileName}
                  </Text>
                  <Text fontSize="sm" color="gray.500" noOfLines={1}>
                    {filePathFile}
                  </Text>
                </Box>
              )}
            </Flex>
          </FormControl>

          {filePathFile !== "" ? (
            <Box mt={5}>
              <Text fontSize="md" fontWeight="semibold" color="gray.600" mb={2}>
                File preview
              </Text>
              <Box
                maxH="180px"
                overflowY="auto"
                bg="gray.900"
                color="green.200"
                fontFamily="mono"
                fontSize="sm"
                borderRadius="xl"
                px={4}
                py={3}
              >
                {filePreviewLines.map((e, key) => (
                  <Text key={key} whiteSpace="pre-wrap">
                    {e}
                  </Text>
                ))}
              </Box>
            </Box>
          ) : null}

          <Button
            variant="ghost"
            colorScheme="brand"
            mt={5}
            leftIcon={
              <Icon as={advanceSettings ? BsChevronDown : BsChevronRight} />
            }
            onClick={() => setAdvanceSettings((e) => !e)}
          >
            Advanced settings
          </Button>

          {advanceSettings ? (
            <Box
              mt={3}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="gray.200"
              bg="gray.50"
              px={5}
              py={5}
            >
              <Checkbox
                isChecked={softwareBreaks === 1}
                onChange={() => setSoftwareBreaks((e) => (e === 0 ? 1 : 0))}
              >
                <Text fontSize="lg" fontWeight="medium" ml={1}>
                  Luister naar CNC
                </Text>
              </Checkbox>

              {softwareBreaks === 1 ? (
                <Flex mt={4} gap={6} flexWrap="wrap">
                  <FormControl width="fit-content">
                    <FormLabel>Stop</FormLabel>
                    <TouchNumberInput
                      value={stop}
                      onChange={setStop}
                      min={0}
                      max={127}
                    />
                  </FormControl>
                  <FormControl width="fit-content">
                    <FormLabel>Hervat</FormLabel>
                    <TouchNumberInput
                      value={resume}
                      onChange={setResume}
                      min={0}
                      max={127}
                    />
                  </FormControl>
                </Flex>
              ) : null}

              <Box mt={5}>
                <Checkbox
                  isChecked={enableBreaks === 1}
                  onChange={() => setEnableBreaks((e) => (e === 0 ? 1 : 0))}
                >
                  <Text fontSize="lg" fontWeight="medium" ml={1}>
                    Verstuur in delen
                  </Text>
                </Checkbox>
              </Box>

              {enableBreaks === 1 ? (
                <Flex mt={4} gap={6} flexWrap="wrap">
                  <FormControl width="fit-content">
                    <FormLabel>Max characters</FormLabel>
                    <TouchNumberInput
                      value={maxChar}
                      onChange={setMaxChar}
                      min={0}
                      step={500}
                    />
                  </FormControl>
                  <FormControl width="fit-content">
                    <FormLabel>Wachttijd (ms)</FormLabel>
                    <TouchNumberInput
                      value={delay}
                      onChange={setDelay}
                      min={0}
                      step={100}
                    />
                  </FormControl>
                </Flex>
              ) : null}
            </Box>
          ) : null}
        </ModalBody>

        <ModalFooter gap={3} flexWrap="wrap">
          {error === "" ? null : (
            <Text color="red.500" fontSize="md" fontWeight="semibold" mr="auto">
              {error}
            </Text>
          )}
          <Button variant="outline" colorScheme="gray" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="brand"
            size="lg"
            leftIcon={<FiSend />}
            isDisabled={filePathFile === ""}
            onClick={async () => {
              setLoading(true);

              try {
                const store = new Store(".settings.dat");
                await store.set("sendFilePath", filePathFile);
                await store.set("enableBreaks", enableBreaks);
                await store.set("maxChar", maxChar);
                await store.set("delay", delay);
                await store.set("softwareBreaks", softwareBreaks);
                await store.set("stop", stop);
                await store.set("resume", resume);

                await store.save();
              } catch (_error) {
                setLoading(false);
                setError("Something went wrong, try again later");
                return;
              }
              const res = await StartFileSending(
                filePathFile,
                enableBreaks,
                maxChar,
                delay,
                softwareBreaks,
                stop,
                resume
              );
              setLoading(false);
              if (res === "oke") {
                setFileSend(true);
                setError("");
                onClose();
              } else {
                setError(res);
              }
            }}
            isLoading={loading}
          >
            Start file transfer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SendFileModal;
