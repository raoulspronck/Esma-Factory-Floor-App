import { GrReturn } from "react-icons/gr";

// return time
const predictTimeAndDayFromNow = (
  initialTime: number
): {
  hours: number;
  minutes: number;
  day: number;
} => {
  // predicts when machine is finished base on office hours

  // start
  const work_start = 6.92;
  const work_stop = 15.75;

  // Pauze 1
  const pauze1_start = 10;
  const pauze1_stop = 10.42;

  // Pauze 2
  const pauze2_start = 12.5;
  const pauze2_stop = 13.08;

  // working periodes
  const work_periode1 = pauze1_start - work_start;
  const work_periode2 = pauze2_start - pauze1_stop;
  const work_periode3 = work_stop - pauze2_stop;

  let total_work_periode = work_periode1 + work_periode2 + work_periode3;
  let half_work_periode = work_periode1 + work_periode2;
  let half_end_work_periode = work_periode2 + work_periode3;

  // Nu
  const nowDate = new Date();
  const now = nowDate.getHours() + nowDate.getMinutes() / 60;

  // Time to complete the order in hours,minutes
  const machinetime = initialTime / 1000 / 60 / 60;
  const machinetime_hours = Math.floor(machinetime);
  const machinetime_minutes = Math.round(
    (machinetime - machinetime_hours) * 60
  );
  let machinetime_total = machinetime_hours + machinetime_minutes / 60;

  let predictionDay = 0;

  // als we voor de eerste pauze zitten
  if (now < pauze1_start) {
    // Nu is het voor de pauze
    if (now + machinetime_total < pauze1_start) {
      // voor de eerste pauze klaar
      const time = now + machinetime_total;
      const hours = Math.floor(time);
      return {
        hours,
        minutes: Math.round((time - hours) * 60),
        day: 0,
      };
    } else {
      machinetime_total = machinetime_total - (pauze1_start - now);
      if (machinetime_total > half_end_work_periode) {
        // we zijn vandaag niet klaar
        machinetime_total = machinetime_total - half_end_work_periode;
      } else if (machinetime_total > work_periode2) {
        // we zijn in workperiode 3 klaar
        const time = pauze2_stop + (machinetime_total - work_periode2);
        const hours = Math.floor(time);
        return {
          hours,
          minutes: Math.round((time - hours) * 60),
          day: 0,
        };
      } else {
        // we zijn voor de middag pauze klaar
        const time = pauze1_stop + machinetime_total;
        const hours = Math.floor(time);
        return {
          hours,
          minutes: Math.round((time - hours) * 60),
          day: 0,
        };
      }
    }
  } else if (now < pauze2_start) {
    // als we voor de middag pauze zitten
    if (now + machinetime_total < pauze2_start) {
      // we zijn voor de middag pauze klaar

      const time = now + machinetime_total;
      const hours = Math.floor(time);
      return {
        hours,
        minutes: Math.round((time - hours) * 60),
        day: 0,
      };
    } else {
      machinetime_total = machinetime_total - (pauze2_start - now);

      // We zitten na de middag pauze we hebben nog 3 te gaan
      if (machinetime_total > work_periode3) {
        // we zijn vandaag niet klaar
        machinetime_total = machinetime_total - work_periode3;
      } else {
        // voor het einde van de dag klaar
        const time = pauze2_stop + machinetime_total;
        const hours = Math.floor(time);
        return {
          hours,
          minutes: Math.round((time - hours) * 60),
          day: 0,
        };
      }
    }
  } else if (now < work_stop) {
    // als we voor het einde zitten
    if (now + machinetime_total < work_stop) {
      // voor het einde klaar
      const time = now + machinetime_total;
      const hours = Math.floor(time);
      return {
        hours,
        minutes: Math.round((time - hours) * 60),
        day: 0,
      };
    } else {
      // niet optijd klaar
      machinetime_total = machinetime_total - (work_stop - now);
    }
  }

  // prediction = volgende dag om 00:00:00
  // Add one day to the current date
  predictionDay = 1;

  // Tijd begint op dag predictionDay time frame prediction
  while (true) {
    if (machinetime_total > total_work_periode) {
      machinetime_total = machinetime_total - total_work_periode;
      predictionDay += 1;
    } else if (machinetime_total > half_work_periode) {
      // eindigd ergens in dag x time frame 2
      const time = pauze2_stop + (machinetime_total - half_work_periode);
      const hours = Math.floor(time);
      return {
        hours,
        minutes: Math.round((time - hours) * 60),
        day: predictionDay,
      };
    } else if (machinetime_total > work_periode1) {
      // eindigd ergens in dag x time frame 1
      const time = pauze1_stop + (machinetime_total - work_periode1);
      const hours = Math.floor(time);
      return {
        hours,
        minutes: Math.round((time - hours) * 60),
        day: predictionDay,
      };
    } else {
      // eindigd ergens in dag x time frame 0
      const time = work_start + machinetime_total;
      const hours = Math.floor(time);
      return {
        hours,
        minutes: Math.round((time - hours) * 60),
        day: predictionDay,
      };
    }
  }
};

export const makeTimePrediction = (initialTime: number) => {
  if (!initialTime) {
    return "No data";
  }

  const value = predictTimeAndDayFromNow(initialTime);
  const date = new Date(new Date().getTime() + value.day * 24 * 60 * 60 * 1000);

  return `${date.getDay()}/${date.getMonth() + 1}/${date
    .getFullYear()
    .toString()
    .slice(2, 4)}' ${value.hours}:${value.minutes}`;
};
