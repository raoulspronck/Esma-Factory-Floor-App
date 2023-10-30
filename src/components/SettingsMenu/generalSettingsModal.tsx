import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React from "react";

interface GeneralSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;

  gestureControl: string;
  setGestureControl: React.Dispatch<React.SetStateAction<string>>;

  automaticLoadDashboard: string;
  setAutomaticLoadDashboard: React.Dispatch<React.SetStateAction<string>>;
}

const GeneralSettingsModal: React.FC<GeneralSettingsModalProps> = ({
  isOpen,
  onClose,
  automaticLoadDashboard,
  gestureControl,
  setAutomaticLoadDashboard,
  setGestureControl,
}) => {
  const modalSize = useBreakpointValue(["xs", "sm", "lg"]);
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);

  const [show, setShow] = React.useState(false);
  const handleClick = () => setShow(!show);

  const toast = useToast();

  const saveSettings = async () => {
    try {
      return await new Promise((res) =>
        invoke("save_basic_settings", {
          gesture: gestureControl,
          dashboard: automaticLoadDashboard,
        })
          .then((_e) => res(true))
          .catch((_e) => {
            res(false);
          })
      );
    } catch (error) {
      return false;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
          Exalise mqtt settings
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          <Box mt={[-2, 0, 2]}>
            <FormControl>
              <Checkbox
                isChecked={gestureControl === "True" ? true : false}
                onChange={(e) =>
                  setGestureControl(
                    e.target.checked === true ? "True" : "False"
                  )
                }
              >
                Gesture control
              </Checkbox>
            </FormControl>
          </Box>

          <Box mt={3}>
            <FormControl>
              <Checkbox
                isChecked={automaticLoadDashboard === "True" ? true : false}
                onChange={(e) =>
                  setAutomaticLoadDashboard(
                    e.target.checked === true ? "True" : "False"
                  )
                }
              >
                Automatically load default dashboard
              </Checkbox>
            </FormControl>
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button
            colorScheme={"twitter"}
            mr={3}
            size={buttonSize}
            onClick={async () => {
              const save = await saveSettings();
              if (save) {
                toast({
                  title: "Your basic settings are saved.",
                  status: "success",
                });

                if (!toast.isActive("reload-toast")) {
                  toast({
                    id: "reload-toast",
                    title:
                      "Sluit en herstart deze app om de verandering in werking te zetten",
                    status: "warning",
                    duration: null,
                    isClosable: false,
                  });
                }

                onClose();
                return;
              }
              toast({
                title: "Something went wrong. Try again later",
                status: "error",
              });
            }}
          >
            Save
          </Button>

          <Button colorScheme="gray" onClick={onClose} size={buttonSize}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GeneralSettingsModal;
