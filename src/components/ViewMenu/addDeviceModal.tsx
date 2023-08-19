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
  Button,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React, { useEffect, useState } from "react";
interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  setDashboard: React.Dispatch<
    React.SetStateAction<{
      layout: {
        i: string;
        x: number;
        y: number;
        w: number;
        h: number;
        static: boolean;
      }[];
      devices: any[];
    }>
  >;
  dashboard: {
    layout: any[];
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
  const [devices, setDevices] = useState([]);
  const [device, setDevice] = useState("");

  const saveSettings = async (deviceSelected: any) => {
    return await new Promise((res) =>
      invoke("save_device_to_dashboard", {
        device: {
          id: deviceSelected.id,
          name: deviceSelected.name,
          key: deviceSelected.key,
          display: true,
          widgets: [],
        },
      })
        .then((e) => {
          console.log(e);
          setDashboard(e as any);
          res(true);
        })
        .catch((err) => {
          console.log(err);
          res(false);
        })
    );
  };

  const getDevices = () => {
    invoke("get_devices")
      .then((e: any) => {
        setDevices(JSON.parse(e));
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    getDevices();
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          Add device to dashboard
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          <Box mt={[-2, 0, 2]}>
            <FormControl>
              <FormLabel fontSize={["sm", "md", "lg"]}>Select device</FormLabel>

              <Select
                size={buttonSize}
                ml="auto"
                value={device}
                onChange={(e) => setDevice(e.target.value)}
              >
                {devices
                  .filter(
                    (i) => !dashboard.devices.map((e) => e.id).includes(i.id)
                  )
                  .map((y, key) => (
                    <option value={y.id} key={key}>
                      {y.name}
                    </option>
                  ))}
              </Select>
            </FormControl>
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme={"twitter"}
            mr={3}
            size={buttonSize}
            onClick={async () => {
              const deviceSelected = devices.filter(
                (e) => e.id === device
              )[0] as any;

              // check if device is not already made
              if (
                dashboard.devices.map((e) => e.id).includes(deviceSelected.id)
              ) {
                toast({
                  title: "Apparaat is al aangemaakt.",
                  description:
                    "Als u het apparaat niet ziet. Klik links onder om te zien of u het apparaat niet heeft verborgen.",
                  status: "error",
                });
                return;
              }

              const save = await saveSettings(deviceSelected);
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
            Add
          </Button>

          <Button colorScheme="gray" onClick={onClose} size={buttonSize}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
export default AddDeviceModal;
