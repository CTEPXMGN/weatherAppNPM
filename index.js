import { UI_ELEMENTS } from "./view.js";
import {currentCity, favoriteCities} from "./storage.js";
import { compareAsc, format } from 'date-fns';

if (!localStorage.getItem('cities')) {
    localStorage.setItem('cities', `[]`); 
} else {
    renderFavorites(favoriteCities);
};

if (localStorage.getItem('currentCity')) {
    getWeather(currentCity);
};

// Переключение табов
document.querySelectorAll('.tab').forEach((item) => 
    item.addEventListener('click', function(event) {
        event.preventDefault();
        const id = event.target.getAttribute('href').replace('#', '');

        document.querySelectorAll('.tab').forEach(
            (child) => child.classList.remove('active-tab')
        );
        document.querySelectorAll('.tab__item').forEach(
            (child) => child.classList.remove('active')
        );
        
        item.classList.add('active-tab');
        document.getElementById(id).classList.add('active');
    })
);
document.querySelector('.tab').click();

// Получение погоды
UI_ELEMENTS.FIND_FORM.addEventListener('submit', handlerCitySearch);
UI_ELEMENTS.FIND_CITY.addEventListener('click', handlerCitySearch);

function handlerCitySearch(event) {
    event.preventDefault();

    const city = UI_ELEMENTS.FIND_INPUT.value;
    getWeather(city);
};

async function getWeather(city) {
    const SERVER_URL = 'http://api.openweathermap.org/data/2.5/weather';
    const SERVER_URL_FORECAST = 'https://api.openweathermap.org/data/2.5/forecast';
    const API_KEY = '0a8c506a0f09e19f0f5a48594460c570';
    const URL = `${SERVER_URL}?q=${city}&appid=${API_KEY}&units=metric&lang=ru`;
    const URL_FORECAST = `${SERVER_URL_FORECAST}?q=${city}&appid=${API_KEY}&units=metric&lang=ru`;
    
    try {
        let response = await fetch(URL);
        let response2 = await fetch(URL_FORECAST);

        if (response.ok && response2.ok) {
            let dataWeather = await response.json();
            let dataWeatherForecast = await response2.json();
            console.log(dataWeatherForecast);
            const SRC_IMG = `
            https://openweathermap.org/img/wn/${dataWeather.weather[0].icon}@4x.png
            `;
            const SRC_IMG_FORECAST = `
            https://openweathermap.org/img/wn/${dataWeatherForecast.list[0].weather[0].icon}@4x.png
            `;

            renderNow(Math.round(dataWeather.main.temp) ,dataWeather.name, SRC_IMG);
            renderDetails(dataWeather);
            renderForecast(dataWeatherForecast);
            localStorage.setItem('currentCity', dataWeather.name);
        } else {
            alert('Ошибочка вышла: ' + response.status);
        }
    } catch (error) {
        alert(error.stack);
    }
    UI_ELEMENTS.FIND_INPUT.value = '';
};

function clearTab(parent) {
    if (parent.firstChild) {
        parent.removeChild(parent.firstChild);
        clearTab(parent);
    };
};
// Отрисовка вкладки NOW
function renderNow(temp, city, icon) {
    clearTab(UI_ELEMENTS.TAB_NOW);

    const p1 = document.createElement('p');
    p1.classList.add('tab-now__temperature');
    p1.textContent = temp + '°';
    UI_ELEMENTS.TAB_NOW.appendChild(p1);

    const p2 = document.createElement('p');
    p2.classList.add('tab-now__city');
    p2.textContent = city;
    UI_ELEMENTS.TAB_NOW.appendChild(p2);

    const input = document.createElement('input');
    input.classList.add('tab-now__add');
    input.type = 'button';
    input.addEventListener('click', () => addToFavorites(city));
    UI_ELEMENTS.TAB_NOW.appendChild(input);

    const img = document.createElement('img');
    img.classList.add('tab-now__img');
    img.src = icon;
    img.alt = 'weather icon';
    UI_ELEMENTS.TAB_NOW.appendChild(img);
};

// Добавление в избранное
function addToFavorites(city) {
    const favoriteCities = new Set(JSON.parse(localStorage.getItem('cities')));
    favoriteCities.add(city);
    localStorage.setItem('cities', JSON.stringify([...favoriteCities]));

    renderFavorites(favoriteCities);
};

// Отрисовка избранного
function renderFavorites(cities) {
    while(UI_ELEMENTS.ADDED_CITIES_LIST.firstChild){
        UI_ELEMENTS.ADDED_CITIES_LIST.removeChild(
            UI_ELEMENTS.ADDED_CITIES_LIST.firstChild
            );
    };

    for (const elem of cities) {
        const li = document.createElement('li');
        li.classList.add('added-cities__item');
        li.textContent = elem + '   ';
        li.addEventListener('click', () => findFromFavorite(elem));
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-city');
        deleteButton.addEventListener('click', () => delFromFavorites(event, cities, elem));
        li.append(deleteButton);
        UI_ELEMENTS.ADDED_CITIES_LIST.append(li);
    };
};

