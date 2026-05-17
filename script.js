// Speech Recognition Setup (Voice Input)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Speech Recognition is not supported in this browser.");
} 

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

recognition.onstart = function () {
    console.log("Listening for voice input...");
};

recognition.onresult = function (event) {
    const voiceInput = event.results[0][0].transcript.toLowerCase();  // Convert to lowercase for easier matching
    console.log("Voice Command:", voiceInput);

    // Handle voice commands for weather
    if (voiceInput.includes("weather") || voiceInput.includes("temperature")) {
        const city = extractCityFromCommand(voiceInput);  // Extract city name from the command
        if (city) {
            document.getElementById('city').value = city;  // Set city in input field
            getWeather();  // Fetch weather data
        } else {
            alert("City not recognized. Please try again.");
        }
    } else if (voiceInput.includes("refresh")) {
        getWeather();  // Refresh the weather data
    } else {
        alert("Sorry, I didn't understand that. Please try a weather-related command.");
    }
};

recognition.onerror = function(event) {
    console.error("Error occurred in recognition: " + event.error);
    alert("Error in voice recognition: " + event.error);
};

// Function to start voice recognition
function startVoiceRecognition() {
    recognition.start();  // Start voice recognition
}

// Helper function to extract city from voice command
function extractCityFromCommand(command) {
   const cityPattern = /in ([a-zA-Z\s]+)/; // Regex to extract city after the word "in"
    const match = command.match(cityPattern);
    return match ? match[1] : null;  // Return city name if found
}

// Fetch city suggestions from a real dynamic source or API (e.g., GeoNames API or OpenWeather API)
async function fetchCitySuggestions(query) {
    try {
        if (query.length === 0) {
            document.getElementById('suggestions-box').style.display = 'none';  // Hide suggestions if input is empty
            return;
        }

        const apiKey = 'f94599da010f124e24699133a289b1d4'; // Replace with your API key
        const url = `https://api.openweathermap.org/data/2.5/find?q=${query}&appid=${apiKey}&type=like&cnt=5`;  // OpenWeatherMap API example (you can use GeoNames or any other API)

        const response = await fetch(url);
        const data = await response.json();

        if (!data || !data.list) {
            console.log('No cities found');
            return;
        }

        const suggestions = data.list.map(city => ({ name: city.name }));

        // Filter suggestions based on the query entered
        const filteredSuggestions = suggestions.filter(city =>
            city.name.toLowerCase().startsWith(query.toLowerCase())
        );

        showCitySuggestions(filteredSuggestions);  // Show filtered suggestions
    } catch (error) {
        console.error('Error fetching city suggestions:', error);
    }
}

// Show city suggestions dynamically
function showCitySuggestions(suggestions) {
    const suggestionBox = document.getElementById('suggestions-box');
    suggestionBox.innerHTML = ''; // Clear previous suggestions

    suggestions.forEach(city => {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');
        suggestionItem.textContent = city.name; // Display city name
        suggestionItem.onclick = () => selectCitySuggestion(city.name); // Set city name on selection
        suggestionBox.appendChild(suggestionItem);
    });

    // Show the suggestion box if there are suggestions
    suggestionBox.style.display = suggestions.length > 0 ? 'block' : 'none';
}

// Set city value when a suggestion is selected
function selectCitySuggestion(cityName) {
    document.getElementById('city').value = cityName;
    document.getElementById('suggestions-box').style.display = 'none';  // Hide suggestions box
    getWeather();  // Fetch weather data
}

// Weather Fetching (using OpenWeatherMap API)
async function getWeather() {
    const city = document.getElementById('city').value.trim();
    if (!city) {
        alert("Please enter a city name");
        return;
    }

    const apiKey = 'f94599da010f124e24699133a289b1d4';  // Your API key here
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;  // Celsius unit
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;

    // Show loader and hide weather details while fetching data
    document.getElementById('loader').style.display = "block";
    document.getElementById('weather').style.display = 'none';

    try {
        // Fetch current weather data
        const currentWeatherResponse = await fetch(currentWeatherUrl);
        if (!currentWeatherResponse.ok) throw new Error("City not found");
        const currentWeatherData = await currentWeatherResponse.json();

        // Fetch forecast data (optional if forecast display is needed)
        const forecastResponse = await fetch(forecastUrl);
        if (!forecastResponse.ok) throw new Error("Forecast data not found");

        const forecastData = await forecastResponse.json();

        // Update weather and forecast details
        updateWeather(currentWeatherData);
        updateDatetime();
    } catch (error) {
        alert(error.message);
    } finally {
        // Hide loader once the fetch operation is complete
        document.getElementById('loader').style.display = "none";
    }
}

// Update Weather Details
function updateWeather(data) {
    const weather = data.weather[0];
    const temperature = Math.round(data.main.temp);  // Convert temperature to Celsius

    // Update the weather details in the HTML
    document.getElementById('weather').style.display = 'block';
    document.getElementById('city-name').innerText = data.name;
    document.getElementById('temp-value').innerText = `${temperature}°C`;
    document.getElementById('description').innerText = `Description: ${weather.description}`;
    document.getElementById('humidity-value').innerText = `${data.main.humidity}%`;
    document.getElementById('wind').innerText = `Wind Speed: ${data.wind.speed} m/s`;

    // Show the appropriate weather icon
    const weatherIcons = document.getElementById('weather-icon').children;
    for (let icon of weatherIcons) {
        icon.style.display = 'none';
    }

    if (weather.description.toLowerCase().includes("sun")) {
        document.querySelector(".fa-sun").style.display = "block";
    } else if (weather.description.toLowerCase().includes("cloud")) {
        document.querySelector(".fa-cloud").style.display = "block";
    } else if (weather.description.toLowerCase().includes("rain")) {
        document.querySelector(".fa-cloud-rain").style.display = "block";
    } else if (weather.description.toLowerCase().includes("snow")) {
        document.querySelector(".fa-snowflake").style.display = "block";
    } else if (weather.description.toLowerCase().includes("thunderstorm")) {
        document.querySelector(".fa-bolt").style.display = "block";
    } else if (weather.description.toLowerCase().includes("wind")) {
        document.querySelector(".fa-wind").style.display = "block";
    } else if (weather.description.toLowerCase().includes("clear") || weather.description.toLowerCase().includes("night")) {
        document.querySelector(".fa-moon").style.display = "block";
    }

    // Call the text-to-speech function to announce the weather information
    speakWeather(temperature, weather.description);
}

function speakWeather(temperature, description) {

    // Stop old speech
    window.speechSynthesis.cancel();

    const message =
        `The temperature is ${temperature} degrees Celsius and the weather is ${description}`;

    const speech = new SpeechSynthesisUtterance();

    speech.text = message;

    // Voice settings
    speech.lang = "en-US";
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 1;

    // Load available voices
    const voices = window.speechSynthesis.getVoices();

    if (voices.length > 0) {
        speech.voice = voices[0];
    }

    console.log("Speaking:", message);

    // Speak after slight delay
    setTimeout(() => {
        window.speechSynthesis.speak(speech);
    }, 500);
}

// Update Date and Time
function updateDatetime() {
    const now = new Date();
    document.getElementById('date-value').innerText = now.toLocaleDateString();
    document.getElementById('time-value').innerText = now.toLocaleTimeString();
    document.getElementById('year-value').innerText = now.getFullYear();
}