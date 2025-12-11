'use client';
import { useEffect } from "react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
}

export default function LegalModal({ isOpen, onClose, title, content }: Props) {
    // Blocca lo scroll della pagina sotto quando il modale è aperto
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay scuro con blur */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            ></div>

            {/* Contenitore Modale - Stile "Campari Brutal" */}
            <div className="relative bg-white w-full max-w-lg max-h-[85vh] flex flex-col border-4 border-black shadow-[10px_10px_0px_0px_rgba(255,255,255,0.2)] animate-in zoom-in-95 duration-200">
                
                {/* Header Fisso */}
                <div className="flex justify-between items-center p-5 border-b-4 border-black bg-[#E3001B] text-white">
                    <h3 className="text-xl font-black uppercase tracking-widest leading-none">{title}</h3>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center bg-black text-white font-bold hover:bg-white hover:text-black border-2 border-transparent hover:border-black transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Contenuto Scrollabile */}
                <div className="p-6 overflow-y-auto text-sm text-gray-800 leading-relaxed font-medium">
                    {/* Renderizza il markdown base o testo semplice */}
                    <div className="whitespace-pre-wrap font-sans">
                        {content}
                    </div>
                </div>

                {/* Footer Fisso */}
                <div className="p-4 border-t-4 border-black bg-gray-50 text-center">
                    <button 
                        onClick={onClose}
                        className="w-full bg-black text-white font-black uppercase py-3 hover:bg-[#E3001B] transition-colors tracking-widest text-sm"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
}