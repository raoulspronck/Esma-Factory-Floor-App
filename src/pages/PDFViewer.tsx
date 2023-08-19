import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import React, { useEffect, useRef, useState } from "react";
import {
  AiOutlineRotateRight,
  AiOutlineZoomIn,
  AiOutlineZoomOut,
} from "react-icons/ai";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { FaPlay, FaStop } from "react-icons/fa";
import { FiExternalLink } from "react-icons/fi";
import { Document, Page } from "react-pdf/dist/esm/entry.webpack";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

const orders = [
  {
    number: 1,
    order: "Po45.000034",
  },
  {
    number: 2,
    order: "Po45.000024",
  },
  {
    number: 3,
    order: "Po45.000019",
  },
  {
    number: 4,
    order: "Po45.000093",
  },
  {
    number: 5,
    order: "Po45.000092",
  },
];

const PDFViewer: React.FC = () => {
  const functionCalled = useRef(false);

  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);

  const filePath = "C:/Users/Gebruiker/Documents/Po20.00645.pdf";

  //const [loading, setLoading] = useState(false);

  const [pdfResponse, setPdfResponse] = useState(null);

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess(e: any) {
    //setLoading(false);
    setNumPages(e.numPages);
  }

  useEffect(() => {
    const assetUrl = convertFileSrc(filePath);
    setPdfResponse(assetUrl);
  }, []);

  /* useEffect(() => {
    if (!functionCalled.current) {
      invoke("get_debiteuren", { productieOrder: "" })
        .then((e) => console.log(e))
        .catch((err) => console.log(err));
      functionCalled.current = true;
    }
  }, []); */

  return (
    <Flex>
      <Box height="100vh" width={"330px"} borderRight="1px solid black" p={3}>
        <Flex justifyContent={"center"} height="40px">
          <Text fontSize={"20px"}>Order volgorde</Text>
        </Flex>
        {orders.map((e, key) => {
          return (
            <Flex
              width="100%"
              borderBottom={"solid 1px black"}
              height={e.number === 1 ? "70px" : "50px"}
              alignItems="center"
              key={key}
            >
              <Text
                fontSize={e.number === 1 ? "26px" : "22px"}
                fontWeight="medium"
                ml={2}
              >
                {e.number}
              </Text>
              <Flex ml="auto" width={"fit-content"} mr={1} alignItems="center">
                <Text
                  mr={2}
                  fontSize={e.number === 1 ? "24px" : "20px"}
                  fontWeight={e.number === 1 ? "medium" : "light"}
                >
                  {e.order}
                </Text>

                <IconButton
                  icon={<FiExternalLink />}
                  aria-label="view order"
                  size={"md"}
                  //onClick={onOpenProductieOrderModal}
                  className="notdraggable"
                  mr={2}
                  ml={2}
                  colorScheme="blackAlpha"
                />

                {e.number === 1 ? (
                  <IconButton
                    icon={<FaStop />}
                    aria-label="view order"
                    size={"md"}
                    //onClick={onOpenFinishOrder}
                    className="notdraggable"
                    colorScheme={"red"}
                  />
                ) : (
                  <IconButton
                    icon={<FaPlay />}
                    aria-label="view order"
                    size={"md"}
                    //onClick={onOpenProductieOrderModal}
                    className="notdraggable"
                    colorScheme={"green"}
                  />
                )}
              </Flex>
            </Flex>
          );
        })}
      </Box>
      <Box height="100vh" width={"500px"} borderRight="1px solid black" p={3}>
        <Flex justifyContent={"center"} height="40px">
          <Text fontSize={"20px"}>Po45.000034</Text>
        </Flex>

        <Flex borderBottom={"1px solid gray"}>
          <Text fontWeight={"medium"}>Prod. aantal:</Text>
          <Text ml={"auto"}>50.00</Text>
        </Flex>

        <Flex borderBottom={"1px solid gray"}>
          <Text fontWeight={"medium"}>Artikelnummer:</Text>
          <Text ml={"auto"}>MAY_11DC0P0010</Text>
        </Flex>

        <Flex borderBottom={"1px solid gray"} flexDir="column">
          <Text fontWeight={"medium"}>Omschrijving:</Text>
          <Text textAlign={"right"}>
            Vlotterschakelaar, LCD250-eco, level control device LDC250-eco
            zonder
          </Text>
        </Flex>

        <Flex borderBottom={"1px solid gray"}>
          <Text fontWeight={"medium"}>Leverdatum:</Text>
          <Text ml={"auto"}>12-06-2020</Text>
        </Flex>

        <Flex borderBottom={"1px solid gray"}>
          <Text fontWeight={"medium"}>Ordernummer:</Text>
          <Text ml={"auto"}>021001</Text>
        </Flex>

        <Flex borderBottom={"1px solid gray"}>
          <Text fontWeight={"medium"}>Order aantal:</Text>
          <Text ml={"auto"}>50.00</Text>
        </Flex>

        <Flex borderBottom={"1px solid gray"}>
          <Text fontWeight={"medium"}>Vooraad:</Text>
          <Text ml={"auto"}>-</Text>
        </Flex>

        <Flex borderBottom={"1px solid gray"}>
          <Text fontWeight={"medium"}>Eenheid:</Text>
          <Text ml={"auto"}>st</Text>
        </Flex>

        <Flex borderBottom={"1px solid gray"}>
          <Text fontWeight={"medium"}>Magazijn locatie:</Text>
          <Text ml={"auto"}>l3H00A</Text>
        </Flex>

        <Flex borderBottom={"1px solid gray"}>
          <Text fontWeight={"medium"}>Verpakaantal:</Text>
          <Text ml={"auto"}>1.000</Text>
        </Flex>
      </Box>
      <Flex justifyContent={"center"} maxW={"700px"} width="100%" ml="auto">
        <Flex alignItems={"center"} flexDir="column" width={"100%"} mt={2}>
          <Flex alignItems={"center"} mt={2} width="100%">
            <IconButton
              visibility={pageNumber === 1 ? "hidden" : "visible"}
              icon={<BsChevronLeft />}
              aria-label={"Page back"}
              colorScheme="blackAlpha"
              onClick={() => {
                setPageNumber((e) => e - 1);
              }}
              size="lg"
            />
            <Text ml={2} mr={2}>
              Page {pageNumber} of {numPages}
            </Text>
            <IconButton
              visibility={pageNumber === numPages ? "hidden" : "visible"}
              icon={<BsChevronRight />}
              aria-label={"Page forward"}
              colorScheme="blackAlpha"
              onClick={() => {
                setPageNumber((e) => e + 1);
              }}
              size="lg"
            />

            <Flex ml="auto">
              <IconButton
                //visibility={pageNumber == numPages ? "hidden" : "visible"}
                icon={<AiOutlineRotateRight />}
                aria-label={"Rotate"}
                colorScheme="blackAlpha"
                onClick={() => {
                  setRotate((e) => (e === 270 ? 0 : e + 90));
                }}
                fontSize={"20px"}
                size="lg"
              />
              <IconButton
                //visibility={pageNumber == numPages ? "hidden" : "visible"}
                icon={<AiOutlineZoomOut />}
                aria-label={"Zoom 0ut"}
                colorScheme="blackAlpha"
                onClick={() => {
                  setScale((e) => e - 0.1);
                }}
                ml={3}
                fontSize={"20px"}
                size="lg"
              />

              <IconButton
                //visibility={pageNumber == numPages ? "hidden" : "visible"}
                icon={<AiOutlineZoomIn />}
                aria-label={"Zoom in"}
                colorScheme="blackAlpha"
                onClick={() => {
                  setScale((e) => e + 0.1);
                }}
                ml={3}
                fontSize={"20px"}
                size="lg"
              />
            </Flex>
          </Flex>
          <Flex
            width={"100%"}
            maxW="100%"
            transform={"rotateX(180deg)"}
            overflowX="auto"
            justifyContent={"center"}
            mt={2}
            maxHeight="calc(100vh - 110px)"
          >
            <Box
              transform={"rotateX(180deg)"}
              height="fit-content"
              width={"fit-content"}
            >
              <Document
                file={pdfResponse}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(e) => console.log(e)}
                options={{
                  workerSrc: "/pdf.worker.js",
                  cMapUrl: "cmaps/",
                  cMapPacked: true,
                  standardFontDataUrl: "standard_fonts/",
                }}
              >
                <Page pageNumber={pageNumber} scale={scale} rotate={rotate} />
              </Document>
            </Box>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default PDFViewer;
