export const makeTimePrediction = (time: number) => {
  // 7 - 10 = 3 uur = 10.800.000ms
  // 10:20 - 12:30 = 2 uur 10 = 7.800.000ms
  // 13:05 - 15:45 = 2 uur 40 = 9.600.000ms
  // 1 werk dag = 28200000
  const now = new Date().getTime();

  const einde = new Date().setUTCHours(13, 45, 0, 0);

  const middagPauze = new Date().setUTCHours(10, 30, 0, 0);
  const middagPauzeEinde = new Date().setUTCHours(11, 5, 0, 0);

  const eerstePauze = new Date().setUTCHours(8, 0, 0, 0);
  const eerstePauzeEinde = new Date().setUTCHours(8, 20, 0, 0);

  let predictionDay = 0;

  // ls we voor de eerste pauze zitten
  if (now < eerstePauze) {
    if (now + time < eerstePauze) {
      // voor de eerste pauze klaar
      return new Date(now + time);
    } else {
      time = time - (eerstePauze - now);

      // We zitten na de eerste pauze we hebben nog 18600000ms te gaan
      if (time > 18600000) {
        time = time - 18600000;
      } else if (time > 7800000) {
        // voor het einde van de dag klaar
        return new Date(middagPauzeEinde + (time - 780000));
      } else {
        // voor de middag pauze klaar
        return new Date(eerstePauzeEinde + time);
      }
    }
  } else if (now < middagPauze) {
    // als we voor de middag pauze zitten
    if (now + time < middagPauze) {
      // voor de middag pauze klaar
      return new Date(now + time);
    } else {
      time = time - (middagPauze - now);

      // We zitten na de middag pauze we hebben nog 9600000ms te gaan
      if (time > 9600000) {
        time = time - 9600000;
      } else {
        // voor het einde van de dag klaar
        return new Date(middagPauzeEinde + time);
      }
    }
  } else if (now < einde) {
    // als we voor het einde zitten
    if (now + time < einde) {
      // voor het einde klaar
      return new Date(now + time);
    } else {
      time = time - (einde - now);
    }
  }

  // prediction = volgende dag om 00:00:00
  // Add one day to the current date

  // Create a Date object for the current date
  const currentDate = new Date();

  // Add one day to the current date
  currentDate.setDate(currentDate.getDate() + 1);

  // Set the time components to the beginning of the day
  currentDate.setUTCHours(0, 0, 0, 0);

  let prediction = currentDate.getTime();

  // Tijd begint op dag X time frame 0
  while (true) {
    if (time > 28200000) {
      time = time - 28200000;
      predictionDay += 1;
    } else if (time > 18600000) {
      // eindigd ergens in dag x time frame 2

      // plus aantal dagen
      prediction += predictionDay * 86400000;
      // plus einde middag pauze 11h5min = 39900000
      prediction += 39900000;
      // plus hoeveel er nog gewerkt moet worden na de middag pauze
      prediction += time - 18600000;
      return new Date(prediction);
    } else if (time > 10800000) {
      // eindigd ergens in dag x time frame 1
      // plus aantal dagen
      prediction += predictionDay * 86400000;
      // plus einde eerste pauze 8h20min = 30000000
      prediction += 30000000;
      // plus hoeveel er nog gewerkt moet worden na de eerste pauze
      prediction += time - 10800000;
      return new Date(prediction);
    } else {
      // eindigd ergens in dag x time frame 0
      // plus aantal dagen
      prediction += predictionDay * 86400000;
      // plus start dag 4h55min = 17700000
      prediction += 17700000;
      // plus hoeveel er nog gewerkt moet worden na de eerste pauze
      prediction += time;
      return new Date(prediction);
    }
  }
};
