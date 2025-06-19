const cityInput = document.querySelector('.city-input')
const searchBtn = document.querySelector('.search-btn')

const weatherInfoSection = document.querySelector('.weather-info')
const notFoundSection = document.querySelector('.not-found')
const searchCitySection = document.querySelector('.search-city')

const countryTxt = document.querySelector('.country-txt')
const tempTxt = document.querySelector('.temp-txt')
const conditionTxt = document.querySelector('.condition-txt')
const humidityTxt = document.querySelector('.humidity-value-txt')
const windValueTxt = document.querySelector('.wind-value-txt')
const weatherSummaryImg = document.querySelector('.weather-summary-img')
const currentDateTxt = document.querySelector('.current-date-txt')

const forecastItemsContainer = document.querySelector('.forecast-items-container')

searchBtn.addEventListener('click', () => {
    if (cityInput.value.trim() != '') {
        updateWeatherInfo(cityInput.value)
        cityInput.value = ''
        cityInput.blur()
    }
})
cityInput.addEventListener('keydown', (event) => {
    if(event.key == 'Enter' && cityInput.value.trim() != '') {
        updateWeatherInfo(cityInput.value)
        cityInput.value = ''
        cityInput.blur()
    }
})

function getWeatherIcon(id) {
    if (id <= 232) return 'thunderstorm.svg'
    if (id <= 321) return 'drizzle.svg'
    if (id <= 531) return 'rain.svg'
    if (id <= 622) return 'snow.svg'
    if (id <= 781) return 'atmosphere.svg'
    if (id <= 800) return 'clear.svg'
    else return 'clouds.svg'
}

function getCurrentDate() {
    const currentDate = new Date()
    const options = {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    }
    
    return currentDate.toLocaleDateString('en-GB', options)
}

async function getFetchData(endpoint, city, date = null) {
    let url = `/api/${endpoint}?city=${encodeURIComponent(city)}`;
    if (date) url += `&date=${date}`;

    const response = await fetch(url);

    return response.json();
}

async function updateWeatherInfo(city) {
    const today = new Date().toISOString().split('T')[0]
    const weatherData = await getFetchData('weather', city, today)

    if (!weatherData || weatherData.error) {
        showDisplaySection(notFoundSection)
        return
    }

    const { temperature, mainStatus, icon, humidity, windSpeed, id } = weatherData;

    countryTxt.textContent = city
    tempTxt.textContent = Math.round(temperature) + ' °C'
    conditionTxt.textContent = mainStatus
    humidityTxt.textContent = humidity + '%'
    windValueTxt.textContent = windSpeed + ' M/s'

    currentDateTxt.textContent = getCurrentDate()

    weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`
    
    await updateForecastsInfo(city)
    showDisplaySection(weatherInfoSection)   
}

async function updateForecastsInfo(city) {
    const forecastsData = await getFetchData ('forecast', city)

    if (!forecastsData || !forecastsData.list) {
        console.error('Forecast data or list is missing:', forecastsData);
        return;
    }

    const todayDate = new Date().toISOString().split('T') [0]
    
    forecastItemsContainer.innerHTML = ''
    forecastsData.list.forEach(forecast => {
        if (forecast.date !== todayDate) {
            updateForecastItems(forecast);
        } 
    });
}

function updateForecastItems(weatherData) {
    console.log(weatherData)
    const { date, weatherId, temperature } = weatherData;

    const dateTaken = new Date(date)
    const dateOption = {
        day: '2-digit',
        month: 'short'
    }
    const dateResult = dateTaken.toLocaleDateString('en-US', dateOption)

    const forecastItem = `
        <div class="forecast-item">
            <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
            <img src="assets/weather/${getWeatherIcon(weatherId)}" class="forecast-item-img">
            <h5 class="forecast-item-temp">${Math.round(temperature)} °C</h5>
        </div>
    `

    forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItem)
}

function showDisplaySection(section) {
    [weatherInfoSection, searchCitySection, notFoundSection]
        .forEach(section => section.style.display = 'none')
    
    section.style.display = 'flex'
}