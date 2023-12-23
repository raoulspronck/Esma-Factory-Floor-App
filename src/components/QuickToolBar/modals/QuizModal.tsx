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
  Box,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api";
import React, { useEffect, useRef, useState } from "react";
import CustomImage from "../../CustomImage";
import { A } from "@tauri-apps/api/path-9b1e7ad5";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose }) => {
  const alreadyFetched = useRef(false);

  const [allQuiz, setAllQuiz] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState<{ id: string; name: string }>(
    null
  );
  /*
{
    id: "c06ab944-218b-4f98-bff8-baa8310ba4de",
    name: "Test quiz",
  }
  */
  const [loading, setLoading] = useState(true);
  const [loadingQuiz, setLoadingQuiz] = useState(true);

  const [currentQuestion, setCurrentQuestion] = useState<{
    id: string;
    question: string;
    prevAnswerBool: boolean;
    answer?: {
      id: string;
      answer: string;
      nextQuestion?: {
        id: string;
      };
      endAnswer?: {
        id: string;
      };
    }[];
    prevAnswer?: {
      question: {
        id: string;
      };
    };
  }>(null);

  const [currentEndAnwser, setCurrentEndAnwser] = useState<{
    id: string;
    title: string;
    picture?: string;
    info: string;
  }>(null);

  useEffect(() => {
    if (isOpen && allQuiz.length === 0) {
      invoke("get_quiz")
        .then((e) => {
          setAllQuiz(JSON.parse(e as any));
          setLoadingQuiz(false);
        })
        .catch((err) => console.log(err));
    } else if (allQuiz.length !== 0) {
      setLoadingQuiz(false);
    }

    return () => {
      setLoadingQuiz(true);
    };
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"3xl"}>
      <ModalOverlay />
      <ModalContent bgColor={"gray.900"} color="white">
        <ModalCloseButton size={"lg"} />

        <>
          <ModalHeader fontSize={["17px", "19px", "22px"]} mt={[-2, -2, -1]}>
            {currentQuiz === null ? "Quiz" : currentQuiz.name}
          </ModalHeader>
          <ModalBody>
            {currentQuiz === null ? (
              loadingQuiz ? (
                <Text>Loading...</Text>
              ) : (
                allQuiz.map((e, key) => {
                  return (
                    <Flex
                      key={key}
                      alignItems={"center"}
                      mt={5}
                      pb={2}
                      borderBottom={"1px solid gray"}
                    >
                      <Text fontSize={"20px"}>{e.name}</Text>
                      <Button
                        size={"sm"}
                        ml="auto"
                        colorScheme="twitter"
                        onClick={() => {
                          setCurrentQuiz({ id: e.id, name: e.name });
                          invoke("get_question", {
                            quizId: e.id,
                            questionId: "",
                          })
                            .then((e) => {
                              setCurrentQuestion(JSON.parse(e as any));
                              setLoading(false);
                            })
                            .catch((err) => console.log(err));
                        }}
                      >
                        View
                      </Button>
                    </Flex>
                  );
                })
              )
            ) : loading ? (
              <Text>Loading...</Text>
            ) : currentEndAnwser !== null ? (
              <>
                <Heading>{currentEndAnwser.title}</Heading>

                <Box mt={3}>
                  <Text>{currentEndAnwser.info}</Text>

                  <Flex
                    mt={3}
                    width={"100%"}
                    height={"200px"}
                    justifyContent={"center"}
                    alignItems="center"
                    style={{ display: "block", position: "relative" }}
                  >
                    {currentEndAnwser.picture !== null &&
                    currentEndAnwser.picture !== undefined &&
                    currentEndAnwser.picture !== "" ? (
                      <CustomImage
                        src={`https://api.exalise.com/images/${currentEndAnwser.picture}`}
                        alt={"Picture"}
                        draggable={false}
                        objectFit="contain"
                      />
                    ) : null}
                  </Flex>
                </Box>
              </>
            ) : currentQuestion !== null ? (
              <>
                <Heading>{currentQuestion.question}</Heading>

                <SimpleGrid columns={2} spacing={10} mt={5}>
                  {currentQuestion.answer.map((e, key) => {
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
                          if (e.nextQuestion) {
                            setLoading(true);
                            invoke("get_question", {
                              quizId: currentQuiz.id,
                              questionId: e.nextQuestion.id,
                            })
                              .then((e) => {
                                setCurrentQuestion(JSON.parse(e as any));
                                setLoading(false);
                              })
                              .catch((err) => console.log(err));
                          } else if (e.endAnswer) {
                            setLoading(true);
                            invoke("get_end_answer", {
                              endAnswerId: e.endAnswer.id,
                            })
                              .then((e) => {
                                setCurrentEndAnwser(JSON.parse(e as any));
                                setLoading(false);
                              })
                              .catch((err) => console.log(err));
                          }
                        }}
                      >
                        {e.answer}
                      </Flex>
                    );
                  })}
                </SimpleGrid>
              </>
            ) : null}
          </ModalBody>
          <ModalFooter>
            {currentEndAnwser !== null ? (
              <Button
                colorScheme={"whiteAlpha"}
                onClick={() => {
                  setCurrentEndAnwser(null);
                }}
                mr={2}
              >
                Back
              </Button>
            ) : currentQuestion !== null ? (
              currentQuestion.prevAnswer !== null ? (
                <Button
                  colorScheme={"whiteAlpha"}
                  onClick={() => {
                    setLoading(true);
                    invoke("get_question", {
                      quizId: currentQuiz.id,
                      questionId: currentQuestion.prevAnswer.question.id,
                    })
                      .then((e) => {
                        setCurrentQuestion(JSON.parse(e as any));
                        setLoading(false);
                      })
                      .catch((err) => console.log(err));
                  }}
                  mr={2}
                >
                  Back
                </Button>
              ) : null
            ) : null}

            {currentQuiz !== null ? (
              <Button
                colorScheme={"whiteAlpha"}
                onClick={() => {
                  setCurrentQuestion(null);
                  setCurrentEndAnwser(null);
                  setCurrentQuiz(null);
                }}
              >
                Reset
              </Button>
            ) : null}
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
};

export default QuizModal;
