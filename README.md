# AeroSky - Weather Forecast App

AeroSky is a premium, fully responsive weather forecast web application featuring a stunning glassmorphic interface, smooth micro-animations, and dynamic backgrounds that adjust to weather conditions.

## 🌟 Features

1. **Sleek Glassmorphic Interface**: Premium frosted glass aesthetic with subtle hover-effects and slide-in animations.
2. **Current Weather Dashboard**: Details current temperature, conditions, and relative indexes:
   - Humidity
   - Wind speed and direction
   - "Feels like" temperature
   - Atmospheric pressure
   - Visibility range
3. **5-Day Extended Forecast**: Integrated day-by-day temperature highs/lows and weather condition summaries.
4. **Geolocation Support**: Instantly loads the weather for your current coordinates using the browser's Geolocation API.
5. **Interactive Search History**: Recovers and caches up to 6 of your most recent city searches using `localStorage`.
6. **Theme Customization**: Dark/Light mode toggle that respects user choices across page reloads.
7. **Dynamic Weather Themes**: Background shifts its gradients based on conditions (Sunny, Cloudy, Rainy, Snowy, or Thunderstorm).
8. **Responsive Design**: Fluidly adjusts down to 320px mobile screens up to wide desktop monitors.
9. **Interactive API Configuration**: Input and save API keys securely directly inside the application interface.

---

## 🛠️ Tech Stack

- **Markup**: HTML5
- **Styling**: CSS3 (Vanilla Custom Properties, Flexbox, Grid, Glassmorphic Backdrop-filters)
- **Logic**: Modern JavaScript (ES6+, Async/Await, Fetch API, LocalStorage, Geolocation)
- **Service**: OpenWeatherMap API (Current Weather and 5-Day/3-Hour Forecast data)

---

## 🚀 Setup & Installation

### 1. Get a Free OpenWeatherMap API Key
1. Go to the [OpenWeatherMap Website](https://openweathermap.org/).
2. Create a free account.
3. Once logged in, navigate to the **API keys** tab on your profile page.
4. Copy the auto-generated key (or generate a custom one).
   > [!NOTE]
   > New API keys can take up to 2 hours to activate on OpenWeatherMap's servers. If you get an unauthorized error initially, wait a while and try again.

### 2. Run the Application Locally
Since the application is built entirely using client-side vanilla web technologies, you can run it in multiple ways:

#### Option A: Run directly in browser
1. Extract or clone the project folder.
2. Double-click [index.html](file:///c:/Users/vignan/Desktop/jairam/weather-app/index.html) to open it in your web browser.

#### Option B: Run with Python Local Server (Recommended for Geolocation)
Some browsers restrict geolocation permissions on raw `file://` protocols. Running a local HTTP server bypasses this limitation.
1. Open a terminal/power-shell in the `weather-app` directory.
2. Execute the following command:
   ```bash
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your web browser.

#### Option C: VS Code Live Server
If you use VS Code, right-click `index.html` and select **Open with Live Server**.

### 3. Add Your API Key
- Upon loading the application, if no key is cached, you will see an **API Key Required** card.
- Click **Configure Key** (or the gear icon in the top header) to open the configuration panel.
- Paste your OpenWeatherMap key and click **Save Settings**.
- AeroSky will reload and fetch weather information automatically.

---

## 📁 Project Structure

```text
weather-app/
│
├── index.html       # Application Markup structure
├── style.css        # CSS stylesheets, themes and animations
├── script.js        # API fetches, DOM renders, and local storage bindings
└── README.md        # Setup guidelines & documentation
```
