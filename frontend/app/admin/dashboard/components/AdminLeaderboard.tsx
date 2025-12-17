'use client';

import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../../../lib/api';

interface LeaderboardEntry {
    rank: number;
    name: string;
    phone: string;
    plays: number;
}

interface Props {
    promotionId: string;
    refreshKey?: number;
}

export default function AdminLeaderboard({ promotionId, refreshKey }: Props) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!promotionId) return;

        const fetchLeaderboard = async () => {
            setLoading(true);
            setError(null);

            try {
                const token = localStorage.getItem('admin_token');
                if (!token) {
                    setError('Token non trovato');
                    return;
                }

                const res = await fetch(getApiUrl(`api/leaderboard/${promotionId}`), {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error('Errore caricamento classifica');

                const data = await res.json();
                setLeaderboard(data.leaderboard || []);
            } catch (err) {
                console.error('Leaderboard fetch error:', err);
                setError('Impossibile caricare la classifica');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [promotionId, refreshKey]);

    if (loading) {
        return (
            <div className="animate-pulse space-y-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>
                ))}
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-sm py-4">{error}</div>;
    }

    if (leaderboard.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                <div className="text-3xl mb-2">🏆</div>
                <p className="text-sm">Nessuna giocata registrata</p>
                <p className="text-xs mt-1">La classifica apparirà qui</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 px-3 pb-2 border-b border-gray-100">
                <span>Pos / Giocatore</span>
                <span>Giocate</span>
            </div>

            {/* Lista */}
            {leaderboard.map((entry) => (
                <div
                    key={entry.rank}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-white hover:shadow-sm transition border border-transparent hover:border-gray-100"
                >
                    <div className="flex items-center gap-3">
                        {/* Badge posizione */}
                        <div className={`w-8 h-8 flex items-center justify-center font-black text-sm rounded-full
                            ${entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                              entry.rank === 2 ? 'bg-gray-300 text-gray-700' :
                              entry.rank === 3 ? 'bg-orange-300 text-orange-800' :
                              'bg-gray-100 text-gray-500'}`}
                        >
                            {entry.rank}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">{entry.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{entry.phone}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-gray-700">{entry.plays}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
