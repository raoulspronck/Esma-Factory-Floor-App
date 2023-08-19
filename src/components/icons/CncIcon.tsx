import { Icon, IconProps } from "@chakra-ui/react";
import React from "react";

const CncIcon: React.FC<IconProps> = (props) => {
  return (
    <Icon viewBox="0 0 250 250" {...props}>
      <svg
        version="1.2"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 250 300"
        width="250"
        height="300"
      >
        <path id="Shape 1" className="s0" d="m17 22h207v1h-207z" />
        <path id="Shape 2" className="s0" d="m83 22h77v35h-77z" />
        <path id="Shape 3" className="s0" d="m90 57h60v47h-60z" />
        <path
          id="Shape 4"
          className="s0"
          d="m77 106l88 1 1 29-15 21-57 1-17-23z"
        />
        <path id="Shape 5" className="s0" d="m143.3 130.8l-65.5-0.5" />
        <path
          id="Layer 2"
          className="s0"
          d="m105 157v69l16 16 16-15 0.8-69.2z"
        />
        <path id="Layer 3" className="s0" d="m134 178l-24 16" />
        <path id="Layer 4" className="s0" d="m136 203l-26 18" />
      </svg>
    </Icon>
  );
};

export default CncIcon;
