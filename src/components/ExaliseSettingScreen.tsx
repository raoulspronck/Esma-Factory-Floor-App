import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { Store } from "tauri-plugin-store-api";

interface ExaliseSettingScreenProps {
  setExaliseConf: React.Dispatch<
    React.SetStateAction<{
      mqttKey: string;
      mqttSecret: string;
      deviceKey: string;
    }>
  >;
  setScreen: React.Dispatch<
    React.SetStateAction<
      "Initial" | "SendFile" | "ReceiveFile" | "Monitor" | "ExaliseMonitor"
    >
  >;
}

const ExaliseSettingScreen: React.FC<ExaliseSettingScreenProps> = ({
  setExaliseConf,
  setScreen,
}) => {
  const size = useBreakpointValue(["sm", "md", "lg"]);
  const textColor = useColorModeValue("gray.700", "white");

  const [mqttKey, setMqttKey] = useState("");
  const [mqttSecret, setMqttSecret] = useState("");
  const [deviceKey, setDeviceKey] = useState("");

  useEffect(() => {
    const store = new Store(".settings.dat");
    store
      .get("mqtt-key")
      .then((e: any) =>
        typeof e === "string"
          ? setMqttKey(e)
          : e === null
          ? setMqttKey("")
          : setMqttKey(JSON.stringify(e))
      )
      .catch((_e) => setMqttKey(""));

    store
      .get("mqtt-secret")
      .then((e: any) =>
        typeof e === "string"
          ? setMqttSecret(e)
          : e === null
          ? setMqttSecret("")
          : setMqttSecret(JSON.stringify(e))
      )
      .catch((_e) => setMqttSecret(""));

    store
      .get("device-key")
      .then((e: any) =>
        typeof e === "string"
          ? setDeviceKey(e)
          : e === null
          ? setDeviceKey("")
          : setDeviceKey(JSON.stringify(e))
      )
      .catch((_e) => setDeviceKey(""));
  }, []);

  const validateInput = async () => {
    if (mqttKey != "" && mqttSecret != "" && deviceKey != "") {
      const store = new Store(".settings.dat");
      await store.set("mqtt-key", mqttKey);
      await store.set("mqtt-secret", mqttSecret);
      await store.set("device-key", deviceKey);
      await store.save();

      setExaliseConf({
        deviceKey,
        mqttKey,
        mqttSecret,
      });
    }
  };

  return (
    <Flex
      height={"100vh"}
      width="100vw"
      justifyContent={"center"}
      alignItems="center"
      bgColor={"gray.300"}
    >
      <Flex
        width={"700px"}
        maxW="95vw"
        bgColor="white"
        borderRadius={"20px"}
        flexDir="column"
        p="20px"
      >
        <Heading color="gray.800" fontSize={["16px", "20px", "24px"]} mt="20px">
          Bevestig Exalise settings
        </Heading>

        <Box mt={5}>
          <FormControl fontSize={["sm", "md", "lg"]}>
            <Flex alignItems="center">
              <FormLabel color={textColor} fontSize={["sm", "md", "lg"]}>
                Mqtt key
              </FormLabel>
            </Flex>
            <Input
              size={size}
              color={textColor}
              fontSize={["sm", "md", "lg"]}
              value={mqttKey}
              onChange={(e) => setMqttKey(e.target.value)}
            />
          </FormControl>
        </Box>

        <Box mt={5}>
          <FormControl fontSize={["sm", "md", "lg"]}>
            <Flex alignItems="center">
              <FormLabel color={textColor} fontSize={["sm", "md", "lg"]}>
                Mqtt secret
              </FormLabel>
            </Flex>
            <Input
              size={size}
              color={textColor}
              fontSize={["sm", "md", "lg"]}
              value={mqttSecret}
              onChange={(e) => setMqttSecret(e.target.value)}
              type="password"
            />
          </FormControl>
        </Box>

        <Box mt={5}>
          <FormControl fontSize={["sm", "md", "lg"]}>
            <Flex alignItems="center">
              <FormLabel color={textColor} fontSize={["sm", "md", "lg"]}>
                Device key
              </FormLabel>
            </Flex>
            <Input
              size={size}
              color={textColor}
              fontSize={["sm", "md", "lg"]}
              value={deviceKey}
              onChange={(e) => setDeviceKey(e.target.value)}
            />
          </FormControl>
        </Box>

        <Flex width="fit-content" ml="auto" mt="20px">
          <Button
            mr="1"
            onClick={() => {
              setScreen("Initial");
            }}
            size={size}
          >
            Exit
          </Button>
          <Button
            ml="1"
            colorScheme={"twitter"}
            size={size}
            onClick={() => validateInput()}
          >
            Volgende
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ExaliseSettingScreen;
