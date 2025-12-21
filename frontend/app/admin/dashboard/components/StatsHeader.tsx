'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../../../lib/api';

interface StatsHeaderProps {
    promotionId: string;
    promotionName: string;
    refreshKey?: number;
}

interface HeaderStats {
    totalTokens: number;
    usedTokens: number;
    availableTokens: number;
    totalPrizes: number;
    winnersCount: number;
    participantsCount: number;
    winRate: number;
    usageRate: number;
}

export default function StatsHeader({ promotionId, promotionName, refreshKey }: StatsHeaderProps) {
    const [stats, setStats] = useState<HeaderStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) return;

            const res = await fetch(getApiUrl(`api/admin/stats/${promotionId}`), {
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include'
            });

            if (res.ok) {
                const data = await res.json();
                setStats({
                    totalTokens: data.tokenStats?.total || 0,
                    usedTokens: data.tokenStats?.used || 0,
                    availableTokens: data.tokenStats?.available || 0,
                    totalPrizes: data.prizeStats?.total || 0,
                    winnersCount: data.prizeStats?.total - data.prizeStats?.remaining || 0,
                    participantsCount: data.tokenStats?.used || 0,
                    winRate: data.tokenStats?.used > 0
                        ? Math.round(((data.prizeStats?.total - data.prizeStats?.remaining) / data.tokenStats?.used) * 100)
                        : 0,
                    usageRate: data.tokenStats?.total > 0
                        ? Math.round((data.tokenStats?.used / data.tokenStats?.total) * 100)
                        : 0
                });
            }
        } catch (error) {
            console.error('Error fetching header stats:', error);
        } finally {
            setLoading(false);
        }
    }, [promotionId]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats, refreshKey]);

    if (loading || !stats) {
        return (
            <div className="px-6 md:px-10 py-8 animate-pulse">
                <div className="h-16 bg-gray-200/50 rounded-xl w-1/3 mb-6"></div>
                <div className="flex gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-12 bg-gray-200/50 rounded-full w-24"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 md:px-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 lg:gap-10">
            {/* Left: Title and Quick Stats Pills */}
            <div className="flex-1">
                <h1 className="text-4xl md:text-5xl lg:text-[56px] font-medium tracking-tight text-gray-900 leading-none">
                    {promotionName}
                </h1>

                <div className="flex flex-wrap gap-4 md:gap-6 mt-8 md:mt-10 items-end">
                    {/* Win Rate Pill - Dark */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] md:text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Win Rate</span>
                        <div className="h-10 md:h-12 px-4 md:px-5 bg-[#2d2d2d] rounded-full flex items-center justify-center group cursor-pointer hover:bg-gray-800 transition-colors shadow-lg">
                            <span className="text-white text-xs md:text-sm font-bold">{stats.winRate}%</span>
                        </div>
                    </div>

                    {/* Usage Rate Pill - Campari */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] md:text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Utilizzo</span>
                        <div className="h-10 md:h-12 px-4 md:px-5 bg-[#b42a28] rounded-full flex items-center justify-center shadow-lg shadow-[#b42a28]/20 group cursor-pointer hover:brightness-110 transition-all">
                            <span className="text-white text-xs md:text-sm font-bold">{stats.usageRate}%</span>
                        </div>
                    </div>

                    {/* Available Tokens Pill - Glass */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] md:text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Disponibili</span>
                        <div className="h-10 md:h-12 px-4 md:px-6 border border-gray-200/50 rounded-full flex items-center relative overflow-hidden group bg-white/30 backdrop-blur-sm">
                            <span className="relative z-10 text-gray-600 text-xs md:text-sm font-bold">{stats.availableTokens}</span>
                        </div>
                    </div>

                    {/* Stock Pill */}
                    <div className="flex flex-col gap-2">
                        <span className="text-[10px] md:text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Premi Stock</span>
                        <div className="h-10 md:h-12 px-4 md:px-5 border border-gray-400/30 rounded-full flex items-center justify-center bg-white/30 backdrop-blur-sm">
                            <span className="text-xs md:text-sm font-bold text-gray-600">{stats.totalPrizes}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Big Numbers */}
            <div className="flex items-center gap-8 md:gap-12 lg:gap-16 pb-2">
                <div className="flex flex-col items-center">
                    <div className="flex items-baseline gap-1 md:gap-2">
                        <span className="text-[10px] text-gray-400"></span>
                        <span className="text-5xl md:text-6xl lg:text-7xl font-light text-gray-900 tracking-tighter">{stats.participantsCount}</span>
                    </div>
                    <span className="text-[10px] md:text-[12px] text-gray-400 mt-1 uppercase tracking-widest">Giocate</span>
                </div>
                <div className="flex flex-col items-center">
                    <div className="flex items-baseline gap-1 md:gap-2">
                        <span className="text-[10px] text-gray-400"></span>
                        <span className="text-5xl md:text-6xl lg:text-7xl font-light text-gray-900 tracking-tighter">{stats.winnersCount}</span>
                    </div>
                    <span className="text-[10px] md:text-[12px] text-gray-400 mt-1 uppercase tracking-widest">Vincite</span>
                </div>
                <div className="flex flex-col items-center">
                    <div className="flex items-baseline gap-1 md:gap-2">
                        <span className="text-[10px] text-gray-400"></span>
                        <span className="text-5xl md:text-6xl lg:text-7xl font-light text-gray-900 tracking-tighter">{stats.totalTokens}</span>
                    </div>
                    <span className="text-[10px] md:text-[12px] text-gray-400 mt-1 uppercase tracking-widest">Token</span>
                </div>
            </div>
        </div>
    );
}
