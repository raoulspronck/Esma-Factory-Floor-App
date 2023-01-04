import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Input,
  Text,
  InputGroup,
  InputRightAddon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useBreakpointValue,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Checkbox,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { GoFileDirectory } from "react-icons/go";
import * as Dialog from "@tauri-apps/api/dialog";
import { Store } from "tauri-plugin-store-api";
import { BsChevronDown, BsChevronRight } from "react-icons/bs";

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
  const modalSize = useBreakpointValue(["sm", "lg", "2xl"]);
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [advanceSettings, setAdvanceSettings] = useState(false);

  const [enableBreaks, setEnableBreaks] = useState(0);
  const [maxChar, setMaxChar] = useState(5000);
  const [delay, setDelay] = useState(1000);

  const [softwareBreaks, setSoftwareBreaks] = useState(0);
  const [stop, setStop] = useState(19);
  const [resume, setResume] = useState(17);

  useEffect(() => {
    const store = new Store(".settings.dat");

    store
      .get("sendFilePath")
      .then((e: any) =>
        typeof e === "string"
          ? setFilePathFile(e)
          : e === null
          ? null
          : setFilePathFile(JSON.stringify(e))
      )
      .catch((_e) => null);

    store
      .get("enableBreaks")
      .then((e: any) =>
        typeof e === "string"
          ? setEnableBreaks(parseInt(e))
          : e === null
          ? null
          : setEnableBreaks(parseInt(JSON.stringify(e)))
      )
      .catch((_e) => null);

    store
      .get("maxChar")
      .then((e: any) =>
        typeof e === "string"
          ? setMaxChar(parseInt(e))
          : e === null
          ? null
          : setMaxChar(parseInt(JSON.stringify(e)))
      )
      .catch((_e) => null);

    store
      .get("delay")
      .then((e: any) =>
        typeof e === "string"
          ? setDelay(parseInt(e))
          : e === null
          ? null
          : setDelay(parseInt(JSON.stringify(e)))
      )
      .catch((_e) => null);

    store
      .get("softwareBreaks")
      .then((e: any) =>
        typeof e === "string"
          ? setSoftwareBreaks(parseInt(e))
          : e === null
          ? null
          : setSoftwareBreaks(parseInt(JSON.stringify(e)))
      )
      .catch((_e) => null);

    store
      .get("stop")
      .then((e: any) =>
        typeof e === "string"
          ? setStop(parseInt(e))
          : e === null
          ? null
          : setStop(parseInt(JSON.stringify(e)))
      )
      .catch((_e) => null);

    store
      .get("resume")
      .then((e: any) =>
        typeof e === "string"
          ? setResume(parseInt(e))
          : e === null
          ? null
          : setResume(parseInt(JSON.stringify(e)))
      )
      .catch((_e) => null);
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          Send file
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          <Box mt={[-2, 0, 2]}>
            <FormControl fontSize={["sm", "md", "lg"]}>
              <Flex alignItems="center">
                <FormLabel fontSize={["sm", "md", "lg"]}>
                  Select file to transfer
                </FormLabel>
              </Flex>

              <InputGroup size={buttonSize}>
                <Input
                  fontSize={["sm", "md", "lg"]}
                  readOnly
                  value={filePathFile}
                />
                <InputRightAddon
                  cursor="pointer"
                  onClick={() => {
                    Dialog.open({
                      //defaultPath: filePath === "" ? undefined : filePath,
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
                        if (e != null) {
                          const pathToFile = e as string;

                          setFilePathFile(pathToFile);
                          /* setFilePath(
                        pathToFile.substring(
                          0,
                          pathToFile.lastIndexOf("\\")
                        )
                      ); */
                        }
                      })
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
              Advance settings
            </Text>
          </Flex>

          {advanceSettings ? (
            <>
              <Box mt={3}>
                <FormControl>
                  <Checkbox
                    isChecked={softwareBreaks == 1}
                    onChange={(i) => {
                      setSoftwareBreaks((e) => (e == 0 ? 1 : 0));
                    }}
                    size={buttonSize}
                  >
                    <FormLabel fontSize={["sm", "md", "lg"]} mt={1}>
                      Luister naar CNC
                    </FormLabel>
                  </Checkbox>
                </FormControl>
              </Box>

              {softwareBreaks == 1 ? (
                <Flex mt={3}>
                  <Box mr={2}>
                    <FormControl>
                      <FormLabel fontSize={["sm", "md", "lg"]}>Stop</FormLabel>

                      <NumberInput
                        size={buttonSize}
                        min={0}
                        value={stop}
                        onChange={(e) => setStop(parseInt(e))}
                        fontSize={["sm", "md", "lg"]}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </Box>

                  <Box ml={2}>
                    <FormControl>
                      <FormLabel fontSize={["sm", "md", "lg"]}>
                        Hervat
                      </FormLabel>

                      <NumberInput
                        size={buttonSize}
                        min={0}
                        max={127}
                        value={resume}
                        onChange={(e) => setResume(parseInt(e))}
                        fontSize={["sm", "md", "lg"]}
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
              ) : null}
              <Box mt={3}>
                <FormControl>
                  <Checkbox
                    isChecked={enableBreaks == 1}
                    onChange={(i) => {
                      setEnableBreaks((e) => (e == 0 ? 1 : 0));
                    }}
                    size={buttonSize}
                  >
                    <FormLabel fontSize={["sm", "md", "lg"]} mt={1}>
                      Verstuur in delen
                    </FormLabel>
                  </Checkbox>
                </FormControl>
              </Box>

              {enableBreaks == 1 ? (
                <Flex mt={3}>
                  <Box mr={2}>
                    <FormControl>
                      <FormLabel fontSize={["sm", "md", "lg"]}>
                        Max characters
                      </FormLabel>

                      <NumberInput
                        size={buttonSize}
                        min={0}
                        value={maxChar}
                        onChange={(e) => setMaxChar(parseInt(e))}
                        fontSize={["sm", "md", "lg"]}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </Box>

                  <Box ml={2}>
                    <FormControl>
                      <FormLabel fontSize={["sm", "md", "lg"]}>
                        Wachttijd
                      </FormLabel>

                      <NumberInput
                        size={buttonSize}
                        min={0}
                        max={127}
                        value={delay}
                        onChange={(e) => setDelay(parseInt(e))}
                        fontSize={["sm", "md", "lg"]}
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
              ) : null}
            </>
          ) : null}
        </ModalBody>

        <ModalFooter>
          {error == "" ? null : (
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
            ml="auto"
            mr={3}
            size={buttonSize}
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
                // go go go
                setFileSend(true);
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

export default SendFileModal;
