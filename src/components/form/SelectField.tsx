import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Select,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import { useField } from "formik";
import React, { InputHTMLAttributes } from "react";

type SelectFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  options: string[];
  options2: string[];
};

export const SelectField: React.FC<SelectFieldProps> = ({
  options,
  options2,
  label,
  ...props
}) => {
  const [field, { error }] = useField(props);
  const size = useBreakpointValue(["sm", "md", "lg"]);
  const textColor = useColorModeValue("gray.700", "white");

  return (
    <FormControl isInvalid={!!error} fontSize={["sm", "md", "lg"]}>
      {label === "" ? null : (
        <FormLabel
          htmlFor={field.name}
          color={textColor}
          fontSize={["sm", "md", "lg"]}
        >
          {label}
        </FormLabel>
      )}
      <Select
        {...field}
        id={field.name}
        placeholder={props.placeholder}
        size={size}
        color={textColor}
      >
        {options.map((val, key) => {
          return (
            <option key={key} value={options2[key]}>
              {val}
            </option>
          );
        })}
      </Select>
      {error ? (
        <FormErrorMessage fontSize={["sm", "md", "lg", "lg"]}>
          {error}
        </FormErrorMessage>
      ) : null}
    </FormControl>
  );
};

export default SelectField;
