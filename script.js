/* ==========================================
   AeroSky JavaScript Application Controller
   Sleek Weather Fetching, SVG Icons & LocalStorage
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
  // --- UI Elements State Variables ---
  let apiKey = localStorage.getItem("aerosky_api_key") || "";
  let tempUnit = localStorage.getItem("aerosky_temp_unit") || "metric"; // 'metric' = °C, 'imperial' = °F
  let currentCity = localStorage.getItem("aerosky_current_city") || "London";
  let searchHistory = JSON.parse(localStorage.getItem("aerosky_history")) || [];

  // --- DOM Selectors ---
  const appBody = document.body;
  const themeToggleBtn = document.getElementById("theme-toggle");
  const unitToggleBtn = document.getElementById("unit-toggle");
  const unitToggleText = unitToggleBtn.querySelector(".unit-text");
  const settingsBtn = document.getElementById("settings-btn");
  
  // Search DOM
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const geoBtn = document.getElementById("geo-btn");
  const validationMsg = document.getElementById("search-validation-msg");
  
  // History DOM
  const historyCard = document.getElementById("history-card");
  const historyList = document.getElementById("history-list");
  const clearHistoryBtn = document.getElementById("clear-history-btn");

  // Layout Display Sections
  const loadingOverlay = document.getElementById("loading-overlay");
  const errorCard = document.getElementById("error-card");
  const errorTitle = document.getElementById("error-title");
  const errorMessage = document.getElementById("error-message");
  const errorActionBtn = document.getElementById("error-action-btn");
  const apiAlertCard = document.getElementById("api-alert");
  const setupApiBtn = document.getElementById("setup-api-btn");
  const weatherDashboard = document.getElementById("weather-dashboard");

  // Dashboard Data Fields
  const cityNameEl = document.getElementById("city-name");
  const currentDateEl = document.getElementById("current-date");
  const weatherDescEl = document.getElementById("weather-desc");
  const tempValEl = document.getElementById("temp-val");
  const weatherIconContainer = document.getElementById("weather-icon-container");

  // Detailed Stats Fields
  const feelsLikeEl = document.getElementById("feels-like-val");
  const humidityEl = document.getElementById("humidity-val");
  const windEl = document.getElementById("wind-val");
  const pressureEl = document.getElementById("pressure-val");
  const visibilityEl = document.getElementById("visibility-val");
  const windDirEl = document.getElementById("wind-dir-val");

  // Forecast DOM
  const forecastList = document.getElementById("forecast-list");

  // Modal DOM
  const settingsModal = document.getElementById("settings-modal");
  const modalCloseBtn = document.getElementById("modal-close");
  const modalCancelBtn = document.getElementById("modal-cancel-btn");
  const modalSaveBtn = document.getElementById("modal-save-btn");
  const apiKeyInput = document.getElementById("api-key-input");
  const toggleKeyVisBtn = document.getElementById("toggle-key-visibility");
  const settingsForm = document.getElementById("settings-form");

  // --- Initializer Function ---
  function init() {
    // 1. Dark/Light Theme Initialization
    const savedTheme = localStorage.getItem("aerosky_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeToggleIcon(savedTheme);

    // 2. Unit Configuration
    unitToggleText.textContent = tempUnit === "metric" ? "°C" : "°F";

    // 3. Render Search History
    renderSearchHistory();

    // 4. API Key Verification
    if (!apiKey) {
      showAPIAlert();
    } else {
      fetchWeather(currentCity);
    }
  }

  // --- API / Fetch Weather Logic ---
  async function fetchWeather(query, isCoords = false) {
    if (!apiKey) {
      showAPIAlert();
      return;
    }

    showLoader();
    hideErrors();

    let weatherUrl = "";
    let forecastUrl = "";

    if (isCoords) {
      const { lat, lon } = query;
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${tempUnit}`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${tempUnit}`;
    } else {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${apiKey}&units=${tempUnit}`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(query)}&appid=${apiKey}&units=${tempUnit}`;
    }

    try {
      // Parallel requests for optimal speeds
      const [weatherRes, forecastRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(forecastUrl)
      ]);

      if (!weatherRes.ok) {
        if (weatherRes.status === 401) {
          throw new Error("unauthorized");
        } else if (weatherRes.status === 404) {
          throw new Error("not_found");
        } else {
          throw new Error("generic_api_error");
        }
      }

      const weatherData = await weatherRes.json();
      const forecastData = await forecastRes.json();

      updateWeatherUI(weatherData, forecastData);
      
      // Save searched city to cache
      if (!isCoords) {
        addToHistory(weatherData.name);
      }
      currentCity = weatherData.name;
      localStorage.setItem("aerosky_current_city", currentCity);

    } catch (err) {
      handleFetchError(err);
    } finally {
      hideLoader();
    }
  }

  // --- Handle Fetch Errors ---
  function handleFetchError(err) {
    console.error("Weather error context: ", err);
    weatherDashboard.classList.add("hidden");
    
    if (err.message === "unauthorized") {
      errorTitle.textContent = "Invalid API Key";
      errorMessage.textContent = "The API key configured is unauthorized or has expired. Please check your OpenWeatherMap key in settings.";
      errorActionBtn.textContent = "Open Settings";
      errorActionBtn.onclick = () => openSettingsModal();
      errorCard.classList.remove("hidden");
    } else if (err.message === "not_found") {
      errorTitle.textContent = "City Not Found";
      errorMessage.textContent = "We could not find the specified location. Please verify the city spelling and try again.";
      errorActionBtn.textContent = "Try Again";
      errorActionBtn.onclick = () => {
        hideErrors();
        searchInput.focus();
      };
      errorCard.classList.remove("hidden");
    } else {
      errorTitle.textContent = "Network Error";
      errorMessage.textContent = "Failed to fetch weather data. Check your internet connection or try again later.";
      errorActionBtn.textContent = "Reload App";
      errorActionBtn.onclick = () => window.location.reload();
      errorCard.classList.remove("hidden");
    }
  }

  // --- UI Layout Updates ---
  function updateWeatherUI(current, forecast) {
    // 1. Reveal Dashboard
    weatherDashboard.classList.remove("hidden");
    hideErrors();

    // 2. City Name & Date
    cityNameEl.textContent = `${current.name}, ${current.sys.country}`;
    currentDateEl.textContent = formatDate(current.dt);
    
    // 3. Condition Text
    weatherDescEl.textContent = current.weather[0].description;

    // 4. Main Temp
    tempValEl.textContent = Math.round(current.main.temp);

    // 5. Dynamic Theme Background according to Weather ID
    const weatherId = current.weather[0].id;
    const isDay = current.weather[0].icon.includes("d");
    applyDynamicTheme(weatherId, isDay);

    // 6. Large Premium SVG Icon Injected
    const iconCode = current.weather[0].icon;
    weatherIconContainer.innerHTML = getWeatherSVG(iconCode, 140);

    // 7. Details Cards Mapping
    const speedUnit = tempUnit === "metric" ? "m/s" : "mph";
    feelsLikeEl.textContent = `${Math.round(current.main.feels_like)}°`;
    humidityEl.textContent = `${current.main.humidity}%`;
    windEl.textContent = `${current.wind.speed} ${speedUnit}`;
    pressureEl.textContent = `${current.main.pressure} hPa`;
    
    // Convert visibility (meters to km)
    const visibilityKm = (current.visibility / 1000).toFixed(1);
    visibilityEl.textContent = `${visibilityKm} km`;
    
    // Wind Direction Compass Arrow
    const windDeg = current.wind.deg;
    windDirEl.innerHTML = `<span style="display:inline-block; transform: rotate(${windDeg}deg); transition: transform 0.8s; margin-right:5px;"><i class="fas fa-arrow-up"></i></span> ${getWindDirection(windDeg)}`;

    // 8. 5-Day Forecast Grid Compilation
    renderForecast(forecast.list);
  }

  // --- 5-Day Forecast Filtering & Rendering ---
  function renderForecast(list) {
    forecastList.innerHTML = "";

    // We filter list down to entries nearest 12:00 PM (noon) to display one representative slot per day
    const dailyForecasts = list.filter(item => item.dt_txt.includes("12:00:00"));

    // If API response has less than 5 days or is skewed (e.g. searching late at night), fill up using next items
    let displayList = dailyForecasts;
    if (dailyForecasts.length < 5) {
      displayList = [];
      for (let i = 0; i < list.length; i += 8) {
        if (displayList.length < 5) {
          displayList.push(list[i]);
        }
      }
    }

    displayList.forEach(day => {
      const dateObj = new Date(day.dt * 1000);
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
      const dayDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      const forecastItem = document.createElement("div");
      forecastItem.className = "forecast-item";

      const maxTemp = Math.round(day.main.temp_max);
      const minTemp = Math.round(day.main.temp_min);
      const iconCode = day.weather[0].icon;
      const desc = day.weather[0].description;

      forecastItem.innerHTML = `
        <span class="forecast-day">${dayName}</span>
        <span class="forecast-date">${dayDate}</span>
        <div class="forecast-icon">${getWeatherSVG(iconCode, 42)}</div>
        <span class="forecast-desc">${desc}</span>
        <div class="forecast-temps">
          <span class="forecast-temp-max">${maxTemp}°</span>
          <span class="forecast-temp-min">${minTemp}°</span>
        </div>
      `;
      forecastList.appendChild(forecastItem);
    });
  }

  // --- Dynamic Theme Background Manager ---
  function applyDynamicTheme(weatherId, isDay) {
    // Clear existing themes
    appBody.className = "";

    if (weatherId >= 200 && weatherId < 300) {
      appBody.classList.add("thunder-theme");
    } else if ((weatherId >= 300 && weatherId < 400) || (weatherId >= 500 && weatherId < 600)) {
      appBody.classList.add("rainy-theme");
    } else if (weatherId >= 600 && weatherId < 700) {
      appBody.classList.add("snowy-theme");
    } else if (weatherId >= 700 && weatherId < 800) {
      appBody.classList.add("cloudy-theme");
    } else if (weatherId === 800) {
      if (isDay) {
        appBody.classList.add("sunny-theme");
      } else {
        appBody.classList.add("default-theme");
      }
    } else if (weatherId > 800) {
      appBody.classList.add("cloudy-theme");
    } else {
      appBody.classList.add("default-theme");
    }
  }

  // --- Dynamic Premium Animated SVG Generator ---
  function getWeatherSVG(iconCode, size) {
    // Weather Icon mapping dictionary
    const strokeWidth = 2.5;

    // 1. Clear sky (Day)
    if (iconCode === "01d") {
      return `
        <svg viewBox="0 0 64 64" width="${size}" height="${size}">
          <defs>
            <linearGradient id="sun-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFEB3B" />
              <stop offset="100%" stop-color="#FF9800" />
            </linearGradient>
          </defs>
          <g class="anim-sun" style="transform-origin: 32px 32px; animation: rotateSun 20s linear infinite;">
            <circle cx="32" cy="32" r="13" fill="url(#sun-grad-main)" />
            <!-- Ray lines -->
            <path d="M32 6v6M32 46v6M14 32H8M56 32h-6M19 19l4.5 4.5M40.5 40.5L45 45M19 45l4.5-4.5M40.5 23.5L45 19" 
                  stroke="#FF9800" stroke-width="${strokeWidth}" stroke-linecap="round" />
          </g>
        </svg>
      `;
    }

    // 2. Clear sky (Night)
    if (iconCode === "01n") {
      return `
        <svg viewBox="0 0 64 64" width="${size}" height="${size}">
          <defs>
            <linearGradient id="moon-grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ECEFF1" />
              <stop offset="100%" stop-color="#B0BEC5" />
            </linearGradient>
          </defs>
          <path d="M41.5 35.8A17 17 0 1 1 28.2 22.5c.8 0 1.6.1 2.4.3a17 17 0 0 0 10.6 12.7c.1.1.2.2.3.3z" 
                fill="url(#moon-grad-main)" stroke="#90A4AE" stroke-width="1" style="animation: floatCloud 6s ease-in-out infinite alternate;" />
        </svg>
      `;
    }

    // 3. Clouds & Scattered (Day: 02d, 03d, 04d)
    if (iconCode.endsWith("d") && (iconCode === "02d" || iconCode === "03d" || iconCode === "04d")) {
      return `
        <svg viewBox="0 0 64 64" width="${size}" height="${size}">
          <defs>
            <linearGradient id="sun-behind" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFEB3B" />
              <stop offset="100%" stop-color="#FF9800" />
            </linearGradient>
            <linearGradient id="cloud-front" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFFFFF" />
              <stop offset="100%" stop-color="#ECEFF1" />
            </linearGradient>
          </defs>
          <!-- Rotating sun partially behind -->
          <g style="transform-origin: 38px 24px; animation: rotateSun 25s linear infinite;">
            <circle cx="38" cy="24" r="10" fill="url(#sun-behind)" />
            <path d="M38 10v3M38 35v3M24 24h3M49 24h3M28 14l2 2M44 30l2 2M28 34l2-2M44 14l2 2" stroke="#FF9800" stroke-width="2" stroke-linecap="round" />
          </g>
          <!-- Front cloud -->
          <path d="M20 46h24a12 12 0 0 0 0-24 11.9 11.9 0 0 0-4.5.9A16 16 0 0 0 8 34a12 12 0 0 0 12 12z" 
                fill="url(#cloud-front)" stroke="#CFD8DC" stroke-width="1" style="animation: floatCloud 4.5s ease-in-out infinite alternate;" />
        </svg>
      `;
    }

    // 4. Clouds & Scattered (Night: 02n, 03n, 04n)
    if (iconCode.endsWith("n") && (iconCode === "02n" || iconCode === "03n" || iconCode === "04n")) {
      return `
        <svg viewBox="0 0 64 64" width="${size}" height="${size}">
          <defs>
            <linearGradient id="cloud-front-n" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#CFD8DC" />
              <stop offset="100%" stop-color="#90A4AE" />
            </linearGradient>
            <linearGradient id="moon-behind" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ECEFF1" />
              <stop offset="100%" stop-color="#78909C" />
            </linearGradient>
          </defs>
          <path d="M36 28.5A12 12 0 1 1 26.6 19c.6 0 1.1.1 1.7.2a12 12 0 0 0 7.5 9c.1.1.1.2.2.3z" 
                fill="url(#moon-behind)" style="animation: floatCloud 6s ease-in-out infinite alternate; animation-delay: -1s;" />
          <path d="M18 44h22a10 10 0 0 0 0-20 9.9 9.9 0 0 0-3.8.8A14 14 0 0 0 8 34a10 10 0 0 0 10 10z" 
                fill="url(#cloud-front-n)" stroke="#78909C" stroke-width="1" style="animation: floatCloud 4s ease-in-out infinite alternate;" />
        </svg>
      `;
    }

    // 5. Rain/Shower (09d, 09n, 10d, 10n)
    if (iconCode.startsWith("09") || iconCode.startsWith("10")) {
      return `
        <svg viewBox="0 0 64 64" width="${size}" height="${size}">
          <defs>
            <linearGradient id="rain-cloud" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#B0BEC5" />
              <stop offset="100%" stop-color="#546E7A" />
            </linearGradient>
          </defs>
          <path d="M18 42h22a10 10 0 0 0 0-20 9.9 9.9 0 0 0-3.8.8A14 14 0 0 0 8 32a10 10 0 0 0 10 10z" 
                fill="url(#rain-cloud)" style="animation: floatCloud 5s ease-in-out infinite alternate;" />
          <!-- Animated raindrops -->
          <line x1="16" y1="45" x2="13" y2="52" stroke="#29B6F6" stroke-width="2.5" stroke-linecap="round" style="animation: rainDrop 1.2s linear infinite;" />
          <line x1="26" y1="45" x2="23" y2="52" stroke="#29B6F6" stroke-width="2.5" stroke-linecap="round" style="animation: rainDrop 1.2s linear infinite; animation-delay: 0.4s;" />
          <line x1="36" y1="45" x2="33" y2="52" stroke="#29B6F6" stroke-width="2.5" stroke-linecap="round" style="animation: rainDrop 1.2s linear infinite; animation-delay: 0.8s;" />
        </svg>
      `;
    }

    // 6. Thunderstorm (11d, 11n)
    if (iconCode.startsWith("11")) {
      return `
        <svg viewBox="0 0 64 64" width="${size}" height="${size}">
          <defs>
            <linearGradient id="thunder-cloud" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#78909C" />
              <stop offset="100%" stop-color="#37474F" />
            </linearGradient>
          </defs>
          <path d="M18 40h22a10 10 0 0 0 0-20 9.9 9.9 0 0 0-3.8.8A14 14 0 0 0 8 30a10 10 0 0 0 10 10z" 
                fill="url(#thunder-cloud)" />
          <!-- Lightning bolt animation -->
          <polygon points="26,42 20,50 28,50 23,60 35,46 27,46" fill="#FFCA28" style="animation: flashLightning 1.5s ease-in-out infinite;" />
        </svg>
      `;
    }

    // 7. Snow (13d, 13n)
    if (iconCode.startsWith("13")) {
      return `
        <svg viewBox="0 0 64 64" width="${size}" height="${size}">
          <defs>
            <linearGradient id="snow-cloud" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ECEFF1" />
              <stop offset="100%" stop-color="#90A4AE" />
            </linearGradient>
          </defs>
          <path d="M18 40h22a10 10 0 0 0 0-20 9.9 9.9 0 0 0-3.8.8A14 14 0 0 0 8 30a10 10 0 0 0 10 10z" 
                fill="url(#snow-cloud)" />
          <!-- Animated snowflakes -->
          <g fill="#E0F7FA" style="animation: rainDrop 2s linear infinite;">
            <circle cx="16" cy="44" r="2" />
            <circle cx="26" cy="46" r="2" />
            <circle cx="36" cy="44" r="2" />
          </g>
          <g fill="#E0F7FA" style="animation: rainDrop 2s linear infinite; animation-delay: 1s;">
            <circle cx="12" cy="45" r="1.5" />
            <circle cx="21" cy="47" r="1.5" />
            <circle cx="31" cy="45" r="1.5" />
          </g>
        </svg>
      `;
    }

    // 8. Atmosphere/Mist (50d, 50n)
    if (iconCode.startsWith("50")) {
      return `
        <svg viewBox="0 0 64 64" width="${size}" height="${size}">
          <g stroke="#B0BEC5" stroke-width="3" stroke-linecap="round" style="animation: floatCloud 5s ease-in-out infinite alternate;">
            <line x1="16" y1="20" x2="48" y2="20" />
            <line x1="10" y1="28" x2="54" y2="28" style="animation-delay: -0.5s;" stroke-width="2.5" />
            <line x1="20" y1="36" x2="44" y2="36" style="animation-delay: -1s;" />
            <line x1="14" y1="44" x2="50" y2="44" style="animation-delay: -1.5s;" stroke-width="2" />
          </g>
        </svg>
      `;
    }

    // Fallback default OpenWeather image if code unrecognized
    return `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="weather condition" class="fallback-weather-img" style="width: 100%; height: 100%; object-fit: contain;">`;
  }

  // --- Helper UI Utilities ---
  function formatDate(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString("en-US", options);
  }

  function getWindDirection(deg) {
    const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const val = Math.floor((deg / 22.5) + 0.5);
    return directions[val % 16];
  }

  function showLoader() {
    loadingOverlay.classList.remove("hidden");
  }
  function hideLoader() {
    loadingOverlay.classList.add("hidden");
  }

  function hideErrors() {
    errorCard.classList.add("hidden");
    apiAlertCard.classList.add("hidden");
  }

  function showAPIAlert() {
    weatherDashboard.classList.add("hidden");
    hideLoader();
    apiAlertCard.classList.remove("hidden");
  }

  // --- Search History Cache Management ---
  function addToHistory(city) {
    const normalized = city.trim();
    if (!normalized) return;

    // Filter duplicates case-insensitively
    searchHistory = searchHistory.filter(item => item.toLowerCase() !== normalized.toLowerCase());
    
    // Add to top
    searchHistory.unshift(normalized);
    
    // Cap at 6 searches
    if (searchHistory.length > 6) {
      searchHistory.pop();
    }

    localStorage.setItem("aerosky_history", JSON.stringify(searchHistory));
    renderSearchHistory();
  }

  function deleteHistoryItem(city, e) {
    e.stopPropagation(); // Avoid triggering city search
    searchHistory = searchHistory.filter(item => item !== city);
    localStorage.setItem("aerosky_history", JSON.stringify(searchHistory));
    renderSearchHistory();
  }

  function renderSearchHistory() {
    historyList.innerHTML = "";

    if (searchHistory.length === 0) {
      historyCard.style.display = "none";
      return;
    }

    historyCard.style.display = "block";
    
    searchHistory.forEach(city => {
      const li = document.createElement("li");
      li.className = "history-item";
      li.innerHTML = `
        <div class="history-city-info">
          <span class="history-city-name">${city}</span>
        </div>
        <div class="history-item-right">
          <button class="history-del-btn" aria-label="Delete history item">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;

      li.onclick = () => {
        searchInput.value = city;
        fetchWeather(city);
      };

      const delBtn = li.querySelector(".history-del-btn");
      delBtn.onclick = (e) => deleteHistoryItem(city, e);

      historyList.appendChild(li);
    });
  }

  // --- Modal Event Listeners & Functions ---
  function openSettingsModal() {
    apiKeyInput.value = apiKey;
    settingsModal.classList.remove("hidden");
    apiKeyInput.focus();
  }

  function closeSettingsModal() {
    settingsModal.classList.add("hidden");
    apiKeyInput.type = "password";
    toggleKeyVisBtn.querySelector("i").className = "fas fa-eye-slash";
  }

  function saveSettings() {
    const keyVal = apiKeyInput.value.trim();
    if (!keyVal) {
      alert("API Key cannot be empty. Please input a valid key.");
      return;
    }
    apiKey = keyVal;
    localStorage.setItem("aerosky_api_key", apiKey);
    closeSettingsModal();
    init(); // Reinitialize with new key
  }

  // --- Event Listeners binding ---
  
  // Search submit trigger
  searchForm.addEventListener("submit", () => {
    const inputVal = searchInput.value.trim();
    if (!inputVal) {
      validationMsg.style.display = "block";
      searchInput.classList.add("invalid-animation");
      setTimeout(() => {
        searchInput.classList.remove("invalid-animation");
      }, 500);
      return;
    }
    
    validationMsg.style.display = "none";
    fetchWeather(inputVal);
  });

  // Remove validation msg on type
  searchInput.addEventListener("input", () => {
    if (searchInput.value.trim()) {
      validationMsg.style.display = "none";
    }
  });

  // Settings triggers
  settingsBtn.addEventListener("click", openSettingsModal);
  modalCloseBtn.addEventListener("click", closeSettingsModal);
  modalCancelBtn.addEventListener("click", closeSettingsModal);
  setupApiBtn.addEventListener("click", openSettingsModal);
  
  settingsForm.addEventListener("submit", saveSettings);
  modalSaveBtn.addEventListener("click", saveSettings);

  // Toggle API Key visibility in modal
  toggleKeyVisBtn.addEventListener("click", () => {
    const type = apiKeyInput.type === "password" ? "text" : "password";
    apiKeyInput.type = type;
    toggleKeyVisBtn.querySelector("i").className = type === "password" ? "fas fa-eye-slash" : "fas fa-eye";
  });

  // Modal dismiss on overlay click
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) {
      closeSettingsModal();
    }
  });

  // Units Toggle (°C / °F)
  unitToggleBtn.addEventListener("click", () => {
    tempUnit = tempUnit === "metric" ? "imperial" : "metric";
    localStorage.setItem("aerosky_temp_unit", tempUnit);
    unitToggleText.textContent = tempUnit === "metric" ? "°C" : "°F";
    fetchWeather(currentCity);
  });

  // Light/Dark Theme toggle trigger
  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("aerosky_theme", nextTheme);
    updateThemeToggleIcon(nextTheme);
  });

  function updateThemeToggleIcon(theme) {
    const icon = themeToggleBtn.querySelector("i");
    if (theme === "dark") {
      icon.className = "fas fa-sun";
      themeToggleBtn.title = "Toggle Light Mode";
    } else {
      icon.className = "fas fa-moon";
      themeToggleBtn.title = "Toggle Dark Mode";
    }
  }

  // Geolocation trigger
  geoBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    showLoader();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        fetchWeather(coords, true);
      },
      (error) => {
        console.warn("Geolocation warning code: ", error.code);
        hideLoader();
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("Location access was denied. Please search manually or enable permissions.");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("Location information is currently unavailable.");
            break;
          case error.TIMEOUT:
            alert("The request to get your location timed out.");
            break;
          default:
            alert("An unknown error occurred while retrieving location.");
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });

  // Run Setup
  init();
});
