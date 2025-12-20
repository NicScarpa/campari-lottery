'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../../../lib/api';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface RevenueData {
    summary: {
        unitsSold: number;
        totalRevenue: number;
        totalCost: number;
        grossMargin: number;
        marginPercentage: number;
        dailyAverage: number;
        dailyAverageRevenue: number;
    };
    dailySales: Array<{
        date: string;
        units: number;
        revenue: number;
        vsYesterday: number | null;
    }>;
    hourlyDistribution: Array<{
        hour: number;
        count: number;
    }>;
    promotion: {
        startDate: string;
        endDate: string;
    };
}

interface RevenueStatsProps {
    promotionId: string;
    refreshKey?: number;
}

export default function RevenueStats({ promotionId, refreshKey }: RevenueStatsProps) {
    const [data, setData] = useState<RevenueData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null); // null = totale promozione
    const [viewMode, setViewMode] = useState<'total' | 'daily'>('total');

    const fetchRevenue = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        if (!promotionId) {
            setError("ID Promozione non fornito.");
            setIsLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                throw new Error('Token non trovato');
            }

            const url = selectedDate
                ? getApiUrl(`api/admin/revenue/${promotionId}?date=${selectedDate}`)
                : getApiUrl(`api/admin/revenue/${promotionId}`);

            const res = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Errore HTTP: ${res.status}`);
            }

            const responseData: RevenueData = await res.json();
            setData(responseData);

        } catch (err) {
            console.error('Errore nel recupero dei dati revenue:', err);
            setError(`Impossibile caricare i dati. Errore: ${(err as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    }, [promotionId, selectedDate]);

    useEffect(() => {
        fetchRevenue();
    }, [fetchRevenue, refreshKey]);

    // Formatta data per display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    };

    // Formatta ora
    const formatHour = (hour: number) => {
        return `${hour.toString().padStart(2, '0')}:00`;
    };

    // Formatta valuta
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    };

    if (isLoading) {
        return (
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
                        ))}
                    </div>
                    <div className="h-64 bg-gray-100 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg text-sm">
                    {error}
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <p className="text-gray-500 italic">Nessun dato disponibile.</p>
            </div>
        );
    }

    const { summary, dailySales, hourlyDistribution } = data;

    return (
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Revenue & Vendite</h2>
                    <p className="text-sm text-gray-500">
                        {viewMode === 'total' ? 'Totale promozione' : `Giorno: ${selectedDate ? formatDate(selectedDate) : '-'}`}
                    </p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <button
                        onClick={() => {
                            setViewMode('total');
                            setSelectedDate(null);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            viewMode === 'total'
                                ? 'bg-[#E3001B] text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Totale
                    </button>
                    <button
                        onClick={() => setViewMode('daily')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            viewMode === 'daily'
                                ? 'bg-[#E3001B] text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Per Giorno
                    </button>
                </div>
            </div>

            {/* Day Selector (visible only in daily mode) */}
            {viewMode === 'daily' && dailySales.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                    {dailySales.map((day) => (
                        <button
                            key={day.date}
                            onClick={() => setSelectedDate(day.date)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                selectedDate === day.date
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {formatDate(day.date)}
                        </button>
                    ))}
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {/* Unità Vendute */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">Unità Vendute</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{summary.unitsSold.toLocaleString()}</p>
                    {viewMode === 'total' && (
                        <p className="text-xs text-gray-400 mt-1">
                            Media: {summary.dailyAverage.toFixed(1)}/giorno
                        </p>
                    )}
                </div>

                {/* Ricavi Totali */}
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-green-100 rounded-lg">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">Ricavi</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</p>
                    {viewMode === 'total' && (
                        <p className="text-xs text-gray-400 mt-1">
                            Media: {formatCurrency(summary.dailyAverageRevenue)}/giorno
                        </p>
                    )}
                </div>

                {/* Costi Totali */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-gray-200 rounded-lg">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                            </svg>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">Costi</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-600">{formatCurrency(summary.totalCost)}</p>
                    <p className="text-xs text-gray-400 mt-1">@ 0.84€/unità</p>
                </div>

                {/* Margine Lordo */}
                <div className={`rounded-xl p-4 border ${summary.grossMargin >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg ${summary.grossMargin >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                            <svg className={`w-4 h-4 ${summary.grossMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">Margine</span>
                    </div>
                    <p className={`text-2xl font-bold ${summary.grossMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(summary.grossMargin)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Ricavi - Costi</p>
                </div>

                {/* Margine % */}
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">Margine %</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{summary.marginPercentage.toFixed(1)}%</p>
                    <p className="text-xs text-gray-400 mt-1">Profittabilità</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Sales Chart */}
                {viewMode === 'total' && dailySales.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Andamento Vendite</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={dailySales}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                />
                                <YAxis
                                    yAxisId="left"
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tickFormatter={(v) => `€${v}`}
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                />
                                <Tooltip
                                    formatter={(value, name) => {
                                        if (name === 'revenue') return [formatCurrency(value as number), 'Ricavi'];
                                        return [value, 'Unità'];
                                    }}
                                    labelFormatter={(label) => formatDate(label as string)}
                                />
                                <Legend />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="units"
                                    name="Unità"
                                    stroke="#3b82f6"
                                    fill="#3b82f6"
                                    fillOpacity={0.2}
                                />
                                <Area
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Ricavi"
                                    stroke="#10b981"
                                    fill="#10b981"
                                    fillOpacity={0.2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Hourly Distribution Chart */}
                <div className={`bg-gray-50 rounded-xl p-4 border border-gray-100 ${viewMode === 'total' && dailySales.length > 0 ? '' : 'lg:col-span-2'}`}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        Distribuzione Oraria
                        {selectedDate && <span className="font-normal text-gray-500"> - {formatDate(selectedDate)}</span>}
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={hourlyDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="hour"
                                tickFormatter={formatHour}
                                tick={{ fontSize: 10, fill: '#6b7280' }}
                                interval={1}
                            />
                            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                            <Tooltip
                                formatter={(value) => [value, 'Vendite']}
                                labelFormatter={(hour) => formatHour(hour as number)}
                            />
                            <Bar
                                dataKey="count"
                                name="Vendite"
                                fill="#E3001B"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Daily Breakdown Table (visible in total mode) */}
            {viewMode === 'total' && dailySales.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Dettaglio Giornaliero</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-500">Data</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-500">Unità</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-500">Ricavi</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-500">vs Giorno Prec.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailySales.map((day, index) => (
                                    <tr
                                        key={day.date}
                                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition"
                                        onClick={() => {
                                            setViewMode('daily');
                                            setSelectedDate(day.date);
                                        }}
                                    >
                                        <td className="py-3 px-4 font-medium text-gray-900">
                                            {formatDate(day.date)}
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-700">
                                            {day.units.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right text-green-600 font-medium">
                                            {formatCurrency(day.revenue)}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {day.vsYesterday !== null ? (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    day.vsYesterday >= 0
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {day.vsYesterday >= 0 ? '↑' : '↓'}
                                                    {Math.abs(day.vsYesterday).toFixed(1)}%
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
