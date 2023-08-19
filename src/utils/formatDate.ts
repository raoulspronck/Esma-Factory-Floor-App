export const formatDate = (time: string, offset?: number) => {
  if (time === "" || time === undefined) {
    time = new Date().toISOString();
  }

  /* conversion to local */
  var tzoffset: number;

  if (offset) {
    tzoffset = offset * 60000;
  } else {
    tzoffset = new Date().getTimezoneOffset() * 60000;
  }

  var localTime = new Date(time).getTime(); // utc time in miliseconds
  var localISOTime = new Date(localTime - tzoffset).toISOString();

  const year = localISOTime.slice(0, 4);
  let month = localISOTime.slice(5, 7);
  switch (month) {
    case "01":
      month = "Jan";
      break;
    case "02":
      month = "Feb";
      break;
    case "03":
      month = "Mar";
      break;
    case "04":
      month = "Apr";
      break;
    case "05":
      month = "May";
      break;
    case "06":
      month = "Jun";
      break;
    case "07":
      month = "Jul";
      break;
    case "08":
      month = "Aug";
      break;
    case "09":
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

  const day = localISOTime.slice(8, 10);
  const hours = localISOTime.slice(11, 13);
  const minutes = localISOTime.slice(14, 16);
  const seconds = localISOTime.slice(17, 19);

  const formatted =
    hours +
    "h" +
    minutes +
    "m" +
    seconds +
    "s " +
    day +
    " " +
    month +
    " " +
    year;
  return formatted;
};
