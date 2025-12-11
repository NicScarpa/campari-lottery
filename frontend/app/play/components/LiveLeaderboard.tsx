import React from 'react';

interface Props {
    entries: any[]; 
    currentUserPhone: string;
}

export default function LiveLeaderboard({ entries, currentUserPhone }: Props) {
    // Safety check se la lista è vuota o undefined
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
        return <div className="text-center text-gray-400 py-4 italic text-xs uppercase tracking-widest">Nessuna giocata registrata</div>;
    }

    return (
        <div className="w-full">
            {/* Intestazione Tabella */}
            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mb-2 border-b-2 border-gray-200 pb-1 tracking-widest">
                <span>Pos / Giocatore</span>
                <span>Giocate</span>
            </div>

            <ul className="space-y-1">
                {entries.map((entry, idx) => {
                    // NORMALIZZAZIONE DATI (FIX CRITICO)
                    // Il backend Prisma manda snake_case (phone_number), il frontend si aspettava camelCase.
                    // Qui gestiamo entrambi i casi per evitare crash.
                    const rawPhone = entry.phone_number || entry.phoneNumber || '';
                    const rawName = entry.first_name || entry.firstName || 'Anonimo';
                    const rawLast = entry.last_name || entry.lastName || '';
                    const plays = entry.total_plays || entry.totalPlays || 0;
                    
                    const isMe = rawPhone === currentUserPhone;
                    const lastInitial = rawLast ? `${rawLast.charAt(0)}.` : '';
                    const rank = idx + 1;

                    // Protezione contro stringhe vuote per lo slice
                    const maskedPhone = rawPhone.length > 4 
                        ? `••• ••• ${rawPhone.slice(-4)}` 
                        : '••• ••• ••••';

                    return (
                        <li 
                            key={idx} 
                            className={`flex justify-between items-center p-3 border-2 transition-all ${
                                isMe 
                                ? 'bg-black text-white border-black transform scale-[1.02] shadow-lg z-10' 
                                : 'bg-white text-gray-800 border-gray-200'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Badge Posizione */}
                                <div className={`w-6 h-6 flex items-center justify-center font-black text-xs ${
                                    rank === 1 ? 'bg-[#E3001B] text-white' : 
                                    rank === 2 ? 'bg-gray-400 text-white' : 
                                    rank === 3 ? 'bg-orange-400 text-white' : 
                                    'bg-transparent text-gray-400'
                                }`}>
                                    {rank}
                                </div>
                                
                                <div className="flex flex-col leading-none">
                                    <span className="font-bold uppercase text-sm tracking-tight">
                                        {rawName} {lastInitial}
                                        {isMe && <span className="ml-2 text-[9px] bg-[#E3001B] text-white px-1 py-0.5 align-top">TU</span>}
                                    </span>
                                    {/* Numero mascherato (Fix Crash) */}
                                    <span className={`text-[10px] font-mono mt-0.5 ${isMe ? 'text-gray-400' : 'text-gray-400'}`}>
                                        {maskedPhone}
                                    </span>
                                </div>
                            </div>

                            <div className="font-black text-xl tracking-tighter">
                                {plays}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}