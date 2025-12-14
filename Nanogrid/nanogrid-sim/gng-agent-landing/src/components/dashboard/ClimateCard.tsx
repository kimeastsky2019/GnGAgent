import React, { useState, useEffect } from 'react';
import { Thermometer, Droplets, Wind, Sun, Eye, Gauge, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ClimateCard() {
    const [weatherData, setWeatherData] = useState({
        temperature: 24.5,
        humidity: 65,
        windSpeed: 2.3,
        irradiance: 850,
        pressure: 1013.2,
        visibility: 12.5
    });
    const [isRefreshing, setIsRefreshing] = useState(false);

    const generateWeatherData = () => {
        const now = new Date();
        const hour = now.getHours();

        const baseTemp = 20 + Math.sin((hour - 6) * Math.PI / 12) * 8;
        const baseHumidity = 70 - Math.sin((hour - 6) * Math.PI / 12) * 20;
        const baseWind = 2 + Math.random() * 3;
        const baseSolar = Math.max(0, Math.sin((hour - 6) * Math.PI / 12) * 1000);

        return {
            temperature: baseTemp + (Math.random() - 0.5) * 4,
            humidity: Math.max(30, Math.min(90, baseHumidity + (Math.random() - 0.5) * 10)),
            windSpeed: Math.max(0, baseWind + (Math.random() - 0.5) * 2),
            irradiance: Math.max(0, baseSolar + (Math.random() - 0.5) * 200),
            pressure: 1013.2 + (Math.random() - 0.5) * 20,
            visibility: 12.5 + (Math.random() - 0.5) * 5
        };
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setWeatherData(generateWeatherData());
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setWeatherData(generateWeatherData());
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const stats = [
        {
            icon: Thermometer,
            label: 'Temperature',
            value: `${weatherData.temperature.toFixed(1)}°C`,
            description: 'Current temp',
            trend: 'up',
            trendValue: '+0.3°C',
            progress: (weatherData.temperature / 40) * 100,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
            bar: 'bg-red-500'
        },
        {
            icon: Droplets,
            label: 'Humidity',
            value: `${weatherData.humidity.toFixed(0)}%`,
            description: 'Relative humidity',
            trend: 'down',
            trendValue: '-2%',
            progress: weatherData.humidity,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            bar: 'bg-cyan-500'
        },
        {
            icon: Wind,
            label: 'Wind Speed',
            value: `${weatherData.windSpeed.toFixed(1)} m/s`,
            description: 'Wind velocity',
            trend: 'up',
            trendValue: '+0.2 m/s',
            progress: (weatherData.windSpeed / 10) * 100,
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            bar: 'bg-yellow-500'
        },
        {
            icon: Sun,
            label: 'Solar Radiation',
            value: `${weatherData.irradiance.toFixed(0)} W/m²`,
            description: 'Solar irradiance',
            trend: 'up',
            trendValue: '+45 W/m²',
            progress: (weatherData.irradiance / 1200) * 100,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
            bar: 'bg-orange-500'
        },
        {
            icon: Eye,
            label: 'Visibility',
            value: `${weatherData.visibility.toFixed(1)} km`,
            description: 'Visibility',
            trend: 'up',
            trendValue: '+0.8 km',
            progress: (weatherData.visibility / 20) * 100,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            bar: 'bg-purple-500'
        },
        {
            icon: Gauge,
            label: 'Pressure',
            value: `${weatherData.pressure.toFixed(1)} hPa`,
            description: 'Atmospheric',
            trend: 'down',
            trendValue: '-1.2 hPa',
            progress: ((weatherData.pressure - 980) / (1040 - 980)) * 100,
            color: 'text-pink-400',
            bg: 'bg-pink-500/10',
            bar: 'bg-pink-500'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Climate Analysis</h2>
                    <p className="text-slate-400">Real-time weather monitoring for site suitability.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className={cn(
                        "p-3 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all",
                        isRefreshing && "animate-spin text-cyan-400"
                    )}
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all group hover:-translate-y-1"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-3 rounded-lg", stat.bg, stat.color)}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className={cn(
                                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-slate-800",
                                stat.trend === 'up' ? "text-green-400" : "text-red-400"
                            )}>
                                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {stat.trendValue}
                            </div>
                        </div>

                        <div className="mb-1">
                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                            <div className="text-sm text-slate-400">{stat.label}</div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                            <Eye className="w-3 h-3" />
                            {stat.description}
                        </div>

                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full rounded-full transition-all duration-1000", stat.bar)}
                                style={{ width: `${stat.progress}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Sun className="w-5 h-5 text-orange-400" />
                        Solar Irradiance Forecast
                    </h3>
                    <div className="h-48 flex items-end justify-between gap-2 px-4">
                        {[...Array(24)].map((_, i) => {
                            const height = Math.max(10, Math.sin((i - 6) * Math.PI / 12) * 100);
                            return (
                                <div key={i} className="w-full group relative">
                                    <div
                                        className="w-full bg-orange-500/20 rounded-t-sm group-hover:bg-orange-500/40 transition-colors"
                                        style={{ height: `${height}%` }}
                                    ></div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                                        {i}:00 - {Math.round(height * 10)} W/m²
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500 px-4">
                        <span>00:00</span>
                        <span>12:00</span>
                        <span>23:00</span>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Predictions</h3>
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                                <span className="text-slate-400 font-medium">+{i} Hour</span>
                                <div className="text-right">
                                    <div className="text-white font-bold">{(weatherData.temperature + i * 0.5).toFixed(1)}°C</div>
                                    <div className="text-xs text-slate-500">{(weatherData.humidity - i).toFixed(0)}% Hum</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
