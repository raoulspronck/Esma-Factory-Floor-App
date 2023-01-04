import { QuestionIcon } from "@chakra-ui/icons";
import {
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputProps,
  Tooltip,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import { useField } from "formik";
import React, { InputHTMLAttributes } from "react";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> &
  InputProps & {
    label: string;
    name: string;
    help: string;
    readOnlySet?: boolean;
    validate?: (value: any) => any;
  };

export const InputField: React.FC<InputFieldProps> = ({
  label,
  help,
  readOnlySet,
  validate,
  ...props
}) => {
  const [field, { error }] = useField({ ...props, validate });
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
      <Input
        {...field}
        type={props.type}
        id={field.name}
        placeholder={props.placeholder}
        size={size}
        color={textColor}
        isReadOnly={readOnlySet}
        fontSize={props.fontSize}
        cursor={readOnlySet ? "default" : "unset"}
      />
      {error ? (
        <FormErrorMessage fontSize={["sm", "md", "lg", "lg"]}>
          {error}
        </FormErrorMessage>
      ) : null}
    </FormControl>
  );
};

export default InputField;
