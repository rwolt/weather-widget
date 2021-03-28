import './style.css';
import axios from 'axios';
import { Loader } from '@googlemaps/js-api-loader';

// async function getBrowserLocation() {
//   navigator.geolocation.getCurrentPosition(success, error);
// }

// async function success(position) {
//   let browserWeather = await getWeather([
//     position.coords.latitude,
//     position.coords.longitude,
//   ]);
//   console.log(browserWeather);
// }

// function error(err) {
//   console.error(`ERROR: ${err.code}: ${err.message}`);
// }

// getBrowserLocation();

//Parameters for OpenWeather API
const BASE_URL = 'https://api.openweathermap.org/data/2.5/onecall';
const API_KEY = '96fbe31792d3ab0a6f8838c62dde7ca5';

//Load Google Maps API
const loader = new Loader({
  apiKey: 'AIzaSyBrlrNOQ1WhttjwHkXEuQgUf-OpogzGKig',
  version: 'weekly',
  libraries: ['places'],
});

//Start the Autocomplete service
let autocomplete;
loader.load().then(() => {
  autocomplete = new google.maps.places.Autocomplete(
    document.getElementById('autocomplete'),
    {
      types: ['(cities)'],
      fields: ['geometry', 'adr_address'],
    }
  );
  autocomplete.addListener('place_changed', onPlaceChanged);
});

//Callback when place is selected
function onPlaceChanged() {
  let place = autocomplete.getPlace();

  if (!place.geometry) {
    //User did not select a prediction; reset the input field
    document.getElementById('autocomplete').placeholder = 'Search Locations';
  } else {
    //Assign place details to variables and call display controller
    let city = {};
    city.name = place.adr_address;
    city.lat = place.geometry.location.lat();
    city.lon = place.geometry.location.lng();
    viewer
      .displayWeather(city)
      .then((weather) => viewer.updateForecast(weather));
  }
}

async function getWeather([lat, lon]) {
  let response = await axios.get(
    `${BASE_URL}?lat=${lat}&lon=${lon}&exclude=minutely,hourly&appid=${API_KEY}`
  );
  return response.data;
}

const viewer = (() => {
  let weather;
  //Display the current weather
  const displayWeather = async (city) => {
    weather = await getWeather([city.lat, city.lon]);
    document.querySelector('#city-name').innerHTML = city.name;
    document.querySelector('#current-temp').innerText = convertF(
      weather.current.temp
    );
  };
  //Display the 7 day forecast
  const updateForecast = () => {
    let forecast = document.querySelector('#forecast');
    forecast.innerHTML = '';
    weather.daily.forEach((day) => {
      let card = document.createElement('div');
      card.classList.add('card');
      let info = document.createElement('p');
      info.innerHTML += new Date(day.dt * 1000).toString() + '</br>';
      info.innerHTML += 'Low: ' + convertF(day.temp.min) + '</br>';
      info.innerHTML += 'High: ' + convertF(day.temp.max) + '</br>';
      card.appendChild(info);
      forecast.appendChild(card);
    });
  };
  return { displayWeather, updateForecast };
})();

function convertF(degreesKelvin) {
  return (((degreesKelvin - 273.15) * 9) / 5 + 32).toFixed(0);
}
