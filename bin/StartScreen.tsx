import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import { Form, Formik } from "formik";
import React from "react";
import useWindowSize from "../utils/useWindowSize";
import DarkModeSwitch from "./DarkModeSwitch";
import InputField from "./form/InputField";

interface StartScreenProps {
  setOrder: React.Dispatch<React.SetStateAction<string>>;
}

const StartScreen: React.FC<StartScreenProps> = ({ setOrder }) => {
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);
  const textColor = useColorModeValue("gray.700", "white");
  const textColor2 = useColorModeValue("gray.500", "gray.100");

  const bg = useColorModeValue("white", "gray.700");
  const boxShadow = useColorModeValue(
    `50px 50px 100px #d9d9d9,
      -50px -50px 100px #ffffff`,
    `50px 50px 100px #202834,
      -50px -50px 100px #252d3b`
  );
  const { width } = useWindowSize();

  const logoSize = () => {
    if (width < 700) {
      return "40";
    }

    if (width < 1017) {
      return "50";
    }

    return "60";
  };

  return (
    <Box
      backgroundColor={bg}
      borderRadius="20px"
      padding={["30px", "40px", "50px"]}
      boxShadow={boxShadow}
      width={["80vw", "60vw", "500px"]}
    >
      <Formik
        initialValues={{
          werkorder: "",
        }}
        onSubmit={async (values, { setErrors, setValues }) => {
          /* invoke("request_werk_order", {
        order: values.werkorder,
      }); */

          fetch(`https://werkorderrequest./?n=${values.werkorder}`, {
            method: "GET",
          }).then((response) => {
            if (response.status == 200) {
              response.blob().then((blob) => {
                const url = window.URL.createObjectURL(new Blob([blob]));
                setOrder(url);
              });
            } else {
              setErrors({ werkorder: "Kan werkorder niet vinden" });
            }
          });
        }}
      >
        {({ isSubmitting }) => (
          <Form style={{ width: "100%" }}>
            <Flex>
              <Flex
                alignItems={"center"}
                cursor="default"
                height={"fit-content"}
              >
                <Box boxSize={["30px", "40px", "50px"]} mb={1} mr={1}>
                  <svg
                    version="1.2"
                    baseProfile="tiny-ps"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 2000 2000"
                    width={logoSize()}
                    height={logoSize()}
                  >
                    <title>Logo Exelise</title>
                    <defs>
                      <image
                        width="1190"
                        height="1326"
                        id="img1"
                        href="data:image/png;base64,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"
                      />
                    </defs>
                    <path
                      id="Background"
                      className="shp0"
                      d="M1000 2000C447 2000 0 1553 0 1000C0 447 447 0 1000 0C1553 0 2000 447 2000 1000C2000 1553 1553 2000 1000 2000Z"
                    />
                    <use id="Background copy" href="#img1" x="0" y="0" />
                    <path id="Shape 5" className="shp1" d="M1534 1548" />
                    <path
                      id="Shape 5"
                      className="shp2"
                      d="M1044 386C1044 386 1682 377.78 1826 1034"
                    />
                    <path
                      id="Shape 5"
                      className="shp2"
                      d="M1048 614C1048 614 1473.07 642.48 1602 1104"
                    />
                    <path
                      id="Shape 4"
                      className="shp3"
                      d="M339 1075C297.53 1075 264 1041.48 264 1000C264 958.53 297.53 925 339 925C380.47 925 414 958.53 414 1000C414 1041.48 380.47 1075 339 1075Z"
                    />
                    <path
                      id="Shape 4"
                      className="shp3"
                      d="M872.97 1219.91L871.03 1224.52L343.03 1002.3L344.97 997.7L872.97 1219.91Z"
                    />
                    <path
                      id="Shape 4"
                      className="shp3"
                      d="M771 516C729.52 516 696 482.48 696 441C696 399.52 729.52 366 771 366C812.47 366 846 399.52 846 441C846 482.48 812.47 516 771 516Z"
                    />
                    <path
                      id="Shape 4"
                      className="shp3"
                      d="M681 861C639.52 861 606 827.48 606 786C606 744.52 639.52 711 681 711C722.48 711 756 744.52 756 786C756 827.48 722.48 861 681 861Z"
                    />
                    <path
                      id="Shape 4"
                      className="shp3"
                      d="M309 804C267.53 804 234 770.48 234 729C234 687.52 267.53 654 309 654C350.48 654 384 687.52 384 729C384 770.48 350.48 804 309 804Z"
                    />
                    <path
                      id="Shape 4"
                      className="shp3"
                      d="M947.37 1085.84L944.36 1086.58L800.91 502.5L803.93 501.76L947.37 1085.84Z"
                    />
                    <path
                      id="Shape 4"
                      className="shp3"
                      d="M908.86 1127.34L906.56 1131.24L713.03 836.63L715.33 832.73L908.86 1127.34Z"
                    />
                    <path
                      id="Shape 4"
                      className="shp3"
                      d="M874.98 1162.82L872.46 1166.06L338.64 751.59L341.16 748.35L874.98 1162.82Z"
                    />
                    <path
                      id="Shape 3"
                      className="shp1"
                      d="M1000 1347C930.88 1347 875 1291.13 875 1222C875 1152.88 930.88 1097 1000 1097C1069.13 1097 1125 1152.88 1125 1222C1125 1291.13 1069.13 1347 1000 1347Z"
                    />
                    <path
                      id="Shape 5"
                      className="shp2"
                      d="M1050 850.29C1050 850.29 1287.05 828.09 1368 1166"
                    />
                    <path id="Shape 4" className="shp2" d="M1000 844" />
                  </svg>
                </Box>
                <Heading
                  ml={[3, 4, 5]}
                  mt={2}
                  fontFamily="Helvetica"
                  fontSize={["20px", "30px", "40px"]}
                  color={textColor}
                  letterSpacing="widest"
                  fontWeight="medium"
                  style={{ transform: "scale(1, 0.9)" }}
                >
                  Exalise
                </Heading>
              </Flex>
              <Flex
                marginLeft={"auto"}
                alignItems="center"
                height={"fit-content"}
              >
                <Box>
                  <DarkModeSwitch
                    color={textColor}
                    fontSize={["18px", "22px", "24px"]}
                  />
                </Box>
              </Flex>
            </Flex>
            <Box mt={6} width={"100%"}>
              <InputField
                name="werkorder"
                placeholder={"werkorder nummer"}
                label={"Geef werkorder nummber in"}
                help=""
                color={textColor}
              />
            </Box>
            {/* <Box mt={6} width={"100%"}>
          <InputField
            name="email"
            placeholder={t.email.toLowerCase()}
            label={t.email}
            help=""
            color={textColor}
            validate={validateEmail}
          />
        </Box>
        <Box mt={4} width={"100%"}>
          <PasswordInputField
            name="pwd"
            placeholder={t.password.toLowerCase()}
            label={t.password}
            help=""
            color={textColor}
            //validate={(e) => validateEmpty(e, "408")}
          />
        </Box> */}

            <Button
              type="submit"
              colorScheme="twitter"
              isLoading={isSubmitting}
              loadingText={"Checking..."}
              size={buttonSize}
              marginTop={5}
            >
              Send
            </Button>
          </Form>
        )}
      </Formik>
      <Flex
        width={"100%"}
        justifyContent="center"
        mt={["20px", "30px", "40px"]}
        mb={["-20px", "-30px", "-40px"]}
      >
        <Text color={textColor2} fontSize={["10px", "12px", "14px"]}>
          Copyright ©Exalise 2022
        </Text>
      </Flex>
    </Box>
  );
};

export default StartScreen;
