import { useState } from 'react'
import { TimePicker } from '../TimePicker'

interface Med {
    id: string
    name: string
    dosage: string | null
    inventory: number
    times: string | null
}

interface EditMedModalProps {
    med: Med
    onClose: () => void
    onSuccess: () => void
    tid: string
    suggestions?: string[]
}

export function EditMedModal({ med, onClose, onSuccess, tid, suggestions = [] }: EditMedModalProps) {
    let initialTimes = ""
    try {
        if (med.times) {
            const parsed = JSON.parse(med.times)
            if (Array.isArray(parsed)) initialTimes = parsed.join(",")
        }
    } catch { }

    const [formQty, setFormQty] = useState(med.inventory.toString())
    const [formTimes, setFormTimes] = useState(initialTimes)

    async function saveChanges() {
        const timesArray = formTimes.split(",")
            .map(s => s.trim())
            .filter(s => s.match(/^\d{2}:\d{2}$/))

        await fetch('/api/meds', {
            method: 'PATCH',
            headers: { 'x-telegram-id': tid },
            body: JSON.stringify({
                id: med.id,
                times: timesArray,
                inventory: formQty
            })
        })
        onSuccess()
        onClose()
    }

    async function deleteMed() {
        if (!confirm(`Quer mesmo remover ${med.name} da sua lista?`)) return
        await fetch(`/api/meds?id=${med.id}`, {
            method: 'DELETE',
            headers: { 'x-telegram-id': tid }
        })
        onSuccess()
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100] overflow-hidden">
            <div className="bg-white rounded-t-[40px] sm:rounded-[40px] w-full max-w-md p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 sm:hidden"></div>
                <h3 className="text-2xl font-black mb-6 italic">Gerenciar {med.name}</h3>

                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-2">Estoque Atual</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={formQty}
                                onChange={e => setFormQty(e.target.value)}
                                className="w-full text-4xl font-black bg-blue-50 border-0 rounded-2xl p-6 mt-1 text-blue-600 outline-none text-center"
                            />
                            <button
                                onClick={() => document.getElementById('cam-input')?.click()}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-2xl shadow-md border border-gray-100 active:scale-90 transition"
                            >
                                📸
                            </button>
                        </div>
                    </div>

                    <TimePicker
                        value={formTimes ? formTimes.split(',').filter(x => x) : []}
                        onChange={(ts) => setFormTimes(ts.join(','))}
                        suggestions={suggestions}
                    />
                </div>

                <div className="flex flex-col gap-3 mt-10">
                    <button onClick={saveChanges} className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl shadow-xl transition active:scale-95 text-lg">Atualizar</button>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-4 font-bold text-gray-400 transition">Cancelar</button>
                        <button onClick={deleteMed} className="flex-1 py-4 font-bold text-red-500 transition">Remover da Lista</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
