import React, { useState, useEffect } from 'react';
import { MapPin, Building2, Activity, MessageSquareWarning, Settings, X, Edit2, Check, Search, PieChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activeItem: string;
    setActiveItem: (item: string) => void;
    selectedVersion: string;
    availableVersions: string[];
    setSelectedVersion: (version: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeItem, setActiveItem, selectedVersion, availableVersions, setSelectedVersion }) => {

    const [weather, setWeather] = useState({ temp: '--', city: 'Memuat...', code: '...' });
    const [isEditingWeather, setIsEditingWeather] = useState(false);
    const [manualLocation, setManualLocation] = useState('');

    useEffect(() => {
        // ... (Weather logic remains same)


        const fetchWeather = async (lat: number, lng: number, cityName?: string) => {
            try {
                let displayCity = cityName || 'Lokasi Anda';
                if (!cityName && lat !== -8.6756) {
                    displayCity = 'Lokasi Terkini';
                }

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
                console.error("Error fetching weather:", error);
                setWeather({ temp: '--', city: 'Gagal memuat', code: '⚠️' });
            }
        };

        const savedLocation = localStorage.getItem('user_weather_location');
        if (savedLocation) {
            const { lat, lng, city } = JSON.parse(savedLocation);
            fetchWeather(lat, lng, city);
        } else {
            const defaultLat = -8.6756;
            const defaultLng = 116.1157;
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        fetchWeather(position.coords.latitude, position.coords.longitude);
                    },
                    () => {
                        fetchWeather(defaultLat, defaultLng, 'Gerung, Lobar');
                    }
                );
            } else {
                fetchWeather(defaultLat, defaultLng, 'Gerung, Lobar');
            }
        }
    }, []);

    const handleManualLocationSubmit = async (e: React.FormEvent) => {
        // ... (Location submit logic same)
        e.preventDefault();
        if (!manualLocation.trim()) return;

        try {
            setWeather(prev => ({ ...prev, city: 'Mencari...' }));
            const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(manualLocation)}&count=1&language=id&format=json`);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const { latitude, longitude, name } = data.results[0];
                localStorage.setItem('user_weather_location', JSON.stringify({
                    lat: latitude,
                    lng: longitude,
                    city: name
                }));

                const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
                const weatherData = await weatherRes.json();
                const weatherCode = weatherData.current_weather.weathercode;
                let icon = '⛅';
                if (weatherCode === 0) icon = '☀️';
                else if (weatherCode >= 1 && weatherCode <= 3) icon = '⛅';
                else if (weatherCode >= 45 && weatherCode <= 48) icon = '🌫️';
                else if (weatherCode >= 51 && weatherCode <= 67) icon = '🌧️';
                else if (weatherCode >= 71) icon = '❄️';
                else if (weatherCode >= 95) icon = '⚡';

                setWeather({
                    temp: Math.round(weatherData.current_weather.temperature).toString(),
                    city: name,
                    code: icon
                });
                setIsEditingWeather(false);
            } else {
                alert('Lokasi tidak ditemukan.');
                setWeather(prev => ({ ...prev, city: 'Lokasi tidak ditemukan' }));
            }
        } catch (error) {
            console.error("Error searching location:", error);
            alert('Gagal mencari lokasi.');
        }
    };

    const menuItems = [
        { icon: <PieChart size={22} strokeWidth={1.5} />, label: 'Dashboard Interaktif' },
        { icon: <MapPin size={22} strokeWidth={1.5} />, label: 'Peta Interaktif' },
        { icon: <Building2 size={22} strokeWidth={1.5} />, label: 'Data Desa' },
        { icon: <Activity size={22} strokeWidth={1.5} />, label: 'Monitoring Proyek' },
        { icon: <MessageSquareWarning size={22} strokeWidth={1.5} />, label: 'Pengaduan Warga' },
        { icon: <Settings size={22} strokeWidth={1.5} />, label: 'Pengaturan' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
                    />

                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed lg:static top-0 left-0 h-full w-72 bg-lobar-blue text-white border-r border-white/10 z-40 flex flex-col shadow-2xl relative overflow-hidden"
                    >
                        {/* Decorative Circle */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="flex justify-end p-4 z-10 md:hidden">
                            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Spacing for Desktop */}
                        <div className="hidden md:block pt-8 px-5 pb-2">

                            <h2 className="text-sm font-bold text-white leading-tight tracking-wider border-b border-white/10 pb-4">
                                SISTEM INFORMASI <br />
                                GEO-SPASIAL <br />
                                BERBASIS DESA
                            </h2>
                        </div>

                        <div className="px-4 pb-2">
                            <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                                <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">Versi Data / Skenario</label>
                                <select
                                    value={selectedVersion}
                                    onChange={(e) => setSelectedVersion(e.target.value)}
                                    className="w-full bg-slate-900/50 text-white text-sm rounded-lg p-2 border border-white/20 outline-none focus:border-lobar-yellow transition-colors"
                                >
                                    {availableVersions.map(v => (
                                        <option key={v} value={v} className="bg-slate-800 text-white">{v}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto z-10">
                            <p className="px-3 mb-2 text-xs font-semibold text-white/60 uppercase tracking-wider">Aplikasi Utama</p>
                            {menuItems.map((item, index) => (
                                <div
                                    key={index}
                                    onClick={() => setActiveItem(item.label)}
                                    className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 cursor-pointer group overflow-hidden
                                    ${activeItem === item.label
                                            ? 'bg-white text-lobar-blue shadow-lg shadow-black/10 translate-x-1 font-semibold'
                                            : 'text-white/90 hover:bg-white/10 hover:text-white'}`}
                                >
                                    {/* Active Indicator Pilla */}
                                    {activeItem === item.label && (
                                        <motion.div
                                            layoutId="activePill"
                                            className="absolute left-0 w-1 h-8 bg-lobar-yellow rounded-r-full hidden"
                                        />
                                    )}

                                    <span className={`relative z-10 transition-transform duration-300 ${activeItem === item.label ? 'scale-110' : 'group-hover:scale-110'}`}>
                                        {item.icon}
                                    </span>
                                    <span className="relative z-10 text-sm tracking-wide">{item.label}</span>
                                </div>
                            ))}
                        </nav>

                        <div className="p-4 z-10">
                            <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-4 border border-white/10 shadow-inner relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                                <div className="flex justify-between items-start mb-1 relative z-10">
                                    <p className="text-xs text-white/80">Cuaca Wilayah</p>
                                    <button
                                        onClick={() => {
                                            if (isEditingWeather) {
                                                setIsEditingWeather(false);
                                            } else {
                                                setManualLocation(weather.city);
                                                setIsEditingWeather(true);
                                            }
                                        }}
                                        className="text-white/60 hover:text-white transition-colors"
                                        title={isEditingWeather ? "Batal" : "Ubah Lokasi"}
                                    >
                                        {isEditingWeather ? <X size={14} /> : <Edit2 size={14} />}
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 relative z-10">
                                    <div className="text-2xl">{weather.code}</div>
                                    <div className="flex-1 w-full relative">
                                        <span className="block text-lg font-bold text-white">{weather.temp}°C</span>
                                        {isEditingWeather ? (
                                            <form onSubmit={handleManualLocationSubmit} className="flex items-center gap-1 mt-1">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={manualLocation}
                                                    onChange={(e) => setManualLocation(e.target.value)}
                                                    className="w-full bg-white/10 text-white text-[10px] rounded px-2 py-1 border border-white/20 focus:outline-none focus:border-white/50"
                                                    placeholder="Cari Kota..."
                                                />
                                                <button type="submit" className="bg-white/20 hover:bg-white/30 p-1 rounded text-white transition-colors">
                                                    <Check size={12} />
                                                </button>
                                            </form>
                                        ) : (
                                            <span className="text-[10px] text-white/80 line-clamp-1" title={weather.city}>{weather.city}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};

export default Sidebar;
