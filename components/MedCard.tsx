'use client'

interface Med {
    id: string
    name: string
    dosage: string
    inventory: number
    times: string | null
}

interface MedCardProps {
    med: Med
    onEdit: (med: Med) => void
}

export function MedCard({ med, onEdit }: MedCardProps) {
    let timesDisplay = "Sem horário"
    try {
        if (med.times) {
            const t = JSON.parse(med.times)
            if (Array.isArray(t) && t.length > 0) timesDisplay = t.join(" • ")
        }
    } catch { }

    const isLow = med.inventory <= 15
    const isCritical = med.inventory <= 5

    return (
        <div
            className="group relative bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
        >
            {/* Visual Stock Indicator (Vertical bar) */}
            <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${isCritical ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
            />

            <div className="flex justify-between items-start mb-5 pl-2">
                <div className="flex-1">
                    <h2 className="text-lg font-bold text-slate-900 leading-tight mb-0.5 tracking-tight">
                        {med.name}
                    </h2>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {med.dosage}
                    </p>
                </div>
                <div className="text-right">
                    <div className="flex flex-col">
                        <span className={`text-2xl font-black tabular-nums tracking-tighter ${isCritical ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-indigo-600'
                            }`}>
                            {med.inventory}
                        </span>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em] -mt-1">
                            Unidades
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pl-2">
                <div className="flex items-center gap-2 bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-100">
                    <span className="grayscale opacity-70 italic text-[10px]">NEXT</span>
                    <span className="text-indigo-700">{timesDisplay}</span>
                </div>
                <button
                    onClick={() => onEdit(med)}
                    className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
                >
                    Gerenciar
                </button>
            </div>

            {isCritical && (
                <div className="mt-4 pt-3 border-t border-rose-50 flex items-center gap-2 text-[10px] font-bold text-rose-600 uppercase tracking-tight">
                    <span className="animate-pulse">⚠️</span> ESTOQUE CRÍTICO - REPOR IMEDIATAMENTE
                </div>
            )}
        </div>
    )
}
