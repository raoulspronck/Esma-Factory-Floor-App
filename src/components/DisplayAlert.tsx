import { Text, Flex } from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";

interface DisplayAlertProps {
  alert: any;
  alertSplit: any;
  setDisplayActiveAlerts: (value: React.SetStateAction<any[]>) => void;
  activeAlerts: React.MutableRefObject<any[]>;
  onClose: () => void;
}

const DisplayAlert: React.FC<DisplayAlertProps> = ({
  alert,
  alertSplit,
  activeAlerts,
  onClose,
  setDisplayActiveAlerts,
}) => {
  const [count, setCount] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((e) => e - 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (count < 1) {
      let array = [...activeAlerts.current];
      console.log(array);
      console.log(alert);
      array = array.filter((e) => e !== alert);
      console.log(array);
      setDisplayActiveAlerts(array);
      activeAlerts.current = array;

      if (array.length === 0) {
        onClose();
      }
    }
  }, [count]);

  return (
    <Flex
      alignItems={"center"}
      borderBottom={"2px"}
      borderTop={"2px"}
      paddingTop={"5px"}
      paddingBottom={"5px"}
      marginTop={"-2px"}
    >
      <Text marginRight={"20px"}>{alertSplit[1]}</Text>

      <Text
        colorScheme="green"
        fontSize={"50px"}
        marginLeft={"auto"}
      >{`(${count})`}</Text>
    </Flex>
  );
};

export default DisplayAlert;
