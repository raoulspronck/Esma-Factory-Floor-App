import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightAddon,
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
import { FiDownload, FiFolder, FiPlus, FiTrash2 } from "react-icons/fi";
import { Store } from "tauri-plugin-store-api";

import TouchNumberInput from "../ui/TouchNumberInput";

interface ReceiveFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  StartFileReceiving: (
    filePath: string,
    startDecimal: number,
    stopDecimal: number,
    forbiddenDecimals: number[]
  ) => Promise<string>;
  setFileReceive: React.Dispatch<React.SetStateAction<boolean>>;
}

const ReceiveFileModal: React.FC<ReceiveFileModalProps> = ({
  isOpen,
  onClose,
  StartFileReceiving,
  setFileReceive,
}) => {
  const [fileName, setFileName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [advanceSettings, setAdvanceSettings] = useState(false);
  const [startFile, setStartFile] = useState(18);
  const [stopFile, setStopFile] = useState(20);
  const [filterDecimals, setFilterDecimals] = useState<number[]>([0, 13]);

  const modalSize = useBreakpointValue(["lg", "2xl", "3xl"]);

  useEffect(() => {
    const store = new Store(".settings.dat");

    store
      .get("receiveFilePath")
      .then((e: any) =>
        typeof e === "string"
          ? setFilePath(e)
          : e === null
          ? null
          : setFilePath(JSON.stringify(e))
      )
      .catch((_e) => null);

    store
      .get("receiveFileName")
      .then((e: any) =>
        typeof e === "string"
          ? setFileName(e)
          : e === null
          ? null
          : setFileName(JSON.stringify(e))
      )
      .catch((_e) => null);

    store
      .get("startDecimal")
      .then((e: any) =>
        typeof e === "string"
          ? setStartFile(parseInt(e))
          : e === null
          ? null
          : setStartFile(parseInt(JSON.stringify(e)))
      )
      .catch((_e) => null);

    store
      .get("stopDecimal")
      .then((e: any) =>
        typeof e === "string"
          ? setStopFile(parseInt(e))
          : e === null
          ? null
          : setStopFile(parseInt(JSON.stringify(e)))
      )
      .catch((_e) => null);

    store
      .get("filterDecimals")
      .then((e: any) =>
        typeof e === "string"
          ? setFilterDecimals(JSON.parse(e))
          : e === null
          ? null
          : setFilterDecimals(e)
      )
      .catch((_e) => null);
  }, []);

  const pickFolder = () => {
    Dialog.open({
      defaultPath: "\\\\ESMA-AD\\Public2\\CNC_PROGRAMMAAS+MEET\\CNC FREES\\",
      directory: true,
      multiple: false,
    })
      .then((e) => (e !== null ? setFilePath(e as string) : null))
      .catch((e) => console.log("error", e));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent>
        <ModalHeader>Receive file</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>File name</FormLabel>
            <InputGroup size="lg">
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Program name"
              />
              <InputRightAddon
                h="56px"
                fontSize="lg"
                fontWeight="semibold"
                children=".txt"
              />
            </InputGroup>
          </FormControl>

          {/* One large tap target to pick the destination folder */}
          <FormControl mt={5}>
            <FormLabel>Save location</FormLabel>
            <Flex
              as="button"
              onClick={pickFolder}
              width="100%"
              minH="84px"
              align="center"
              px={5}
              gap={4}
              borderRadius="2xl"
              borderWidth="2px"
              borderStyle={filePath === "" ? "dashed" : "solid"}
              borderColor={filePath === "" ? "gray.300" : "brand.500"}
              bg={filePath === "" ? "gray.50" : "brand.50"}
              _hover={{ borderColor: "brand.500", bg: "brand.50" }}
              _active={{ bg: "brand.100" }}
              transition="all 0.15s ease"
              textAlign="left"
            >
              <Flex
                boxSize="52px"
                borderRadius="xl"
                bg={filePath === "" ? "gray.200" : "brand.500"}
                color={filePath === "" ? "gray.600" : "white"}
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon as={FiFolder} boxSize="26px" />
              </Flex>
              {filePath === "" ? (
                <Text fontSize="lg" fontWeight="medium" color="gray.600">
                  Tap to choose a folder…
                </Text>
              ) : (
                <Text fontSize="lg" fontWeight="bold" noOfLines={2} wordBreak="break-all">
                  {filePath}
                </Text>
              )}
            </Flex>
          </FormControl>

          <Button
            variant="ghost"
            colorScheme="brand"
            mt={5}
            leftIcon={
              <Icon as={advanceSettings ? BsChevronDown : BsChevronRight} />
            }
            onClick={() => setAdvanceSettings((e) => !e)}
          >
            More settings
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
              <Flex gap={6} flexWrap="wrap">
                <FormControl width="fit-content">
                  <FormLabel>Start decimal</FormLabel>
                  <TouchNumberInput
                    value={startFile}
                    onChange={setStartFile}
                    min={0}
                    max={127}
                  />
                </FormControl>

                <FormControl width="fit-content">
                  <FormLabel>Stop decimal</FormLabel>
                  <TouchNumberInput
                    value={stopFile}
                    onChange={setStopFile}
                    min={0}
                    max={127}
                  />
                </FormControl>
              </Flex>

              <FormControl mt={5}>
                <FormLabel>Decimals to filter out</FormLabel>
                <Flex flexWrap="wrap" gap={4}>
                  {filterDecimals.map((i, key) => (
                    <Flex
                      key={key}
                      align="center"
                      gap={2}
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor="gray.200"
                      bg="white"
                      px={2}
                      py={2}
                    >
                      <TouchNumberInput
                        value={i}
                        onChange={(v) => {
                          const array = [...filterDecimals];
                          array[key] = v;
                          setFilterDecimals([...array]);
                        }}
                        min={0}
                        max={127}
                        width="190px"
                      />
                      <IconButton
                        aria-label="remove filter item"
                        icon={<FiTrash2 />}
                        boxSize="52px"
                        minW="52px"
                        fontSize="20px"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => {
                          const array = [...filterDecimals];
                          array.splice(key, 1);
                          setFilterDecimals([...array]);
                        }}
                      />
                    </Flex>
                  ))}
                  <Button
                    leftIcon={<FiPlus />}
                    variant="outline"
                    colorScheme="brand"
                    h="72px"
                    borderRadius="xl"
                    borderStyle="dashed"
                    onClick={() => setFilterDecimals((e) => [...e, 0])}
                  >
                    Add
                  </Button>
                </Flex>
              </FormControl>
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
            leftIcon={<FiDownload />}
            isDisabled={fileName === "" || filePath === ""}
            onClick={async () => {
              setLoading(true);

              try {
                const store = new Store(".settings.dat");
                await store.set("receiveFilePath", filePath);
                await store.set("receiveFileName", fileName);

                await store.set("startDecimal", startFile);
                await store.set("stopDecimal", stopFile);
                await store.set(
                  "filterDecimals",
                  JSON.stringify(filterDecimals)
                );

                await store.save();
              } catch (_error) {
                setLoading(false);
                setError("Something went wrong, try again later");
                return;
              }

              let newFilterDecimals = filterDecimals.reduce(function (a, b) {
                if (a.indexOf(b) < 0) {
                  a.push(b);
                }
                return a;
              }, []);

              const res = await StartFileReceiving(
                filePath + "\\" + fileName + ".txt",
                startFile,
                stopFile,
                newFilterDecimals
              );
              setLoading(false);
              if (res === "oke") {
                setFileReceive(true);
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

export default ReceiveFileModal;
