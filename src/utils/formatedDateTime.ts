export const formatedDateTime = (time: number, timezone?: string) => {
  const utcDate = new Date(time);
  const localDate = utcDate.toLocaleString();
  const localDateTimeSplit = localDate.split(" ");
  const localDateSplit = localDateTimeSplit[0].split("-");
  const localTimeSplit = localDateTimeSplit[1].split(":");

  const year = localDateSplit[2];
  let month = localDateSplit[1];
  switch (month) {
    case "1":
      month = "Jan";
      break;
    case "2":
      month = "Feb";
      break;
    case "3":
      month = "Mar";
      break;
    case "4":
      month = "Apr";
      break;
    case "5":
      month = "May";
      break;
    case "6":
      month = "Jun";
      break;
    case "7":
      month = "Jul";
      break;
    case "8":
      month = "Aug";
      break;
    case "9":
      month = "Sep";
      break;
    case "10":
      month = "Okt";
      break;
    case "11":
      month = "Nov";
      break;
    case "12":
      month = "Dec";
      break;
  }

  const day = localDateSplit[0];
  const hours = localTimeSplit[0];
  const minutes = localTimeSplit[1];

  const formatted =
    hours + ":" + minutes + " " + day + " " + month + " " + year;
  return formatted;
};
