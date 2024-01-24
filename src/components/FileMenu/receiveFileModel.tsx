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
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import * as Dialog from "@tauri-apps/api/dialog";
import React, { useEffect, useState } from "react";
import { BsChevronDown, BsChevronRight } from "react-icons/bs";
import { GoFileDirectory } from "react-icons/go";
import { GrAdd } from "react-icons/gr";
import { HiMinus } from "react-icons/hi";
import { Store } from "tauri-plugin-store-api";

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

  const modalSize = useBreakpointValue(["sm", "lg", "2xl"]);
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          Receive file
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          <Box mt={[-2, 0, 2]}>
            <FormControl fontSize={["sm", "md", "lg"]}>
              <Flex alignItems="center">
                <FormLabel fontSize={["sm", "md", "lg"]}>File name</FormLabel>
              </Flex>
              <InputGroup size={buttonSize}>
                <Input
                  fontSize={["sm", "md", "lg"]}
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
                <InputRightAddon children=".txt" />
              </InputGroup>
            </FormControl>
          </Box>

          <Box mt={3}>
            <FormControl fontSize={["sm", "md", "lg"]}>
              <Flex alignItems="center">
                <FormLabel fontSize={["sm", "md", "lg"]}>FIle path</FormLabel>
              </Flex>

              <InputGroup size={buttonSize}>
                <Input
                  fontSize={["sm", "md", "lg"]}
                  readOnly
                  value={filePath}
                />
                <InputRightAddon
                  cursor="pointer"
                  onClick={() => {
                    Dialog.open({
                      defaultPath:
                        "\\\\ESMA-AD\\Public2\\CNC_PROGRAMMAAS+MEET\\CNC FREES\\",
                      directory: true,
                      multiple: false,
                    })
                      .then((e) =>
                        e !== null ? setFilePath(e as string) : null
                      )
                      .catch((e) => console.log("error", e));
                  }}
                  children={<Icon as={GoFileDirectory} />}
                />
              </InputGroup>
            </FormControl>
          </Box>

          <Flex
            alignItems={"center"}
            width="fit-content"
            mt={2}
            cursor="pointer"
            onClick={() => setAdvanceSettings((e) => !e)}
          >
            {advanceSettings ? (
              <Icon as={BsChevronDown} fontSize={["12px", "14px", "16px"]} />
            ) : (
              <Icon as={BsChevronRight} fontSize={["12px", "14px", "16px"]} />
            )}

            <Text fontSize={["12px", "14px", "16px"]} fontWeight="medium">
              More settings
            </Text>
          </Flex>

          {advanceSettings ? (
            <>
              <Flex mt={3}>
                <Box>
                  <FormControl>
                    <FormLabel fontSize={["sm", "md", "lg"]}>
                      Start decimal
                    </FormLabel>

                    <NumberInput
                      size={buttonSize}
                      min={0}
                      max={127}
                      value={startFile}
                      onChange={(e) => setStartFile(parseInt(e))}
                      fontSize={["sm", "md", "lg"]}
                      width="80px"
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </Box>

                <Box>
                  <FormControl>
                    <FormLabel fontSize={["sm", "md", "lg"]}>
                      Stop decimal
                    </FormLabel>

                    <NumberInput
                      size={buttonSize}
                      min={0}
                      max={127}
                      value={stopFile}
                      onChange={(e) => setStopFile(parseInt(e))}
                      fontSize={["sm", "md", "lg"]}
                      width="80px"
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </Box>
              </Flex>

              <Box mt={3}>
                <FormControl>
                  <FormLabel fontSize={["sm", "md", "lg"]}>
                    Decimals to filter out
                  </FormLabel>
                  <Flex maxW={"95%"} flexWrap="wrap">
                    {filterDecimals.map((i, key) => {
                      return (
                        <Flex mr={3} mb={2}>
                          <IconButton
                            size={"xs"}
                            aria-label={"remove filter item"}
                            icon={<HiMinus />}
                            colorScheme="red"
                            height={"100%"}
                            onClick={() => {
                              let array = [...filterDecimals];
                              array.splice(key, 1);
                              setFilterDecimals([...array]);
                            }}
                          />
                          <NumberInput
                            size={buttonSize}
                            min={0}
                            max={127}
                            value={i}
                            onChange={(e) => {
                              let array = [...filterDecimals];
                              array[key] = parseInt(e);
                              setFilterDecimals([...array]);
                            }}
                            fontSize={["sm", "md", "lg"]}
                            width="80px"
                            key={key}
                            allowMouseWheel
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </Flex>
                      );
                    })}
                    <IconButton
                      size={buttonSize}
                      aria-label={"add filter item"}
                      icon={<GrAdd />}
                      onClick={() => setFilterDecimals((e) => [...e, 0])}
                    />
                  </Flex>
                </FormControl>
              </Box>
            </>
          ) : null}
        </ModalBody>

        <ModalFooter>
          {error === "" ? null : (
            <Text
              color="red"
              fontSize={["12px", "14px", "16px"]}
              fontWeight={"medium"}
            >
              {error}
            </Text>
          )}
          <Button
            colorScheme={"twitter"}
            mr={3}
            size={buttonSize}
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
                // go go go
                setFileReceive(true);
                setError("");
                onClose();
              } else {
                //show error
                setError(res);
              }
            }}
            isLoading={loading}
          >
            Start file transfer
          </Button>

          <Button colorScheme="gray" onClick={onClose} size={buttonSize}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ReceiveFileModal;
