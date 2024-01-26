import {
  Box,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  Select,
  Text,
  Stack,
  useBreakpointValue,
} from "@chakra-ui/react";
import React, { useEffect } from "react";

interface WidgetSetupProps {
  widget: string;
  dataPoints: any[];
  dataPointsSelected: any[];
  setDataPointsSelected: React.Dispatch<React.SetStateAction<any[]>>;
  finalWidget: string;
  setFinalWidget: React.Dispatch<React.SetStateAction<string>>;
}

const WidgetSetup: React.FC<WidgetSetupProps> = ({
  widget,
  dataPoints,
  dataPointsSelected,
  setDataPointsSelected,
  finalWidget,
  setFinalWidget,
}) => {
  const buttonSize = useBreakpointValue(["sm", "md", "lg"]);

  useEffect(() => {
    setFinalWidget(widget);
  }, []);

  // widget name Two Default / clean / progress

  switch (widget.split("/")[0]) {
    case "Two Default":
      return (
        <>
          <Box mt={5}>
            <Text fontSize={"24px"} fontWeight={"medium"}>
              Value 1
            </Text>
            <FormControl>
              <FormLabel fontSize={["sm", "md", "lg"]}>
                Select a version
              </FormLabel>
              <RadioGroup
                onChange={(i) => {
                  setFinalWidget(
                    (e) => e.split("/")[0] + "/" + i + "/" + e.split("/")[2]
                  );
                }}
                value={finalWidget.split("/")[1]}
              >
                <Stack direction="row">
                  <Radio value="Default">Clean</Radio>
                  <Radio value="Default progress up">Progress up green</Radio>
                  <Radio value="Default progress down">Progress up red</Radio>
                  <Radio value="Time prediction">Time prediction</Radio>
                </Stack>
                <Stack direction="row">
                  <Radio value="Button">Button</Radio>
                  <Radio value="Switch">Switch</Radio>
                  <Radio value="Slider">Slider</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          </Box>
          <Box mt={5}>
            <FormControl>
              <FormLabel fontSize={["sm", "md", "lg"]}>
                Select datapoint
              </FormLabel>

              <Select
                size={buttonSize}
                ml="auto"
                value={
                  dataPointsSelected[0] === undefined
                    ? ""
                    : dataPointsSelected[0]
                }
                onChange={(e) =>
                  setDataPointsSelected((i) => [
                    e.target.value,
                    i[1] === undefined ? "" : i[1],
                  ])
                }
              >
                <option>Select datapoint</option>
                {dataPoints.map((e, key) => (
                  <option value={e.key} key={key}>
                    {e.key}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box mt={5}>
            <Text fontSize={"24px"} fontWeight={"medium"}>
              Value 2
            </Text>
            <FormControl>
              <FormLabel fontSize={["sm", "md", "lg"]}>
                Select a version
              </FormLabel>
              <RadioGroup
                onChange={(i) => {
                  setFinalWidget(
                    (e) => e.split("/")[0] + "/" + e.split("/")[1] + "/" + i
                  );
                }}
                value={finalWidget.split("/")[2]}
              >
                <Stack direction="row">
                  <Radio value="Default">Clean</Radio>
                  <Radio value="Default progress up">Progress up green</Radio>
                  <Radio value="Default progress down">Progress up red</Radio>
                  <Radio value="Time prediction">Time prediction</Radio>
                </Stack>
                <Stack direction="row">
                  <Radio value="Button">Button</Radio>
                  <Radio value="Switch">Switch</Radio>
                  <Radio value="Slider">Slider</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          </Box>
          <Box mt={5}>
            <FormControl>
              <FormLabel fontSize={["sm", "md", "lg"]}>
                Select datapoint
              </FormLabel>

              <Select
                size={buttonSize}
                ml="auto"
                value={
                  dataPointsSelected[1] === undefined
                    ? ""
                    : dataPointsSelected[1]
                }
                onChange={(e) =>
                  setDataPointsSelected((i) => [
                    i[0] === undefined ? "" : i[0],
                    e.target.value,
                  ])
                }
              >
                <option>Select datapoint</option>
                {dataPoints.map((e, key) => (
                  <option value={e.key} key={key}>
                    {e.key}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Box>
        </>
      );

    case "Circular progress":
      return (
        <>
          <Box mt={5}>
            <FormControl>
              <FormLabel fontSize={["sm", "md", "lg"]}>
                Select a version
              </FormLabel>
              <RadioGroup onChange={setFinalWidget} value={finalWidget}>
                <Stack direction="row">
                  <Radio value="Circular progress">Fixed color (gray)</Radio>
                  <Radio value="Circular progress with variable color">
                    Variable color
                  </Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          </Box>

          {finalWidget === "Circular progress" ? null : (
            <Box mt={5}>
              <FormControl>
                <FormLabel fontSize={["sm", "md", "lg"]}>
                  Select datapoint to display value
                </FormLabel>

                <Select
                  size={buttonSize}
                  ml="auto"
                  value={
                    dataPointsSelected[0] === undefined
                      ? ""
                      : dataPointsSelected[0]
                  }
                  onChange={(e) =>
                    setDataPointsSelected((i) => [
                      e.target.value,
                      i[1] === undefined ? "" : i[1],
                      i[2] === undefined ? "" : i[2],
                    ])
                  }
                >
                  <option value="">Select datapoint</option>
                  {dataPoints.map((e, key) => (
                    <option value={e.key} key={key}>
                      {e.key}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          <Box mt={5}>
            <FormControl>
              <FormLabel fontSize={["sm", "md", "lg"]}>
                Select datapoint to display max value
              </FormLabel>

              <Select
                size={buttonSize}
                ml="auto"
                value={
                  dataPointsSelected[1] === undefined
                    ? ""
                    : dataPointsSelected[1]
                }
                onChange={(e) =>
                  setDataPointsSelected((i) => [
                    i[0] === undefined ? "" : i[0],
                    e.target.value,
                    i[2] === undefined ? "" : i[2],
                  ])
                }
              >
                <option value="">Select datapoint</option>
                {dataPoints.map((e, key) => (
                  <option value={e.key} key={key}>
                    {e.key}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box mt={5}>
            <FormControl>
              <FormLabel fontSize={["sm", "md", "lg"]}>
                Select datapoint to display color
              </FormLabel>

              <Select
                size={buttonSize}
                ml="auto"
                value={
                  dataPointsSelected[2] === undefined
                    ? ""
                    : dataPointsSelected[2]
                }
                onChange={(e) =>
                  setDataPointsSelected((i) => [
                    i[0] === undefined ? "" : i[0],

                    i[1] === undefined ? "" : i[1],
                    e.target.value,
                  ])
                }
              >
                <option value="">Select datapoint</option>
                {dataPoints.map((e, key) => (
                  <option value={e.key} key={key}>
                    {e.key}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Box>
        </>
      );

    case "Custom input":
      return (
        <Box mt={5}>
          <FormControl>
            <FormLabel fontSize={["sm", "md", "lg"]}>
              Select datapoint
            </FormLabel>

            <Select
              size={buttonSize}
              ml="auto"
              value={dataPointsSelected[0]}
              onChange={(e) => setDataPointsSelected((_i) => [e.target.value])}
            >
              <option value="">Select datapoint</option>
              {dataPoints.map((e, key) => (
                <option value={e.key} key={key}>
                  {e.key}
                </option>
              ))}
            </Select>
          </FormControl>
        </Box>
      );

    case "Timer":
      return (
        <Box mt={5}>
          <FormControl>
            <FormLabel fontSize={["sm", "md", "lg"]}>
              Select datapoint to trigger and retrigger timer (run = groen /
              stop = rood)
            </FormLabel>

            <Select
              size={buttonSize}
              ml="auto"
              value={dataPointsSelected[0]}
              onChange={(e) => setDataPointsSelected((_i) => [e.target.value])}
            >
              <option value="">Select datapoint</option>
              {dataPoints.map((e, key) => (
                <option value={e.key} key={key}>
                  {e.key}
                </option>
              ))}
            </Select>
          </FormControl>
        </Box>
      );

    default:
      return (
        <>
          <Box mt={5}>
            <FormControl>
              <FormLabel fontSize={["sm", "md", "lg"]}>
                Select a version
              </FormLabel>
              <RadioGroup onChange={setFinalWidget} value={finalWidget}>
                <Stack direction="row">
                  <Radio value="Default">Clean</Radio>
                  <Radio value="Default progress up">Progress up green</Radio>
                  <Radio value="Default progress down">Progress up red</Radio>
                  <Radio value="Time prediction">Time prediction</Radio>
                </Stack>
                <Stack direction="row">
                  <Radio value="Button">Button</Radio>
                  <Radio value="Switch">Switch</Radio>
                  <Radio value="Slider">Slider</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          </Box>
          <Box mt={5}>
            <FormControl>
              <FormLabel fontSize={["sm", "md", "lg"]}>
                Select datapoint
              </FormLabel>

              <Select
                size={buttonSize}
                ml="auto"
                value={dataPointsSelected[0]}
                onChange={(e) =>
                  setDataPointsSelected((i) => [e.target.value, ...i])
                }
              >
                <option>Select datapoint</option>
                {dataPoints.map((e, key) => (
                  <option value={e.key} key={key}>
                    {e.key}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Box>
        </>
      );
  }
};

export default WidgetSetup;
