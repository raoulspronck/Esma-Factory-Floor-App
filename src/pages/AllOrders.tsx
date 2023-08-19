import { Search2Icon } from "@chakra-ui/icons";
import {
  Box,
  Flex,
  Input,
  Text,
  InputGroup,
  InputLeftElement,
  IconButton,
  SimpleGrid,
  Button,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React, { useEffect, useRef, useState } from "react";
import { GoLinkExternal } from "react-icons/go";
import Keyboard from "react-simple-keyboard";
import "../style.keyboard.css";
import { useComponentVisible } from "../utils/IsComponentVisible";

interface AllOrdersProps {}

const AllOrders: React.FC<AllOrdersProps> = ({}) => {
  const [searchInput, setSearchInput] = useState("");
  const [orders, setOrders] = useState([]);
  const [searchedOrders, setSearchedOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const functionCalled = useRef(false);
  const inputRef = useRef(null);
  const { ref, isComponentVisible, setIsComponentVisible } =
    useComponentVisible(false);
  const keyboard = useRef(null);

  const search = () => {
    if (!loading && orders.length > 0) {
      const sortedArray = orders.filter((order) => {
        if (order.deb_naam.toLowerCase().includes(searchInput.toLowerCase())) {
          return order;
        }
      });

      setSearchedOrders(sortedArray);
    }
  };

  const setInputOfKeyboard = () => {
    if (keyboard.current != null) {
      keyboard.current.setInput(searchInput);
    }
  };

  const loadMoreData = () => {
    invoke("get_debiteuren", { take: 100, skip: 100, productieOrder: "" })
      .then((e: any) => {
        try {
          const tempOrders = [...orders, ...JSON.parse(e)];
          setOrders(tempOrders);
          const sortedArray = tempOrders.filter((order: any) => {
            if (
              order.deb_naam.toLowerCase().includes(searchInput.toLowerCase())
            ) {
              return order;
            }
          });
          setSearchedOrders(sortedArray);
          setLoading(false);
        } catch (error) {
          console.log(error);
          setLoading(false);
        }
      })
      .catch((err) => {
        setLoading(false);
        console.log(err);
      });
  };

  useEffect(() => {
    if (!functionCalled.current) {
      /* invoke("get_debiteuren", { take: 100, skip: 0, productieOrder: "" })
        .then((e: any) => {
          try {
            const tempOrder = JSON.parse(e);
            setOrders(tempOrder);
            const sortedArray = tempOrder.filter((order: any) => {
              if (
                order.deb_naam.toLowerCase().includes(searchInput.toLowerCase())
              ) {
                return order;
              }
            });
            setSearchedOrders(sortedArray);
            setLoading(false);
          } catch (error) {
            console.log(error);
            setLoading(false);
          }
        })
        .catch((err) => {
          setLoading(false);
          console.log(err);
        }); */
      functionCalled.current = true;
    }
  }, []);

  useEffect(() => {
    setInputOfKeyboard();
  }, [searchInput, keyboard.current]);

  useEffect(() => {
    search();
  }, [searchInput]);

  return (
    <Flex flexDir={"column"} width="100%" height="100%" position={"relative"}>
      <Flex justifyContent="center" mt={5}>
        <InputGroup
          width="80vw"
          maxW="700px"
          size={"lg"}
          boxShadow={"5px 5px 5px #f0f0f0, -5px -5px 5px #ffffff"}
          borderRadius="4"
          //onClick={() => setIsComponentVisible(true)}
        >
          <InputLeftElement
            pointerEvents="none"
            children={<Search2Icon color="gray.300" />}
          />
          <Input
            placeholder="Zoek een order"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            ref={inputRef}
          />
        </InputGroup>
        <Button
          colorScheme="twitter"
          ml={2}
          size="lg"
          onClick={() => {
            if (!loading && orders.length > 0) {
              const sortedArray = orders.filter((order) => {
                if (
                  order.deb_naam
                    .toLowerCase()
                    .includes(searchInput.toLowerCase())
                ) {
                  return order;
                }
              });

              setSearchedOrders(sortedArray);
            }
          }}
        >
          Zoek
        </Button>
      </Flex>
      <Box
        width={"100%"}
        ref={ref}
        position="absolute"
        bottom={0}
        visibility={isComponentVisible ? "visible" : "hidden"}
      >
        <Keyboard
          keyboardRef={(e) => (keyboard.current = e)}
          onChange={(e) => setSearchInput(e)}
          //onKeyPress={(e) => setSearchInput((i) => i + e)}
          theme="hg-theme-default"
          onClick={() =>
            inputRef.current != null ? inputRef.current.focus() : null
          }
          onRender={() => {
            setInputOfKeyboard();
          }}
        />
      </Box>

      {loading ? (
        <Text>Loading</Text>
      ) : (
        <Box
          height={"100%"}
          width="100%"
          overflowY={"auto"}
          overflowX="hidden"
          mt={5}
        >
          <SimpleGrid columns={7} spacing={4} ml="4">
            {searchedOrders.map((e, key) => {
              return (
                <Flex
                  borderRadius={5}
                  width="250px"
                  height="70px"
                  bgColor={"white"}
                  alignItems="center"
                  p={2}
                  boxShadow={`2px 2px 10px #c9c9c9,
      -2px -2px 10px #ffffff;`}
                  key={key}
                >
                  <Text fontSize={"16px"}>{e.deb_naam}</Text>
                  <IconButton
                    ml="auto"
                    aria-label="view order"
                    icon={<GoLinkExternal />}
                    colorScheme="twitter"
                    size={"lg"}
                  />
                </Flex>
              );
            })}
          </SimpleGrid>

          <Flex width={"100%"} mt={5} mb={5} justifyContent="center">
            <Button
              size="lg"
              onClick={() => loadMoreData()}
              isLoading={loading}
            >
              Load more
            </Button>
          </Flex>
        </Box>
      )}
    </Flex>
  );
};

export default AllOrders;
