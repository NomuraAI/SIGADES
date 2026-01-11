import React from 'react';
import { Construction } from 'lucide-react';

const ComingSoon = ({ title }: { title: string }) => {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-50 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-blue-100 text-lobar-blue rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <Construction size={48} />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2 font-display">
                COMING SOON
            </h1>
            <h2 className="text-xl font-semibold text-lobar-blue mb-4">
                {title}
            </h2>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                Halaman ini sedang dalam tahap pengembangan. <br />
                Fitur lengkap akan segera hadir untuk melengkapi layanan SIGADES LOBAR.
            </p>
            <div className="mt-8 px-6 py-2 bg-white border border-slate-200 rounded-full text-slate-400 text-sm shadow-sm">
                Versi 1.0 (Beta)
            </div>
        </div>
    );
};

export default ComingSoon;
