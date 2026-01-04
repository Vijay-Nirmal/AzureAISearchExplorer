import { useEffect, useState } from 'react';
import './App.css';

interface WeatherForecast {
  date: string;
  temperatureC: number;
  temperatureF: number;
  summary: string;
}

function App() {
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:5000/weatherforecast')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setForecasts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container">
      <h1>Azure AI Search Explorer</h1>
      <h2>Backend Integration Test</h2>
      
      {loading && <p>Loading backend data...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {!loading && !error && (
        <div className="grid">
          {forecasts.map((forecast, index) => (
            <div key={index} className="card">
              <h3>{forecast.date}</h3>
              <p>Temp: {forecast.temperatureC}°C / {forecast.temperatureF}°F</p>
              <p>Summary: {forecast.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
