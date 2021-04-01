import './style.css';
import axios from 'axios';
import { Loader } from '@googlemaps/js-api-loader';
import dayjs from 'dayjs';
import image from './images/settings-gray.png';
let config = require('../config');

document.querySelector('.settings').src = image;
document.querySelector('.settings').addEventListener('click', function (e) {
  e.stopPropagation();
  document.querySelector('.drop-content').classList.toggle('invisible');
});

window.addEventListener('click', (e) => {
  e.stopPropagation();
  if (
    !document.querySelector('.drop-content').classList.contains('invisible')
  ) {
    document.querySelector('.drop-content').classList.add('invisible');
  }
});

document.querySelector('.geo').addEventListener('click', function (e) {
  getBrowserLocation();
});

document.querySelector('.c-switch').addEventListener('click', function (e) {
  e.stopPropagation();
  if (viewer.getDegrees() == 'fahr' && document.querySelector('.card')) {
    viewer.updateTemps('celc');
  }
  viewer.setDegrees('celc');
  e.target.classList.add('selected');
  document.querySelector('.f-switch').classList.remove('selected');
  e.stopPropagation();
});

document.querySelector('.f-switch').addEventListener('click', function (e) {
  e.stopPropagation();
  if (viewer.getDegrees() == 'celc' && document.querySelector('.card')) {
    viewer.updateTemps('fahr');
  }
  viewer.setDegrees('fahr');
  e.target.classList.add('selected');
  document.querySelector('.c-switch').classList.remove('selected');
});

async function getBrowserLocation() {
  navigator.geolocation.getCurrentPosition(success, error);
}

async function success(position) {
  let city = {};
  city.lat = position.coords.latitude;
  city.lon = position.coords.longitude;
  let response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${city.lat},${city.lon}&result_type=locality&key=${config.googleMapsKey}`
  );
  console.log(response);
  city.name = response.data.results[0].formatted_address;
  viewer.displayWeather(city).then((weather) => viewer.updateForecast(weather));
}

function error(err) {
  console.error(`ERROR: ${err.code}: ${err.message}`);
}

//Parameters for OpenWeather API
const BASE_URL = 'https://api.openweathermap.org/data/2.5/onecall';
const API_KEY = config.openWeatherKey;

//Load Google Maps API
const loader = new Loader({
  apiKey: config.googleMapsKey,
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
    console.log(place);
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
  let degrees = 'fahr';
  //Display the current weather
  const displayWeather = async (city) => {
    weather = await getWeather([city.lat, city.lon]);
    document.querySelector('#city-name').innerHTML = city.name;
    let currentIcon = document.querySelector('#current-weather-icon');
    currentIcon.src = `http://openweathermap.org/img/wn/${weather.current.weather[0].icon}@4x.png`;
    document.querySelector('#current-temp').innerText = convertK(
      weather.current.temp,
      viewer.getDegrees()
    );
    document.querySelector('#current-temp').dataset.currentTemp =
      weather.current.temp;
  };
  //Display the 7 day forecast
  const updateForecast = () => {
    let forecast = document.querySelector('#forecast');
    forecast.innerHTML = '';
    weather.daily.forEach((day) => {
      let card = document.createElement('div');
      card.classList.add('card');
      card.dataset.maxTemp = day.temp.max;
      card.dataset.minTemp = day.temp.min;
      //Create Elements for each day's card
      let date = document.createElement('p');
      let info = document.createElement('div');
      info.classList.add('info');
      let icon = document.createElement('img');
      let description = document.createElement('p');

      //Convert the unix timestamp date into readable format
      date.innerHTML = dayjs.unix(day.dt).format('ddd M/D');

      //Display the High and Low temperatures
      info.innerHTML = `<span class="high-temp">${convertK(
        day.temp.max,
        viewer.getDegrees()
      )}</span> | <span class="low-temp">${convertK(
        day.temp.min,
        viewer.getDegrees()
      )}</span>`;

      //Retrieve the icon matching the forecasted weather condition
      icon.src = `http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;

      //Display the description of the forecasted weather condition
      description.innerHTML += day.weather[0].main;
      //Append elements to the day's card
      card.appendChild(date);
      card.appendChild(info);
      card.appendChild(icon);
      card.appendChild(description);

      forecast.appendChild(card);
    });
  };

  function getDegrees() {
    return degrees;
  }

  function setDegrees(unit) {
    if (unit == 'fahr') {
      degrees = 'fahr';
    } else if (unit == 'celc') {
      degrees = 'celc';
    }
  }

  //Update the temperature to state of viewer.degrees
  function updateTemps(unit) {
    document.querySelector('#current-temp').innerText = convertK(
      document.querySelector('#current-temp').dataset.currentTemp,
      unit
    );
    let cards = document.querySelectorAll('.card');
    cards.forEach((card) => {
      card.querySelector(
        '.info'
      ).innerHTML = `<span class="high-temp">${convertK(
        card.dataset.maxTemp,
        unit
      )}</span> | <span class="low-temp">${convertK(
        card.dataset.minTemp,
        unit
      )}</span>`;
    });
  }

  return {
    displayWeather,
    updateForecast,
    getDegrees,
    setDegrees,
    updateTemps,
  };
})();

//Convert Degrees Kelvin to Fahrenheit or Celcius
function convertK(degreesKelvin, unit) {
  if (unit == 'fahr') {
    return (((degreesKelvin - 273.15) * 9) / 5 + 32).toFixed(0);
  } else if (unit == 'celc') {
    return (degreesKelvin - 273.15).toFixed(0);
  } else {
    return new Error('Invalid Output Unit: Must be Fahrenheit or Celcius');
  }
}
