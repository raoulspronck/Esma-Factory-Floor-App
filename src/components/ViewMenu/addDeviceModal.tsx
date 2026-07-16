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
  Text,
  Select,
  ModalFooter,
  Button,
  Flex,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React, { useEffect, useState } from "react";
import { getDevices as fetchDevicesFromApi } from "../../api/devices";
import { MAX_DEVICES } from "../../utils/gridPacking";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  setDashboard: React.Dispatch<React.SetStateAction<{ devices: any[] }>>;
  dashboard: {
    devices: any[];
  };
}

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  isOpen,
  onClose,
  setDashboard,
  dashboard,
}) => {
  const modalSize = useBreakpointValue(["xs", "sm", "md"]);
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);
  const toast = useToast();
  const [devices, setDevices] = useState<any[]>([]);
  const [device, setDevice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadDevices = () => {
    setLoading(true);
    setError("");
    fetchDevicesFromApi()
      .then((list) => {
        setDevices(list as any[]);
        setLoading(false);
      })
      .catch((err) => {
        // err is the backend's error string (e.g. "API error 404:
        // UNAUTHENTICATED" or "HTTP error: ... timed out") — show it instead
        // of spinning forever like the old swallowed-catch version did.
        console.error(err);
        setDevices([]);
        setError(typeof err === "string" ? err : String(err));
        setLoading(false);
      });
  };

  // Fresh fetch on every open: the list is small, and reusing a stale (or
  // never-loaded) list was how the modal used to get stuck empty.
  useEffect(() => {
    if (isOpen) loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    setDevice("");
    setError("");
    onClose();
  };

  // Resolves to "" on success, or the backend's error message on failure
  // (e.g. "Dashboard is full (max 5 devices)").
  const saveSettings = async (deviceSelected: any): Promise<string> => {
    return await new Promise((res) =>
      invoke("save_device_to_dashboard", {
        device: {
          id: deviceSelected.id,
          name: deviceSelected.name,
          key: deviceSelected.key,
          widgets: [],
        },
      })
        .then((e) => {
          setDashboard(e as any);
          res("");
        })
        .catch((err) => {
          console.log(err);
          res(typeof err === "string" ? err : "Something went wrong. Try again later");
        })
    );
  };

  const selectableDevices = devices.filter(
    (i) => !dashboard.devices.map((e) => e.id).includes(i.id)
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          Add device to dashboard
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          {dashboard.devices.length >= MAX_DEVICES ? (
            <Text color="orange.400" fontWeight="medium">
              Dashboard is full (max {MAX_DEVICES} devices). Remove a device
              first to add another one.
            </Text>
          ) : loading ? (
            <Text>Loading devices...</Text>
          ) : error !== "" ? (
            <Flex flexDir="column" gap={3} alignItems="flex-start">
              <Text color="red.500" fontWeight="medium">
                Could not load devices
              </Text>
              <Text fontSize="sm" color="gray.500">
                {error}
              </Text>
              <Button size={buttonSize} colorScheme="twitter" onClick={loadDevices}>
                Retry
              </Button>
            </Flex>
          ) : (
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
                  <option value={""}>Select a device or device group</option>
                  {selectableDevices.map((y, key) => (
                    <option value={y.id} key={key}>
                      {y.name}
                    </option>
                  ))}
                </Select>
                {selectableDevices.length === 0 ? (
                  <Text mt={2} fontSize="sm" color="gray.500">
                    All devices are already on your dashboard.
                  </Text>
                ) : null}
              </FormControl>
            </Box>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme={"twitter"}
            mr={3}
            size={buttonSize}
            isDisabled={
              device === "" ||
              loading ||
              error !== "" ||
              dashboard.devices.length >= MAX_DEVICES
            }
            isLoading={saving}
            onClick={async () => {
              const deviceSelected = devices.find((e) => e.id === device);
              if (!deviceSelected) return;

              setSaving(true);
              const saveError = await saveSettings(deviceSelected);
              setSaving(false);
              if (saveError === "") {
                toast({
                  title: "Apparaat toegevoegd aan het dashboard",
                  status: "success",
                });

                handleClose();
                return;
              }
              toast({
                title: "Kon apparaat niet toevoegen",
                description: saveError,
                status: "error",
              });
            }}
          >
            Add
          </Button>

          <Button colorScheme="gray" onClick={handleClose} size={buttonSize}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
export default AddDeviceModal;
