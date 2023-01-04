import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  LightMode,
  useBreakpointValue,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { Store } from "tauri-plugin-store-api";
interface ExaliseSettingTaskbarProps {
  mqttKey: string;
  setMqttKey: React.Dispatch<React.SetStateAction<string>>;
  mqttSecret: string;
  setMqttSecret: React.Dispatch<React.SetStateAction<string>>;
  deviceKey: string;
  setDeviceKey: React.Dispatch<React.SetStateAction<string>>;
}

const ExaliseSettingTaskbar: React.FC<ExaliseSettingTaskbarProps> = ({
  mqttKey,
  setMqttKey,
  mqttSecret,
  setMqttSecret,
  deviceKey,
  setDeviceKey,
}) => {
  const buttonSize = useBreakpointValue(["xs", "xs", "sm"]);
  const fontSize = useBreakpointValue(["12px", "14px", "16px"]);

  const [unsavedchanges, setunsavedchanges] = useState(false);

  const saveSettings = async () => {
    try {
      const store = new Store(".settings.dat");
      await store.set("mqttKey", mqttKey);
      await store.set("mqttSecret", mqttSecret);
      await store.set("deviceKey", deviceKey);
      await store.save();
      return true;
    } catch (error) {
      return false;
    }
  };

  return (
    <Flex
      height={["105px", "80px", "50px"]}
      bgColor={"#5c5c5c"}
      color="white"
      borderBottom={"1px solid"}
      borderColor="blackAlpha.900"
      alignItems={"center"}
    >
      <Flex
        flexDir={["column", "column", "row"]}
        width={"fit-content"}
        pl={[1, 2, 3]}
      >
        <Flex flexDir={["column", "row", "row"]} width={"fit-content"}>
          <Flex alignItems="center" width={"fit-content"}>
            <FormControl size={buttonSize} width="250px">
              <Flex alignItems="center">
                <FormLabel
                  fontSize={fontSize}
                  mt="2"
                  mr="1"
                  minWidth={["55px", "65px", "75px"]}
                >
                  Mqtt key:
                </FormLabel>
                <Input
                  size={buttonSize}
                  fontSize={fontSize}
                  value={mqttKey}
                  onChange={(e) => {
                    setMqttKey(e.target.value);
                    setunsavedchanges(true);
                  }}
                  ml={["auto", "unset"]}
                  width={["180px", "unset"]}
                />
              </Flex>
            </FormControl>
          </Flex>
          <Flex alignItems="center" width={"fit-content"}>
            <FormControl size={buttonSize} width="270px" ml={[0, 3]}>
              <Flex alignItems="center">
                <FormLabel
                  fontSize={fontSize}
                  mt="2"
                  mr="1"
                  minWidth={["75px", "80px", "95px"]}
                >
                  Mqtt secret:
                </FormLabel>
                <Input
                  size={buttonSize}
                  fontSize={fontSize}
                  value={mqttSecret}
                  onChange={(e) => {
                    setMqttSecret(e.target.value);
                    setunsavedchanges(true);
                  }}
                  type="password"
                  ml={["auto", "unset"]}
                  width={["180px", "unset"]}
                />
              </Flex>
            </FormControl>
          </Flex>
        </Flex>
        <Flex alignItems="center" width={"fit-content"}>
          <FormControl size={buttonSize} width="270px" ml={[0, 0, 3]}>
            <Flex alignItems="center">
              <FormLabel
                fontSize={fontSize}
                mt="2"
                mr="1"
                minWidth={["75px", "75px", "95px"]}
              >
                Device key:
              </FormLabel>
              <Input
                size={buttonSize}
                fontSize={fontSize}
                value={deviceKey}
                onChange={(e) => {
                  setDeviceKey(e.target.value);
                  setunsavedchanges(true);
                }}
                ml={["auto", "unset"]}
                width={["180px", "unset"]}
              />
            </Flex>
          </FormControl>
        </Flex>
      </Flex>

      {unsavedchanges ? (
        <LightMode>
          <Button
            colorScheme={"twitter"}
            height={["50px", "40px", "30px"]}
            ml="auto"
            mr={3}
            size={buttonSize}
            onClick={async () => {
              const save = await saveSettings();
              if (save) {
                setunsavedchanges(false);
                return;
              }
            }}
          >
            Save
          </Button>
        </LightMode>
      ) : null}
    </Flex>
  );
};

export default ExaliseSettingTaskbar;
