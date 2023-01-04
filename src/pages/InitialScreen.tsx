import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  useBreakpointValue,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { Form, Formik } from "formik";
import React, { useState } from "react";
import { BiRefresh } from "react-icons/bi";
import { IoMdSettings } from "react-icons/io";
import DarkModeSwitch from "../components/DarkModeSwitch";
import InputField from "../components/form/InputField";
import NumberField from "../components/form/NumberField";
import SelectField from "../components/form/SelectField";
import useWindowSize from "../utils/useWindowSize";

interface InitialScreenProps {
  setScreen: React.Dispatch<
    React.SetStateAction<
      "Initial" | "SendFile" | "ReceiveFile" | "Monitor" | "ExaliseMonitor"
    >
  >;
}

const InitialScreen: React.FC<InitialScreenProps> = ({ setScreen }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);
  const modalSize = useBreakpointValue(["lg", "lg", "6xl"]);
  const textColor = useColorModeValue("gray.700", "white");
  const textColor2 = useColorModeValue("gray.500", "gray.100");
  const bigBg = useColorModeValue("gray.100", "gray.800");
  const bg = useColorModeValue("white", "gray.700");
  const boxShadow = useColorModeValue(
    `50px 50px 100px #d9d9d9,
    -50px -50px 100px #ffffff`,
    `50px 50px 100px #202834,
    -50px -50px 100px #252d3b`
  );

  const [portsAv, setPortsAv] = useState<string[]>([]);

  const { width } = useWindowSize();

  const logoSize = () => {
    if (width < 700) {
      return "40";
    }

    if (width < 1017) {
      return "50";
    }

    return "60";
  };

  const getAllAvailbleComs = () => {
    invoke("get_all_availble_ports")
      .then((message) => {
        setPortsAv(message as string[]);
      })
      .catch((error) => console.error(error));
  };

  return (
    <Flex
      justifyContent="center"
      alignItems="center"
      height="100vh"
      backgroundColor={bigBg}
    >
      <Box
        backgroundColor={bg}
        borderRadius="20px"
        padding={["30px", "40px", "50px"]}
        boxShadow={boxShadow}
        width={["80vw", "60vw", "500px"]}
      >
        <Flex alignItems={"center"} cursor="default" height={"fit-content"}>
          <Box boxSize={["30px", "40px", "50px"]} mb={1} mr={1}>
            <svg
              version="1.2"
              baseProfile="tiny-ps"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 2000 2000"
              width={logoSize()}
              height={logoSize()}
            >
              <title>Logo Exelise</title>
              <defs>
                <image
                  width="1190"
                  height="1326"
                  id="img1"
                  href="data:image/png;base64,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"
                />
              </defs>
              <path
                id="Background"
                className="shp0"
                d="M1000 2000C447 2000 0 1553 0 1000C0 447 447 0 1000 0C1553 0 2000 447 2000 1000C2000 1553 1553 2000 1000 2000Z"
              />
              <use id="Background copy" href="#img1" x="0" y="0" />
              <path id="Shape 5" className="shp1" d="M1534 1548" />
              <path
                id="Shape 5"
                className="shp2"
                d="M1044 386C1044 386 1682 377.78 1826 1034"
              />
              <path
                id="Shape 5"
                className="shp2"
                d="M1048 614C1048 614 1473.07 642.48 1602 1104"
              />
              <path
                id="Shape 4"
                className="shp3"
                d="M339 1075C297.53 1075 264 1041.48 264 1000C264 958.53 297.53 925 339 925C380.47 925 414 958.53 414 1000C414 1041.48 380.47 1075 339 1075Z"
              />
              <path
                id="Shape 4"
                className="shp3"
                d="M872.97 1219.91L871.03 1224.52L343.03 1002.3L344.97 997.7L872.97 1219.91Z"
              />
              <path
                id="Shape 4"
                className="shp3"
                d="M771 516C729.52 516 696 482.48 696 441C696 399.52 729.52 366 771 366C812.47 366 846 399.52 846 441C846 482.48 812.47 516 771 516Z"
              />
              <path
                id="Shape 4"
                className="shp3"
                d="M681 861C639.52 861 606 827.48 606 786C606 744.52 639.52 711 681 711C722.48 711 756 744.52 756 786C756 827.48 722.48 861 681 861Z"
              />
              <path
                id="Shape 4"
                className="shp3"
                d="M309 804C267.53 804 234 770.48 234 729C234 687.52 267.53 654 309 654C350.48 654 384 687.52 384 729C384 770.48 350.48 804 309 804Z"
              />
              <path
                id="Shape 4"
                className="shp3"
                d="M947.37 1085.84L944.36 1086.58L800.91 502.5L803.93 501.76L947.37 1085.84Z"
              />
              <path
                id="Shape 4"
                className="shp3"
                d="M908.86 1127.34L906.56 1131.24L713.03 836.63L715.33 832.73L908.86 1127.34Z"
              />
              <path
                id="Shape 4"
                className="shp3"
                d="M874.98 1162.82L872.46 1166.06L338.64 751.59L341.16 748.35L874.98 1162.82Z"
              />
              <path
                id="Shape 3"
                className="shp1"
                d="M1000 1347C930.88 1347 875 1291.13 875 1222C875 1152.88 930.88 1097 1000 1097C1069.13 1097 1125 1152.88 1125 1222C1125 1291.13 1069.13 1347 1000 1347Z"
              />
              <path
                id="Shape 5"
                className="shp2"
                d="M1050 850.29C1050 850.29 1287.05 828.09 1368 1166"
              />
              <path id="Shape 4" className="shp2" d="M1000 844" />
            </svg>
          </Box>
          <Heading
            ml={[3, 4, 5]}
            mt={2}
            fontFamily="Helvetica"
            fontSize={["20px", "30px", "40px"]}
            color={textColor}
            letterSpacing="widest"
            fontWeight="medium"
            style={{ transform: "scale(1, 0.9)" }}
          >
            Exalise
          </Heading>

          <Box ml="auto">
            <IconButton
              ml={2}
              aria-label="Settings"
              icon={<IoMdSettings />}
              size={buttonSize}
              bg={"transparent"}
              color={textColor}
              fontSize={["20px", "24px", "26px"]}
              onClick={onOpen}
            />
          </Box>
        </Flex>

        <Box mt={"30px"}>
          <Text fontSize={["16px", "20px", "24px"]}>File transfer</Text>
          <Flex>
            <Button
              mr={2}
              mt={2}
              onClick={() => setScreen("SendFile")}
              size={buttonSize}
            >
              Send file
            </Button>
            <Button
              mt={2}
              onClick={() => setScreen("ReceiveFile")}
              size={buttonSize}
            >
              Receive file
            </Button>
          </Flex>

          <Text fontSize={["16px", "20px", "24px"]} mt="20px">
            Monitoring
          </Text>

          <Button mt={2} onClick={() => setScreen("Monitor")} size={buttonSize}>
            Monitor
          </Button>

          <Text fontSize={["16px", "20px", "24px"]} mt="20px">
            Live data transfer
          </Text>
          <Button
            mt={2}
            onClick={() => setScreen("ExaliseMonitor")}
            size={buttonSize}
          >
            Monitor and send values to Exalise
          </Button>
        </Box>

        <Flex
          width={"100%"}
          justifyContent="center"
          mt={["20px", "30px", "40px"]}
          mb={["-20px", "-30px", "-40px"]}
        >
          <Text color={textColor2} fontSize={["10px", "12px", "14px"]}>
            Copyright ©Exalise 2022
          </Text>
        </Flex>
      </Box>

      <Modal isOpen={isOpen} size={modalSize} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize={["34px"]}>Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Formik
              initialValues={{
                port: "",
                baudRate: "9600",
                dataBits: 8,
                stopBits: 1,
                parity: "0",
                mqttkey: "",
                mqttsecret: "",
                devicekey: "",
              }}
              onSubmit={async (values, { setErrors, setValues }) => {}}
            >
              {({ isSubmitting, setFieldValue, values }) => (
                <Form>
                  <Flex mt={-3}>
                    <Box width={"50%"}>
                      <Text
                        fontSize={["14px", "17px", "20px"]}
                        mt={2}
                        fontWeight="bold"
                      >
                        RS232 settings
                      </Text>
                      <FormControl fontSize={["sm", "md", "lg"]} mt={2}>
                        <FormLabel
                          htmlFor={"port"}
                          color={textColor}
                          fontSize={["sm", "md", "lg"]}
                        >
                          Port
                        </FormLabel>

                        <Flex>
                          <Select
                            name={"port"}
                            mr={2}
                            value={values.port}
                            onChange={(e) =>
                              setFieldValue("port", e.target.value)
                            }
                            size={buttonSize}
                          >
                            <option value={""}>Select port</option>
                            {portsAv.map((e, key) => {
                              return (
                                <option value={e} key={key}>
                                  {e}
                                </option>
                              );
                            })}
                          </Select>

                          <IconButton
                            size={buttonSize}
                            icon={<BiRefresh />}
                            aria-label="Load available ports"
                            onClick={() => {
                              getAllAvailbleComs();
                              if (portsAv.length > 0)
                                setFieldValue("port", portsAv[0]);
                            }}
                          />
                        </Flex>
                      </FormControl>

                      <Box mt={2}>
                        <SelectField
                          label="Baud rate"
                          name="baudRate"
                          options={[
                            "50",
                            "75",
                            "110",
                            "134",
                            "150",
                            "200",
                            "300",
                            "600",
                            "1200",
                            "1800",
                            "2400",
                            "4800",
                            "9600",
                            "19200",
                            "38400",
                            "57600",
                            "115200",
                            "230400",
                            "460800",
                            "500000",
                            "576000",
                            "921600",
                            "1000000",
                            "1152000",
                            "1500000",
                            "2000000",
                            "2500000",
                            "3000000",
                            "3500000",
                            "4000000",
                          ]}
                          options2={[
                            "50",
                            "75",
                            "110",
                            "134",
                            "150",
                            "200",
                            "300",
                            "600",
                            "1200",
                            "1800",
                            "2400",
                            "4800",
                            "9600",
                            "19200",
                            "38400",
                            "57600",
                            "115200",
                            "230400",
                            "460800",
                            "500000",
                            "576000",
                            "921600",
                            "1000000",
                            "1152000",
                            "1500000",
                            "2000000",
                            "2500000",
                            "3000000",
                            "3500000",
                            "4000000",
                          ]}
                        />
                      </Box>
                      <Box mt={2}>
                        <NumberField
                          help=""
                          label="Data bits"
                          max={8}
                          min={5}
                          name="dataBits"
                          setFieldValue={setFieldValue}
                        />
                      </Box>

                      <Box mt={2}>
                        <NumberField
                          help=""
                          label="Stop bits"
                          max={2}
                          min={1}
                          name="stopBits"
                          setFieldValue={setFieldValue}
                        />
                      </Box>

                      <Box mt={2}>
                        <SelectField
                          label="Parity"
                          name="parity"
                          options={["None", "Even", "Odd"]}
                          options2={["0", "2", "1"]}
                        />
                      </Box>
                    </Box>
                    <Box width={"50%"} pl={5}>
                      <Text
                        fontSize={["14px", "17px", "20px"]}
                        mt={2}
                        fontWeight="bold"
                      >
                        Exalise settings
                      </Text>
                      <Box mt={2}>
                        <InputField label="Mqtt key" name="mqttkey" help="" />
                      </Box>

                      <Box mt={2}>
                        <InputField
                          label="Mqtt Secret"
                          name="mqttsecret"
                          help=""
                          type={"password"}
                        />
                      </Box>

                      <Box mt={2}>
                        <InputField
                          label="Device key"
                          name="devicekey"
                          help=""
                        />
                      </Box>
                    </Box>
                  </Flex>

                  <Flex justifyContent={"flex-end"} mt={4} mb={2}>
                    <Button
                      size={buttonSize}
                      colorScheme="blue"
                      mr={3}
                      onClick={onClose}
                    >
                      Close
                    </Button>
                    <Button
                      size={buttonSize}
                      variant="ghost"
                      type="submit"
                      isLoading={isSubmitting}
                    >
                      Save
                    </Button>
                  </Flex>
                </Form>
              )}
            </Formik>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default InitialScreen;
