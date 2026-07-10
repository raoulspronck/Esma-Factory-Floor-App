import { Flex, IconButton, Input } from "@chakra-ui/react";
import React from "react";
import { FiMinus, FiPlus } from "react-icons/fi";

interface TouchNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  width?: string;
}

/**
 * Number input built for touchscreens: large −/+ buttons instead of the
 * tiny stepper arrows of Chakra's NumberInput.
 */
const TouchNumberInput: React.FC<TouchNumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  width = "220px",
}) => {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const current = Number.isNaN(value) ? min : value;

  return (
    <Flex align="center" gap={2} width={width}>
      <IconButton
        aria-label="decrease value"
        icon={<FiMinus />}
        boxSize="52px"
        minW="52px"
        fontSize="22px"
        variant="outline"
        colorScheme="brand"
        onClick={() => onChange(clamp(current - step))}
        isDisabled={current <= min}
      />
      <Input
        value={Number.isNaN(value) ? "" : value}
        onChange={(e) => {
          const parsed = parseInt(e.target.value, 10);
          onChange(Number.isNaN(parsed) ? NaN : clamp(parsed));
        }}
        inputMode="numeric"
        textAlign="center"
        fontWeight="semibold"
        h="52px"
        fontSize="lg"
      />
      <IconButton
        aria-label="increase value"
        icon={<FiPlus />}
        boxSize="52px"
        minW="52px"
        fontSize="22px"
        variant="outline"
        colorScheme="brand"
        onClick={() => onChange(clamp(current + step))}
        isDisabled={current >= max}
      />
    </Flex>
  );
};

export default TouchNumberInput;
