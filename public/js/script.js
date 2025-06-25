const cityInput = document.querySelector('.city-input');
const searchBtn = document.querySelector('.search-btn');

const weatherInfoSection = document.querySelector('.weather-info');
const notFoundSection = document.querySelector('.not-found');
const searchCitySection = document.querySelector('.search-city');

const countryTxt = document.querySelector('.country-txt');
const tempTxt = document.querySelector('.temp-txt');
const conditionTxt = document.querySelector('.condition-txt');
const humidityTxt = document.querySelector('.humidity-value-txt');
const windValueTxt = document.querySelector('.wind-value-txt');
const uvIndexTxt = document.querySelector('.uv-index-txt');
const precipitationTxt = document.querySelector('.precipitation-txt');
const sunriseTxt = document.querySelector('.sunrise-txt');
const sunsetTxt = document.querySelector('.sunset-txt');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-date-txt');

const forecastItemsContainer = document.querySelector('.forecast-items-container.side-forecast');
const tempChartCanvas = document.querySelector('.tempChart');

let tempChartInstance = null;

searchBtn.addEventListener('click', () => {
    if (cityInput.value.trim() != '') {
        updateWeatherInfo(cityInput.value);
        cityInput.value = '';
        cityInput.blur();
    }
});
cityInput.addEventListener('keydown', (event) => {
    if(event.key == 'Enter' && cityInput.value.trim() != '') {
        updateWeatherInfo(cityInput.value);
        cityInput.value = '';
        cityInput.blur();
    }
});

function getWeatherIcon(id) {
    if (id <= 232) return 'thunderstorm.webp';
    if (id <= 321) return 'drizzle.webp';
    if (id <= 531) return 'rain.webp';
    if (id <= 622) return 'snow.webp';
    if (id <= 781) return 'foggy.webp';
    if (id <= 800) return 'sun.webp';
    else return 'clouds.webp';
}

function getCurrentDate() {
    const currentDate = new Date();
    const options = {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    }
    
    return currentDate.toLocaleDateString('en-GB', options);
}

async function getFetchData(endpoint, city, date = null) {
    let url = `/api/${endpoint}?city=${encodeURIComponent(city)}`;
    if (date) url += `&date=${date}`;

    const response = await fetch(url);

    return response.json();
}

async function updateWeatherInfo(city) {
    const today = new Date().toISOString().split('T')[0];
    const weatherData = await getFetchData('weather', city, today);

    if (!weatherData || weatherData.error) {
        showDisplaySection(notFoundSection);
        return;
    }

    const { cityName, temperature, mainStatus, icon, humidity, windSpeed, id, uvIndex, sunrise, sunset, precipitation } = weatherData;

    countryTxt.textContent = cityName;
    tempTxt.textContent = Math.round(temperature) + ' °C';
    conditionTxt.textContent = mainStatus;
    humidityTxt.textContent = humidity + '%';
    windValueTxt.textContent = windSpeed + ' M/s';
    uvIndexTxt.textContent = uvIndex;
    precipitationTxt.textContent = precipitation*100 + '%';
    sunriseTxt.textContent = formatTime(sunrise);
    sunsetTxt.textContent = formatTime(sunset);

    currentDateTxt.textContent = getCurrentDate();

    weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`;
    
    await updateForecastsInfo(city);
    showDisplaySection(weatherInfoSection)  ; 
}

async function updateForecastsInfo(city) {
    const forecastsData = await getFetchData ('forecast', city);

    if (!forecastsData || !forecastsData.list) {
        console.error('Forecast data or list is missing:', forecastsData);
        return;
    }

    const todayDate = new Date().toISOString().split('T') [0];
    
    forecastItemsContainer.innerHTML = '';
    const weeklyTemps = [];
    const weeklyLabels = [];

    forecastsData.list.forEach(forecast => {
        if (forecast.date !== todayDate) {
            updateForecastItems(forecast);
        } 

        // Chart data
        weeklyLabels.push(formatDate(forecast.date));
        weeklyTemps.push(Math.round(forecast.temperature));
    });

    updateTempChart(weeklyLabels, weeklyTemps);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: 'short', day: '2-digit', month: 'short' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function updateTempChart(labels, data) {
    if (tempChartInstance) {
        tempChartInstance.destroy();
    }
    tempChartInstance = new Chart(tempChartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets:[{
                label: 'Temperature (°C)',
                data: data,
                fill: false,
                borderColor: 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                tension: 0.3,
                pointRadius: 5,
                pointHoverRadius: 7,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                },
                y: {
                    ticks: { color: 'white' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    beginAtZero: false
                }
            },
            plugins:  {
                legend: {
                    labels: {
                        color: 'white',
                        font: {size: 14, weight: 'bold'}
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: 'white',
                    bodyColor: 'white'
                }
            }
        }
    });
}

function updateForecastItems(weatherData) {
    console.log(weatherData);
    const { date, weatherId, temperature } = weatherData;

    const dateTaken = new Date(date)
    const dateOption = {
        day: '2-digit',
        month: 'short'
    }
    const dateResult = dateTaken.toLocaleDateString('en-US', dateOption);

    const forecastItem = `
        <div class="forecast-item">
            <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
            <img src="assets/weather/${getWeatherIcon(weatherId)}" class="forecast-item-img">
            <h5 class="forecast-item-temp">${Math.round(temperature)} °C</h5>
        </div>
    `;

    forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItem);
}

function showDisplaySection(section) {
    [weatherInfoSection, searchCitySection, notFoundSection]
        .forEach(section => section.style.display = 'none');
    
    section.style.display = 'flex';
}

// Show Default City
document.addEventListener("DOMContentLoaded", () => {
    if (typeof defaultCityName !== "undefined" && defaultCityName.trim() !== "") {
        const fallbackCity = "Istanbul";
        updateWeatherInfo(defaultCityName || fallbackCity);
    }
});