// Удаление из избранного
function delFromFavorites(event, cities, elem) {
    event.stopPropagation();

    cities = JSON.parse(localStorage.getItem('cities'));
    let favoritesCities = cities.filter(item => item !== elem);
    localStorage.cities = JSON.stringify(favoritesCities);
    renderFavorites(favoritesCities);
};

// Поиск города из избранного
function findFromFavorite(elem) {
    let city = elem;
    getWeather(city);
};

// Отрисовка вкладки DETAILS
function renderDetails(data) {
    while(UI_ELEMENTS.TAB_DETAILS.firstChild){
        UI_ELEMENTS.TAB_DETAILS.removeChild(UI_ELEMENTS.TAB_DETAILS.firstChild);
    };

    const dateInMsSunrise = data.sys.sunrise * 1000;
    const hoursSunrise = new Date(dateInMsSunrise).getHours();
    const minutesSunrise = new Date(dateInMsSunrise).getMinutes();
    const dateInMsSunset = data.sys.sunset * 1000;
    const hoursSunset = new Date(dateInMsSunset).getHours();
    const minutesSunset = new Date(dateInMsSunset).getMinutes();

    const arrData = [
        `Температура: ${Math.round(data.main.temp)}°`,
        `По ощущениям: ${Math.round(data.main.feels_like)}°`,
        `Погода: ${data.weather[0].description}`,
        `Восход: ${hoursSunrise}:${minutesSunrise}`,
        `Закат: ${hoursSunset}:${minutesSunset}`,
    ];

    const p = document.createElement('p');
    p.classList.add('tab-details__city');
    p.textContent = data.name;
    UI_ELEMENTS.TAB_DETAILS.appendChild(p);

    const ul = document.createElement('ul');
    ul.classList.add('tab-details__list');
    
    for (const item of arrData) {
        const li = document.createElement('li');
        li.classList.add('tab-details__item');
        li.textContent = item;
        ul.appendChild(li);
    }

    UI_ELEMENTS.TAB_DETAILS.appendChild(ul);
};

function renderForecast(data) {
    while(UI_ELEMENTS.TAB_FORECAST.firstChild){
        UI_ELEMENTS.TAB_FORECAST.removeChild(
            UI_ELEMENTS.TAB_FORECAST.firstChild
            );
    };

    const monthes = ['дек','янв','фев','марта',
                     'апр','мая','июня',
                     'июля','авг','сент',
                     'окт','нояб'];

    const dataForecast = data.list;

    const p = document.createElement('p');
    p.classList.add('tab-forecast__city');
    p.textContent = data.city.name;
    UI_ELEMENTS.TAB_FORECAST.appendChild(p);

    for (let i = 0; i <= 10; i++) {
        let month = format(new Date(dataForecast[i].dt * 1000), 'MMM');
        let day = format(new Date(dataForecast[i].dt * 1000), 'dd');
        // let month = dataForecast[i].dt_txt.slice(5, 7);
        let temp = Math.round(dataForecast[i].main.temp);
        let tempFillsLike = Math.round(dataForecast[i].main.feels_like);

        const div = document.createElement('div');
        div.classList.add('tab-forecast__block');

        const p1 = document.createElement('p');
        p1.classList.add('tab-forecast__date');
        p1.textContent = `${day} ${month}`;
        div.appendChild(p1);

        const p2 = document.createElement('p');
        p2.classList.add('tab-forecast__time');
        p2.textContent = dataForecast[i].dt_txt.slice(11, 16);
        div.appendChild(p2);

        const p3 = document.createElement('p');
        p3.classList.add('tab-forecast__tesperature');
        p3.textContent = `Темп-ра: ${temp}°`;
        div.appendChild(p3);

        const p4 = document.createElement('p');
        p4.classList.add('tab-forecast__feels-like');
        p4.textContent = `Ощущ. как: ${tempFillsLike}°`;
        div.appendChild(p4);

        const p5 = document.createElement('p');
        p5.classList.add('tab-forecast__weather');
        p5.textContent = dataForecast[i].weather[0].description;
        div.appendChild(p5);

        const img = document.createElement('img');
        img.classList.add('tab-forecast__icon');
        img.alt="icon weather";
        img.src = '/img/icon-rain.svg'; // Нужно заменить иконку
        div.appendChild(img);

        UI_ELEMENTS.TAB_FORECAST.appendChild(div);
    };
};