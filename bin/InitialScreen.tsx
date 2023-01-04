import React from "react";

interface InitialScreenProps {}

const InitialScreen: React.FC<InitialScreenProps> = ({}) => {
  return <></>;
};

export default InitialScreen;

/*
<Hotkeys keyName="q,s" onKeyDown={(e) => handleKeyPressed(e)}>
            <Flex>
              <Button onClick={() => setOrder("")}>Nieuwe order</Button>
              <Box>
                {viewOrder ? (
                  <>
                    <Button
                      colorScheme={"gray"}
                      leftIcon={<Box className="key__button">Q</Box>}
                      rightIcon={<FiChevronDown />}
                      onClick={() => setViewOrder((e) => !e)}
                    >
                      Verstop werkorder
                    </Button>
                    <ViewWerkOrder />
                  </>
                ) : (
                  <Button
                    colorScheme={"gray"}
                    leftIcon={<Box className="key__button">Q</Box>}
                    rightIcon={<FiChevronLeft />}
                    onClick={() => setViewOrder((e) => !e)}
                  >
                    Bekijk werkorder
                  </Button>
                )}
              </Box>

              <Box>
                {startOrder ? (
                  <>
                    <Button
                      colorScheme={"gray"}
                      leftIcon={<Box className="key__button">S</Box>}
                      rightIcon={<FiChevronDown />}
                      onClick={() => setStartOrder((e) => !e)}
                    >
                      Start Process
                    </Button>
                    <StartWerkOrderProces />
                  </>
                ) : (
                  <Button
                    colorScheme={"gray"}
                    leftIcon={<Box className="key__button">S</Box>}
                    rightIcon={<FiChevronLeft />}
                    onClick={() => setStartOrder((e) => !e)}
                  >
                    Start Process
                  </Button>
                )}
              </Box>
            </Flex>
          </Hotkeys>
          */
