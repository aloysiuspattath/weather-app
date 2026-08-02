import fs from 'fs';

const key = "ee6721516e884ecb954203649241505";

fetch(`https://api.weatherapi.com/v1/forecast.json?key=${key}&q=9.9312,76.2673&days=7&alerts=yes`)
  .then(res => res.json())
  .then(data => {
    let maxPrecip = 0;
    data.forecast.forecastday.forEach(day => {
      day.hour.forEach(h => {
        if (h.precip_mm > maxPrecip) maxPrecip = h.precip_mm;
      });
    });
    console.log('Max Precip from WeatherAPI across all 3 days:', maxPrecip);
  })
  .catch(err => console.error(err));
