'use client'

import { useState } from 'react'

interface TimeQuickSelectProps {
    value: string[]
    onChange: (times: string[]) => void
}

const PRESETS = ['08:00', '12:00', '18:00', '22:00']

export function TimeQuickSelect({ value = [], onChange }: TimeQuickSelectProps) {
    const [input, setInput] = useState("")

    function toggleTime(t: string) {
        if (value.includes(t)) {
            onChange(value.filter(x => x !== t).sort())
        } else {
            onChange([...value, t].sort())
        }
    }

    function addCustomTime() {
        if (input.match(/^\d{2}:\d{2}$/) && !value.includes(input)) {
            onChange([...value, input].sort())
            setInput("")
        }
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider mb-2 block">
                    Sugestões Rápidas
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {PRESETS.map(t => (
                        <button
                            key={t}
                            onClick={() => toggleTime(t)}
                            className={`py-2.5 px-1 rounded-xl text-xs font-bold transition-all border ${value.includes(t)
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider mb-2 block">
                    Selecionados
                </label>
                <div className="flex flex-wrap gap-2 min-h-[32px]">
                    {value.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">Nenhum horário selecionado</span>
                    ) : (
                        value.map(t => (
                            <span
                                key={t}
                                className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-indigo-100 animate-in zoom-in-95 duration-200"
                            >
                                {t}
                                <button
                                    onClick={() => toggleTime(t)}
                                    className="hover:bg-indigo-200 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                                >
                                    ×
                                </button>
                            </span>
                        ))
                    )}
                </div>
            </div>

            <div className="flex gap-2">
                <input
                    type="time"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                />
                <button
                    onClick={addCustomTime}
                    disabled={!input}
                    className="bg-slate-900 text-white font-bold px-6 rounded-xl hover:bg-slate-800 active:scale-95 transition disabled:opacity-50"
                >
                    Add
                </button>
            </div>
        </div>
    )
}
