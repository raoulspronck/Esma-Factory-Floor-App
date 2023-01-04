import React from "react";

interface ProcessingScreenProps {}

const ProcessingScreen: React.FC<ProcessingScreenProps> = ({}) => {
  return <></>;
};

export default ProcessingScreen;

/*
<Flex flexDir={"column"}>
          <Flex>
            <Text>Proces: </Text>
            <Text> Op maat zagen</Text>
          </Flex>

          <Flex>
            <Text>Tijd bezig: </Text>
            <Text>01d:05h:23m:15s</Text>
          </Flex>

          <Flex>
            <Text>Order: </Text>
            <Text>Po19.01003</Text>
          </Flex>

          <Flex>
            <Text>Aantal gemaakt: </Text>
            <Text>95.00</Text>
          </Flex>

          <Flex>
            <Text>Te maken: </Text>
            <Text>176.00</Text>
          </Flex>

          <Flex>
            <Button leftIcon={<Box className="key__button">P</Box>}>
              Pauze
            </Button>
            <Button leftIcon={<Box className="key__button">S</Box>}>
              Stop
            </Button>
          </Flex>
        </Flex>
        */
