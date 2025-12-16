'use client';

import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { getApiUrl } from '../../../lib/api';

interface PrizeDetail {
    name: string;
    initial_stock: number;
    remaining_stock: number;
}

interface StatsData {
    tokenStats: {
        total: number;
        used: number;
        available: number;
    };
    prizeStats: {
        total: number;
        remaining: number;
        details: PrizeDetail[];
    };
}

export default function StatsCard({ promotionId }: { promotionId: string }) {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
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

            const res = await fetch(getApiUrl(`api/admin/stats/${promotionId}`), {
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

            const data: StatsData = await res.json();
            setStats(data);

        } catch (err) {
            console.error('Errore nel recupero delle statistiche:', err);
            setError(`Impossibile caricare le statistiche. Errore: ${(err as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    }, [promotionId]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (isLoading) {
        return (
            <div className="bg-[#1a1a1a] p-8 rounded-[2rem] shadow-xl text-white h-full flex items-center justify-center">
                <p className="animate-pulse opacity-50">Caricamento...</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg text-sm">⚠️ {error}</div>;
    }

    if (!stats) {
        return <p className="text-gray-500 italic">Nessun dato disponibile.</p>;
    }

    const percentageUsed = (stats.tokenStats.used / stats.tokenStats.total) * 100;

    return (
        <div className="bg-[#1a1a1a] text-white p-6 md:p-8 rounded-[2rem] shadow-xl relative overflow-hidden h-full flex flex-col justify-between group">
            {/* Background Decoration */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#E3001B] opacity-20 blur-3xl rounded-full group-hover:opacity-30 transition-opacity"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Totale Token</h3>
                        <p className="text-4xl md:text-5xl font-bold tracking-tight">{stats.tokenStats.total.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                        <svg className="w-6 h-6 text-[#E3001B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition">
                        <p className="text-xs text-gray-400 mb-1">Disponibili</p>
                        <p className="text-xl font-bold text-green-400">{stats.tokenStats.available}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition">
                        <p className="text-xs text-gray-400 mb-1">Utilizzati</p>
                        <p className="text-xl font-bold text-[#E3001B]">{stats.tokenStats.used}</p>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative z-10 mt-8">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Avanzamento Campagna</span>
                    <span>{percentageUsed.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#E3001B] h-full rounded-full transition-all duration-1000" style={{ width: `${percentageUsed}%` }}></div>
                </div>
            </div>
        </div>
    );
}

// Remove previously used sub-components if not needed or keep them if intended to be reused. 
// For now, I replaced the main rendering logic completely to match the specific "Dark Card" design.
// I am removing usage of PrizeStockRow and StatBox from this main view to focus on Global Token Stats as requested by layout plan.
// Prize details are handled in PrizeManager view.