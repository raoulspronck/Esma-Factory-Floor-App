import {
  useBreakpointValue,
  useToast,
  Modal,
  Box,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormControl,
  FormLabel,
  Select,
  ModalFooter,
  Text,
  Button,
  Flex,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React, { useEffect, useState } from "react";
import { BiTrash } from "react-icons/bi";
import { GrAdd } from "react-icons/gr";
interface ManageAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: any[];
  setAlerts: React.Dispatch<React.SetStateAction<any[]>>;
}

const ManageAlertsModal: React.FC<ManageAlertsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  setAlerts,
}) => {
  const modalSize = useBreakpointValue(["xs", "sm", "md"]);
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);
  const toast = useToast();

  const [devices, setDevices] = useState([]);
  const [device, setDevice] = useState("");

  const [datapoints, setDatapoints] = useState([]);
  const [datapoint, setDatapoint] = useState("");

  const [acceptAlerts, setAcceptAlerts] = useState([]);
  const [acceptAlert, setAcceptAlert] = useState("Yes");

  const [adding, setAdding] = useState(false);
  const [localAlerts, setLocalAlerts] = useState([...alerts]);

  const saveAlerts = async () => {
    setAdding(false);

    console.log(localAlerts);

    return await new Promise((res) =>
      invoke("save_alerts", {
        alertItems: [...localAlerts],
      })
        .then((e) => {
          if (e === "Saved") {
            setAlerts([...localAlerts]);
            res(true);
          } else {
            res(false);
          }
        })
        .catch((err) => {
          res(false);
        })
    );
  };

  function deleteObjectFromArray(
    arr: any[],
    value1ToDelete: string,
    value2ToDelete: string
  ): any[] {
    return arr.filter(
      (obj) =>
        obj.device_key !== value1ToDelete || obj.data_point !== value2ToDelete
    );
  }

  const deleteLocalAlert = (deviceKey: string, dataPoint: string) => {
    const updatedArray = deleteObjectFromArray(
      localAlerts,
      deviceKey,
      dataPoint
    );
    setLocalAlerts(updatedArray);
  };

  const getDevices = () => {
    invoke("get_devices")
      .then((e: any) => {
        setDevices(JSON.parse(e));
      })
      .catch((err) => console.log(err));
  };

  const getDatapoints = () => {
    // find device with that key
    const targetDevice = devices.filter((e) => e.key === device);

    if (targetDevice.length > 0) {
      invoke("get_device", {
        deviceId: targetDevice[0].id,
      })
        .then((e: any) => {
          setDatapoints(JSON.parse(e).dataPoint);
        })
        .catch((err) => console.log(err));
    }
  };

  useEffect(() => {
    getDevices();
  }, []);

  useEffect(() => {
    if (device === "") {
      setDatapoints([]);
    } else {
      getDatapoints();
    }
  }, [device]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      onCloseComplete={() => setLocalAlerts(alerts)}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          Manage meldingen
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          {localAlerts.length > 0 ? (
            <>
              <Text>{localAlerts.length} meldingen geconfigureerd</Text>
              {localAlerts.map((alert, key) => {
                return (
                  <Flex
                    width={"100%"}
                    borderTop="solid 1px gray"
                    key={key}
                    alignItems={"center"}
                  >
                    <Box width={"100%"}>
                      <Flex>
                        <Text>Device:</Text>
                        <Text ml="auto">{alert.device_key}</Text>
                      </Flex>
                      <Flex>
                        <Text>Datapoint:</Text>
                        <Text ml="auto">{alert.data_point}</Text>
                      </Flex>
                      <Flex>
                        <Text>Required to accepts:</Text>
                        <Text ml="auto">
                          {alert.require_accept ? alert.require_accept : "True"}
                        </Text>
                      </Flex>
                    </Box>
                    <IconButton
                      aria-label="Delete alert"
                      icon={<BiTrash />}
                      colorScheme="red"
                      ml="1"
                      size={"sm"}
                      onClick={() => {
                        deleteLocalAlert(alert.device_key, alert.data_point);
                      }}
                    />
                  </Flex>
                );
              })}
            </>
          ) : (
            <Text>Nog geen meldingen aangemaakt.</Text>
          )}

          {adding ? (
            <>
              <Box mt={[-2, 0, 2]}>
                <FormControl>
                  <FormLabel fontSize={["sm", "md", "lg"]}>
                    Select device
                  </FormLabel>

                  <Select
                    size={buttonSize}
                    ml="auto"
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                  >
                    <option value={""}>Select device</option>
                    {devices.map((e, key) => (
                      <option value={e.key} key={key}>
                        {e.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              {device === "" ? null : (
                <Box mt={[-2, 0, 2]}>
                  <FormControl>
                    <FormLabel fontSize={["sm", "md", "lg"]}>
                      Select dataPoint
                    </FormLabel>

                    <Select
                      size={buttonSize}
                      ml="auto"
                      value={datapoint}
                      onChange={(e) => setDatapoint(e.target.value)}
                    >
                      <option value={""}>Select datapoint</option>
                      {datapoints.map((e, key) => (
                        <option value={e.key} key={key}>
                          {e.key}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
              {datapoint === "" ? null : (
                <Box mt={[-2, 0, 2]}>
                  <FormControl>
                    <FormLabel fontSize={["sm", "md", "lg"]}>
                      Acception required?
                    </FormLabel>

                    <RadioGroup
                      onChange={(e) => setAcceptAlert(e)}
                      value={acceptAlert}
                      size={buttonSize}
                      ml="auto"
                    >
                      <Stack direction="row">
                        <Radio value="Yes">Yes</Radio>
                        <Radio value="No">No</Radio>
                      </Stack>
                    </RadioGroup>
                  </FormControl>
                </Box>
              )}
              <Flex mt={2}>
                <Button
                  colorScheme="twitter"
                  onClick={() => {
                    if (device !== "" && datapoint !== "") {
                      setLocalAlerts((e) => [
                        ...e,
                        {
                          device_key: device,
                          data_point: datapoint,
                          require_accept: acceptAlert,
                        },
                      ]);

                      setAdding(false);
                      setDevice("");
                      setDatapoint("");
                      setAcceptAlert("Yes");
                    }
                  }}
                  size={"sm"}
                >
                  Add
                </Button>
              </Flex>
            </>
          ) : (
            <IconButton
              aria-label="Add alert"
              icon={<GrAdd />}
              mt={2}
              onClick={() => setAdding(true)}
            />
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme={"twitter"}
            mr={3}
            size={buttonSize}
            onClick={async () => {
              const save = await saveAlerts();
              if (save) {
                toast({
                  title: "Your credentials are saved succesfully",
                  status: "success",
                });

                onClose();
                return;
              }
              toast({
                title: "Something went wrong. Try again later",
                status: "error",
              });
            }}
          >
            Update
          </Button>

          <Button
            colorScheme="gray"
            onClick={() => {
              onClose();
              setAdding(false);
              setDevice("");
              setDatapoint("");
              setLocalAlerts([]);
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
export default ManageAlertsModal;
