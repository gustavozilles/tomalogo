import { useState } from 'react'

interface TimePickerProps {
    value: string[]
    onChange: (times: string[]) => void
    suggestions?: string[]
}

export function TimePicker({ value, onChange, suggestions = [] }: TimePickerProps) {
    const [customTime, setCustomTime] = useState("")

    // Merge default presets with user suggestions, deduplicate and sort
    const presets = ["08:00", "12:00", "20:00"]
    const allSuggestions = Array.from(new Set([...presets, ...suggestions])).sort()

    function toggleTime(t: string) {
        if (value.includes(t)) {
            onChange(value.filter(x => x !== t))
        } else {
            onChange([...value, t].sort())
        }
    }

    function addCustom() {
        if (!customTime) return
        if (!customTime.match(/^\d{2}:\d{2}$/)) {
            alert("Formato inválido. Use HH:MM")
            return
        }
        if (!value.includes(customTime)) {
            onChange([...value, customTime].sort())
            setCustomTime("")
        }
    }

    return (
        <div>
            <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-2">Horários</label>
            <div className="bg-gray-50 rounded-2xl p-4 mt-1">
                {/* Selected Chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {value.map(t => (
                        <span key={t} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                            {t}
                            <button onClick={() => toggleTime(t)} className="hover:text-blue-900">×</button>
                        </span>
                    ))}
                    {value.length === 0 && <span className="text-gray-400 text-xs italic">Nenhum horário selecionado</span>}
                </div>

                {/* Quick Add */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {allSuggestions.map(t => (
                        <button
                            key={t}
                            onClick={() => toggleTime(t)}
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${value.includes(t) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Custom Input */}
                <div className="flex gap-2">
                    <input
                        type="time"
                        value={customTime}
                        onChange={e => setCustomTime(e.target.value)}
                        onBlur={addCustom}
                        onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                    <button
                        onClick={addCustom}
                        disabled={!customTime}
                        className="bg-gray-900 text-white px-4 rounded-xl text-xs font-bold disabled:opacity-50"
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    )
}
