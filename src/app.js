import './style.css';
import axios from 'axios';

const BASE_URL = 'api.openweathermap.org/data/2.5/weather?zip=';
const API_KEY = '96fbe31792d3ab0a6f8838c62dde7ca5';

async function getWeather(zip) {
  let response = await axios.get(`http://${BASE_URL}${zip}&appid=${API_KEY}`);
  return response.data;
}

async function main() {
  let currentWeather = await getWeather(78520);
  console.log(currentWeather);
  document.querySelector('.city-name').innerText = currentWeather.name;
  document.querySelector('.current-temp').innerText = convertF(
    currentWeather.main.temp
  );
}

main();

function convertF(degreesKelvin) {
  return (((degreesKelvin - 273.15) * 9) / 5 + 32).toFixed(0);
}
