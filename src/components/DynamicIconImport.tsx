import React from "react";
import * as IO from "react-icons/io5";

type IconNames = {
  [K in keyof typeof IO]: K extends `Io${infer U}` ? U : never;
}[keyof typeof IO];

interface DynamicComponentProps {
  techs: IconNames[];
}

const DynamicComponent: React.FC<DynamicComponentProps> = ({ techs }) => {
  const techsFormatted = techs.map(
    (tech) => `Io${tech}`
  ) as (keyof typeof IO)[];

  return (
    <>
      {techsFormatted.map((icon, i) => {
        const Icon = IO[icon];
        return <Icon key={i} />;
      })}
    </>
  );
};

export default DynamicComponent;
