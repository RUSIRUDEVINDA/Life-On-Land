import axios from 'axios';

/**
 * Fetches weather data from OpenWeather API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Weather data with risk multiplier
 */
export const getWeatherData = async (lat, lon) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.warn('OpenWeather API key not configured. Using default weather multiplier.');
      return { multiplier: 1.0, condition: 'UNKNOWN' };
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    
    const response = await axios.get(url, {
      timeout: 5000 // 5 second timeout
    });

    const weather = response.data;
    
    // Calculate weather-based risk multiplier
    // Factors: precipitation, visibility, wind speed, cloud cover
    let multiplier = 1.0;
    let condition = 'CLEAR';

    // Precipitation increases risk (harder to detect incidents)
    if (weather.rain) {
      const rainVolume = weather.rain['1h'] || weather.rain['3h'] || 0;
      multiplier += rainVolume * 0.1; // 0.1 per mm of rain
      condition = 'RAINY';
    }

    // Snow significantly increases risk
    if (weather.snow) {
      const snowVolume = weather.snow['1h'] || weather.snow['3h'] || 0;
      multiplier += snowVolume * 0.15;
      condition = 'SNOWY';
    }

    // Low visibility increases risk
    if (weather.visibility) {
      const visibilityKm = weather.visibility / 1000;
      if (visibilityKm < 1) {
        multiplier += 0.3;
        condition = 'FOGGY';
      } else if (visibilityKm < 5) {
        multiplier += 0.15;
      }
    }

    // High wind speed can affect monitoring
    if (weather.wind && weather.wind.speed) {
      const windSpeed = weather.wind.speed; // m/s
      if (windSpeed > 15) {
        multiplier += 0.1;
      }
    }

    // Cloud cover affects visibility
    if (weather.clouds && weather.clouds.all) {
      const cloudCover = weather.clouds.all; // percentage
      if (cloudCover > 80) {
        multiplier += 0.1;
      }
    }

    // Cap multiplier between 0.5 and 2.0
    multiplier = Math.max(0.5, Math.min(2.0, multiplier));

    return {
      multiplier,
      condition,
      temperature: weather.main?.temp,
      humidity: weather.main?.humidity,
      windSpeed: weather.wind?.speed,
      visibility: weather.visibility,
      cloudCover: weather.clouds?.all,
      description: weather.weather?.[0]?.description
    };
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    // Return default multiplier on error
    return { multiplier: 1.0, condition: 'UNKNOWN', error: error.message };
  }
};
