import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Text,
  Button,
  Flex,
  Heading,
  SimpleGrid,
  Image,
} from "@chakra-ui/react";
import React, { useState } from "react";

interface SpindleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SpindleModal: React.FC<SpindleModalProps> = ({ isOpen, onClose }) => {
  const [vraagIndex, setVraagIndex] = useState(0);
  const [vraagIndex2, setVraagIndex2] = useState(0);

  // eslint-disable-next-line  no-unused-vars
  const [vragen, setVragen] = useState([
    {
      id: 0,
      vraag: "Wat is de spindel type?",
      antwoorden: [
        { titel: "Frees", vraag: 1, id: undefined },
        { titel: "Boor", vraag: 2, id: undefined },
      ],
      prevVraag: 0,
    },
    {
      id: 1,
      vraag: "Wat is de frees diameter?",
      prevVraag: 0,
      antwoorden: [
        { titel: "2mm", vraag: 1, id: 476 },
        { titel: "4mm", vraag: 1, id: 476 },
        { titel: "6mm", vraag: 1, id: 476 },
      ],
    },
    {
      id: 2,
      vraag: "Wat is de boor diameter?",
      prevVraag: 0,
      antwoorden: [
        { titel: "5mm", vraag: 2, id: 476 },
        { titel: "7mm", vraag: 2, id: 476 },
        { titel: "9mm", vraag: 2, id: 476 },
      ],
    },
  ]);
  const [spindleID, setSpindleID] = useState(undefined);

  // eslint-disable-next-line  no-unused-vars
  const [spindles, setSpindles] = useState([
    {
      id: 476,
      foto: "476.png",
      title: "Frees 6mm",
      merk: "MerkX",
      MaxRpm: "6000",
      MaxPower: "300W",
    },
  ]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"3xl"}>
      <ModalOverlay />
      <ModalContent bgColor={"gray.900"} color="white">
        <ModalCloseButton size={"lg"} />

        {spindleID === undefined ? (
          <>
            <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
              Spindel tool identificatie: Vraag {vraagIndex2 + 1}
            </ModalHeader>
            <ModalBody>
              <Heading>{vragen[vraagIndex].vraag}</Heading>

              <SimpleGrid columns={2} spacing={10} mt={5}>
                {vragen[vraagIndex].antwoorden.map((e, key) => {
                  return (
                    <Flex
                      cursor={"pointer"}
                      key={key}
                      bg="twitter.400"
                      height="80px"
                      justifyContent={"center"}
                      alignItems="center"
                      fontSize={"30px"}
                      onClick={() => {
                        setVraagIndex2((e) => e + 1);
                        setVraagIndex(e.vraag);
                        setSpindleID(e.id);
                      }}
                    >
                      {e.titel}
                    </Flex>
                  );
                })}
              </SimpleGrid>
            </ModalBody>
            <ModalFooter>
              {vraagIndex2 === 0 ? null : (
                <Button
                  colorScheme={"whiteAlpha"}
                  onClick={() => {
                    setVraagIndex2((e) => e - 1);
                    setVraagIndex(vragen[vraagIndex].prevVraag);
                  }}
                  mr={2}
                >
                  Back
                </Button>
              )}

              <Button
                colorScheme={"whiteAlpha"}
                onClick={() => {
                  setVraagIndex2(0);
                  setVraagIndex(0);
                  setSpindleID(undefined);
                }}
              >
                Reset
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalBody>
              <Heading>
                {spindles.filter((e) => e.id === spindleID)[0].title}
              </Heading>

              <Flex mt={3}>
                <Image
                  src={`/tools/${
                    spindles.filter((e) => e.id === spindleID)[0].foto
                  }`}
                  mr={2}
                />
                <Flex flexDir={"column"} ml={2}>
                  <Flex alignItems={"center"}>
                    <Text fontSize={"20px"} mr={3}>
                      Merk:
                    </Text>
                    <Text fontSize={"24px"}>
                      {spindles.filter((e) => e.id === spindleID)[0].merk}
                    </Text>
                  </Flex>

                  <Flex alignItems={"center"}>
                    <Text fontSize={"20px"} mr={3}>
                      Max rpm:
                    </Text>
                    <Text fontSize={"24px"}>
                      {spindles.filter((e) => e.id === spindleID)[0].MaxRpm}
                    </Text>
                  </Flex>
                  <Flex alignItems={"center"}>
                    <Text fontSize={"20px"} mr={3}>
                      Max power:
                    </Text>
                    <Text fontSize={"24px"}>
                      {spindles.filter((e) => e.id === spindleID)[0].MaxPower}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </ModalBody>
            <ModalFooter>
              {vraagIndex2 === 0 ? null : (
                <Button
                  colorScheme={"whiteAlpha"}
                  onClick={() => {
                    setVraagIndex2((e) => e - 1);
                    setSpindleID(undefined);
                  }}
                  mr={2}
                >
                  Back
                </Button>
              )}
              <Button
                colorScheme={"whiteAlpha"}
                onClick={() => {
                  setVraagIndex2(0);
                  setVraagIndex(0);
                  setSpindleID(undefined);
                }}
              >
                Reset
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default SpindleModal;
