import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=40.4862&longitude=-74.4518&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation&timezone=America%2FNew_York&wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=inch"
    )
      .then((response) => response.json())
      .then((data) => setWeather(data))
      .catch((error) => console.error("Error fetching weather data:", error));
  }, [setWeather]);

  return (
    <div>
      <h1>stock'd</h1>
      <p>your handy pantry tracker app!</p>
      <button>add your first item</button>
      



    </div>
  );
}

export default App;