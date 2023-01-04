import { QuestionIcon } from "@chakra-ui/icons";
import {
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputProps,
  NumberInputStepper,
  Tooltip,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import { useField } from "formik";
import React, { InputHTMLAttributes } from "react";

type NumberFieldProps = InputHTMLAttributes<HTMLInputElement> &
  NumberInputProps & {
    label: string;
    name: string;
    help: string;
    setFieldValue: any;
    min: number;
    max: number;
  };

export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  help,
  min,
  max,
  setFieldValue,
  ...props
}) => {
  const [field, { error }] = useField(props);
  const size = useBreakpointValue(["sm", "md", "lg"]);
  const textColor = useColorModeValue("gray.700", "white");
  const bgQuestion = useColorModeValue("gray.100", "gray");

  return (
    <FormControl isInvalid={!!error} fontSize={["sm", "md", "lg"]}>
      {label === "" ? null : (
        <Flex alignItems="center">
          <FormLabel
            htmlFor={field.name}
            color={textColor}
            fontSize={["sm", "md", "lg"]}
          >
            {label}
          </FormLabel>
          {help === "" ? null : (
            <Tooltip
              hasArrow
              label={help}
              bg={bgQuestion}
              color={textColor}
              placement="auto-start"
            >
              <QuestionIcon
                h={["20px"]}
                fontSize={["16px"]}
                color={textColor}
                mb={1}
              />
            </Tooltip>
          )}
        </Flex>
      )}

      <NumberInput
        {...field}
        size={size}
        id={field.name}
        placeholder={props.placeholder}
        color={textColor}
        isReadOnly={props.isReadOnly}
        fontSize={props.fontSize}
        onChange={(e) => {
          setFieldValue(field.name, e);
        }}
        min={min}
        max={max}
      >
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
      {error ? (
        <FormErrorMessage fontSize={["sm", "md", "lg", "lg"]}>
          {error}
        </FormErrorMessage>
      ) : null}
    </FormControl>
  );
};

export default NumberField;
