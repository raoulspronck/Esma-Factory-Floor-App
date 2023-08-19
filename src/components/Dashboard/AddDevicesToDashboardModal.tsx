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
  Checkbox,
  CheckboxGroup,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React, { useEffect, useState } from "react";

interface AddDevicesToDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;

  dashboard: {
    layout: {
      i: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }[];
    devices: any[];
  };
  setDashboard: React.Dispatch<
    React.SetStateAction<{
      layout: {
        i: string;
        x: number;
        y: number;
        w: number;
        h: number;
      }[];
      devices: any[];
    }>
  >;
}

const AddDevicesToDashboardModal: React.FC<AddDevicesToDashboardModalProps> = ({
  isOpen,
  onClose,
  dashboard,
  setDashboard,
}) => {
  const toast = useToast();
  const [devicesToBeAdded, setDevicesToBeAdded] = useState([]);
  const [loading, setLoading] = useState(false);
  const [devicesNotVisible, setDevicesNotVisible] = useState([]);

  const showDevice = async () => {
    setLoading(true);

    const newDevices = dashboard.devices.map((e) => {
      if (devicesToBeAdded.includes(e.id)) {
        return {
          id: e.id,
          name: e.name,
          key: e.key,
          display: true,
          widgets: e.widgets,
        };
      }

      return e;
    });

    const newDashboard = {
      layout: dashboard.layout,
      devices: newDevices,
    };

    return new Promise((res) =>
      invoke("save_dashboard_layout", {
        dashboard: newDashboard,
      })
        .then((i) => {
          if (i == "saved") {
            setDashboard(newDashboard);
            res(true);
          }
          setLoading(false);
          res(false);
        })
        .catch((e) => {
          console.log(e);
          setLoading(false);
          res(true);
        })
    );
  };

  useEffect(() => {
    setDevicesNotVisible(dashboard.devices.filter((e) => e.display === false));
  }, [dashboard.devices]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"lg"}>
      <ModalOverlay />
      <ModalContent bgColor={"gray.900"} color="white">
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          Voeg apparaten toe aan uw dashboard
        </ModalHeader>
        <ModalCloseButton size={"lg"} />
        <ModalBody>
          <CheckboxGroup
            colorScheme="blue"
            defaultValue={devicesToBeAdded}
            onChange={(e: string[]) => setDevicesToBeAdded(e)}
          >
            {devicesNotVisible.length > 0 ? (
              devicesNotVisible.map((e, key) => (
                <Checkbox value={e.id} key={key}>
                  <Text fontSize={"35px"}>{e.name}</Text>
                </Checkbox>
              ))
            ) : (
              <Text>Alle apparaten zijn zichtbaar op uw dashboard</Text>
            )}
          </CheckboxGroup>
        </ModalBody>
        <ModalFooter>
          {devicesToBeAdded.length > 0 ? (
            <Button
              colorScheme={"twitter"}
              mr={3}
              size={"lg"}
              isLoading={loading}
              onClick={async () => {
                const save = await showDevice();
                if (save) {
                  toast({
                    title: "Apparaten succesvol toegevoegd",
                    status: "success",
                  });

                  onClose();
                  return;
                }
                toast({
                  title: "Er is iets misgegaan, probeer later opnieuw",
                  status: "error",
                });
              }}
            >
              Toevoegen
            </Button>
          ) : null}

          <Button colorScheme="blackAlpha" onClick={onClose} size={"lg"}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddDevicesToDashboardModal;
