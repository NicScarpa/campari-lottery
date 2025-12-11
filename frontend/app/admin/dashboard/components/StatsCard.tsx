'use client';

import { useState, useEffect, useCallback } from 'react';
import React from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
            const res = await fetch(`${API_URL}/api/admin/stats/${promotionId}`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
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
        return <p className="text-gray-600">Caricamento statistiche in corso...</p>;
    }

    if (error) {
        return <div className="p-3 text-red-700 bg-red-100 rounded-lg">Errore di caricamento: {error}</div>;
    }

    if (!stats) {
        return <p className="text-gray-600">Nessun dato disponibile.</p>;
    }

    // Struttura di visualizzazione
    return (
        <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Riepilogo e Statistiche</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                
                {/* 1. TOKEN TOTALI */}
                <StatBox title="Token Totali Generati" value={stats.tokenStats.total} color="bg-blue-500" />
                
                {/* 2. TOKEN DISPONIBILI */}
                <StatBox title="Token Disponibili" value={stats.tokenStats.available} color="bg-green-500" />

                {/* 3. TOKEN USATI */}
                <StatBox title="Token Utilizzati" value={stats.tokenStats.used} color="bg-red-500" />
            </div>

            <h4 className="text-lg font-semibold mt-6 mb-3 text-gray-700">Stock Premi</h4>
            
            <div className="space-y-2">
                {stats.prizeStats.details.length === 0 ? (
                     <p className="text-gray-500">Nessun tipo di premio configurato per questa promozione.</p>
                ) : (
                    stats.prizeStats.details.map((prize, index) => (
                        <PrizeStockRow key={index} prize={prize} />
                    ))
                )}
            </div>
            <p className="text-sm text-gray-500 mt-4">Premi Totali Iniziali: {stats.prizeStats.total} / Rimanenti Totali: {stats.prizeStats.remaining}</p>
        </div>
    );
}

// Componente di supporto per le card statistiche
const StatBox = ({ title, value, color }: { title: string, value: number, color: string }) => (
    <div className={`p-4 rounded-lg shadow-md text-white ${color}`}>
        <p className="text-sm font-light opacity-80">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
);

// Componente di supporto per la riga dei premi
const PrizeStockRow = ({ prize }: { prize: PrizeDetail }) => (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200">
        <span className="font-medium text-gray-800">{prize.name}</span>
        <span className="text-sm font-semibold text-gray-600">
            {prize.remaining_stock} di {prize.initial_stock} Rimanenti
        </span>
    </div>
);