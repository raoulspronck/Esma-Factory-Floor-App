import { formatDate } from "./formatDate";
import { formatSmallDate } from "./formatSmallDate";
import { makeTimePrediction } from "./predictTime";

export const formatTime = (time: number) => {
  var secondsNum = Math.floor((time / 1000) % 60);
  var minutesNum = Math.floor((time / (1000 * 60)) % 60);
  var hoursNum = Math.floor(time / (1000 * 60 * 60));

  var hours = hoursNum < 10 ? "0" + hoursNum : hoursNum.toString();
  var minutes = minutesNum < 10 ? "0" + minutesNum : minutesNum.toString();
  var seconds = secondsNum < 10 ? "0" + secondsNum : secondsNum.toString();

  return hours + "h " + minutes + "m " + seconds + "s";
};

export const formatImageValue = (value: string) => {
  const substrings = value.split("-");
  return substrings[1];
};

export const formatNumberValue = (value: string, type: string) => {
  switch (type) {
    case "Temperature":
      return value + "°C";

    case "Humidity":
      return value + "%";

    case "Light":
      return value + " Lu";

    case "Percentage":
      return (Math.round(parseFloat(value) * 10000) / 100).toString() + "%";

    case "Percentile":
      return (Math.round(parseFloat(value) * 100000) / 100).toString();

    case "Time":
      return formatTime(parseInt(value));

    case "TimePrediction":
      return formatSmallDate(makeTimePrediction(parseInt(value)).toISOString());

    case "Images":
      return formatImageValue(value);

    case "number":
      if (value.length > 10) {
        return (
          (Math.round(parseFloat(value) * 100000000) / 100000000).toString() +
          "..."
        );
      }

      return value;

    default:
      return value;
  }
};
