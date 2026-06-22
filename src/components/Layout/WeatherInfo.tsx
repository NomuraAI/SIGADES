import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, Wind, Edit2, Check, X } from 'lucide-react';

const WeatherInfo: React.FC = () => {
  const [weather, setWeather] = useState({ temp: '--', city: 'Memuat...', code: '⛅' });
  const [isEditing, setIsEditing] = useState(false);
  const [manualLocation, setManualLocation] = useState('');

  const fetchWeather = async (lat: number, lng: number, cityName?: string) => {
    try {
      let displayCity = cityName || 'Lombok Barat';
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
      const data = await response.json();
      const weatherCode = data.current_weather.weathercode;
      
      let icon = '⛅';
      if (weatherCode === 0) icon = '☀️';
      else if (weatherCode >= 1 && weatherCode <= 3) icon = '⛅';
      else if (weatherCode >= 45 && weatherCode <= 48) icon = '🌫️';
      else if (weatherCode >= 51 && weatherCode <= 67) icon = '🌧️';
      else if (weatherCode >= 71) icon = '❄️';
      else if (weatherCode >= 95) icon = '⚡';

      setWeather({
        temp: Math.round(data.current_weather.temperature).toString(),
        city: displayCity,
        code: icon
      });
    } catch (error) {
      console.error("Weather error:", error);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('user_weather_location');
    if (saved) {
      const { lat, lng, city } = JSON.parse(saved);
      fetchWeather(lat, lng, city);
    } else {
      fetchWeather(-8.6756, 116.1157, 'Gerung, Lobar');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLocation.trim()) return;
    try {
      setWeather(prev => ({ ...prev, city: 'Mencari...' }));
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(manualLocation)}&count=1&language=id&format=json`);
      const data = await response.json();
      if (data.results?.[0]) {
        const { latitude, longitude, name } = data.results[0];
        localStorage.setItem('user_weather_location', JSON.stringify({ lat: latitude, lng: longitude, city: name }));
        fetchWeather(latitude, longitude, name);
        setIsEditing(false);
      }
    } catch (err) {
      alert('Gagal mencari lokasi');
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white/10 border border-white/10 rounded-full ">
      <div className="text-xl">{weather.code}</div>
      <div className="flex flex-col">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-1">
            <input
              autoFocus
              type="text"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              className="bg-transparent text-white text-[10px] rounded px-2 py-0.5 border border-white/20 focus:outline-none w-24"
              placeholder="Kota..."
            />
            <button type="submit" className="text-emerald-400 hover:text-emerald-300"><Check size={12}/></button>
            <button type="button" onClick={() => setIsEditing(false)} className="text-rose-400 hover:text-rose-300"><X size={12}/></button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">{weather.temp}°C</span>
            <span className="text-[10px] text-white/60 tracking-wider uppercase truncate max-w-[80px]">{weather.city}</span>
            <button onClick={() => { setManualLocation(weather.city); setIsEditing(true); }} className="text-white/20 hover:text-white transition-colors">
              <Edit2 size={10} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherInfo;
