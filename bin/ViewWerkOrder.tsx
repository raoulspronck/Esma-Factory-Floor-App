import {
  Box,
  Button,
  Flex,
  IconButton,
  useColorModeValue,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { Document, Page } from "react-pdf/dist/esm/entry.webpack";
import { AiOutlineZoomIn, AiOutlineZoomOut } from "react-icons/ai";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Hotkeys from "react-hot-keys";

interface ViewWerkOrderProps {}

const ViewWerkOrder: React.FC<ViewWerkOrderProps> = ({}) => {
  const [order, setOrder] = useState("ddd");

  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [pageScale, setPageScale] = useState(1);

  const onDocumentLoadSuccess = useCallback((document: any) => {
    const { numPages: nextNumPages } = document;
    setNumPages(nextNumPages);
    setPageNumber(1);
  }, []);

  const changePage = useCallback(
    (offset: number) =>
      setPageNumber((prevPageNumber: number) =>
        offset < 0
          ? prevPageNumber == 1
            ? prevPageNumber
            : prevPageNumber + offset
          : prevPageNumber + offset
      ),
    []
  );

  const previousPage = useCallback(() => changePage(-1), [changePage]);

  const nextPage = useCallback(() => changePage(1), [changePage]);

  const changeScale = useCallback(
    (offset: number) =>
      setPageScale((prevScale: number) =>
        offset > 0
          ? prevScale > 2
            ? prevScale
            : prevScale + offset
          : prevScale < 0.4
          ? prevScale
          : prevScale + offset
      ),
    []
  );

  const zoomIn = useCallback(() => changeScale(0.1), [changeScale]);

  const zoomOut = useCallback(() => changeScale(-0.1), [changeScale]);

  const handleKeyPressed = (e: string) => {
    switch (e) {
      case "a":
        previousPage();
        break;
      case "d":
        nextPage();
        break;

      case "i":
        zoomIn();
        break;
      case "o":
        zoomOut();
        break;

      default:
        break;
    }
  };

  return (
    <Hotkeys keyName="a,d,i,o" onKeyDown={(e) => handleKeyPressed(e)}>
      <Flex flexDirection={"column"}>
        <Flex>
          <IconButton
            icon={<FiChevronLeft />}
            onClick={previousPage}
            aria-label="Previous page"
          />

          <Flex justifyContent={"center"} alignItems="center">
            {pageNumber}
          </Flex>
          <IconButton
            icon={<FiChevronRight />}
            onClick={nextPage}
            aria-label="Next page"
          />

          <IconButton
            icon={<AiOutlineZoomOut />}
            onClick={zoomOut}
            aria-label="Zoom-out"
          />
          <IconButton
            icon={<AiOutlineZoomIn />}
            onClick={zoomIn}
            aria-label="Zoom-in"
          />
        </Flex>
        <Box
          height={"70vh"}
          width="calc(100vw - 100px)"
          //width={"calc(100vw-200px)"}
          maxH={"70vh"}
          overflow={"auto"}
          border="1px"
          borderColor={"gray.400"}
        >
          {/* <Document
  file={order}
  options={{
    workerSrc: "/pdf.worker.js",
    cMapUrl: "cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "standard_fonts/",
  }}
  onLoadSuccess={onDocumentLoadSuccess}
>
  <Page pageNumber={pageNumber || 1} scale={pageScale || 1} />
</Document> */}
        </Box>
      </Flex>
    </Hotkeys>
  );
};

export default ViewWerkOrder;
