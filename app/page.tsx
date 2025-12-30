'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AddMedModal } from './components/modals/AddMedModal'
import { EditMedModal } from './components/modals/EditMedModal'
import { SettingsModal } from './components/modals/SettingsModal'
import { InventoryBar } from './components/InventoryBar'

interface UserData {
    firstName: string | null
    doctorPhone: string | null
    phoneNumber: string | null
    naggingInterval: number
    homeLat: number | null
    homeLon: number | null
}

interface Med {
    id: string
    name: string
    dosage: string
    inventory: number
    times: string | null // JSON string
}

interface MedWithTime extends Med {
    scheduledTime: string
}

function MedsList() {
    const params = useSearchParams()
    const tid = params.get('tid')

    const [user, setUser] = useState<UserData | null>(null)
    const [meds, setMeds] = useState<Med[]>([])
    const [loading, setLoading] = useState(true)

    // Modal States
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingMed, setEditingMed] = useState<Med | null>(null)
    const [showSettings, setShowSettings] = useState(false)

    useEffect(() => {
        if (tid) fetchData()
    }, [tid])

    async function fetchData() {
        if (!tid) return
        const res = await fetch(`/api/meds?tid=${tid}`)
        if (res.ok) {
            const data = await res.json()
            setMeds(data.medications)
            setUser(data.user)
        }
        setLoading(false)
    }

    if (!tid) return <div className="min-h-screen bg-blue-600 flex items-center justify-center p-8 text-white text-center font-bold">⛔ Abra este app pelo Telegram.</div>
    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">💊 Organizando sua farmácia...</div>

    // Calculate smart suggestions from existing meds
    const allUserTimes = Array.from(new Set(
        meds.flatMap(m => {
            try { return JSON.parse(m.times || "[]") } catch { return [] }
        })
    )).sort() as string[]

    // Group medications by scheduled time
    const groupedByTime = new Map<string, MedWithTime[]>()
    const noTimeMeds: Med[] = []

    for (const med of meds) {
        let times: string[] = []
        try {
            if (med.times) times = JSON.parse(med.times)
        } catch { }

        if (!times || times.length === 0) {
            noTimeMeds.push(med)
        } else {
            for (const time of times) {
                if (!groupedByTime.has(time)) {
                    groupedByTime.set(time, [])
                }
                groupedByTime.get(time)!.push({ ...med, scheduledTime: time })
            }
        }
    }

    // Sort time slots chronologically
    const sortedTimes = Array.from(groupedByTime.keys()).sort()

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8 font-sans text-gray-900 pb-24">

            {/* Header / Greeting */}
            <header className="mb-6 flex justify-between items-start">
                <div>
                    <p className="text-blue-600 font-semibold mb-1">Que bom te ver por aqui!</p>
                    <h1 className="text-3xl font-extrabold tracking-tight">
                        Oi, {user?.firstName || 'Campeão'}! 👋
                    </h1>
                </div>
                <button
                    onClick={() => setShowSettings(true)}
                    className="p-3 bg-white rounded-2xl shadow-sm border border-white active:scale-95 transition"
                >
                    ⚙️
                </button>
            </header>

            {/* Add Button */}
            <div
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 text-white active:scale-95 transition cursor-pointer mb-6"
            >
                <span className="text-xl font-bold">+</span>
                <span className="font-bold">Adicionar Medicamento</span>
            </div>

            {/* Time-grouped List */}
            <div className="space-y-6">
                {sortedTimes.map(time => (
                    <div key={time}>
                        {/* Time Header */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-lg shadow-md">
                                ⏰ {time}
                            </div>
                            <div className="flex-1 h-px bg-blue-200" />
                        </div>

                        {/* Meds for this time */}
                        <div className="space-y-3">
                            {groupedByTime.get(time)!.map((med, idx) => {
                                const isLow = med.inventory <= 15

                                return (
                                    <div
                                        key={`${med.id}-${time}-${idx}`}
                                        onClick={() => setEditingMed(med)}
                                        className="group relative bg-white/80 backdrop-blur-lg rounded-2xl p-4 border border-white shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                                    >
                                        {isLow && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-bl-xl uppercase">Baixo</div>}

                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <h2 className="text-lg font-bold text-gray-800">{med.name}</h2>
                                                <p className="text-xs font-medium text-gray-400">{med.dosage}</p>
                                            </div>
                                        </div>

                                        <InventoryBar current={med.inventory} />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}

                {/* Meds without time */}
                {noTimeMeds.length > 0 && (
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-gray-400 text-white px-4 py-2 rounded-xl font-bold text-lg shadow-md">
                                📦 Sem horário
                            </div>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        <div className="space-y-3">
                            {noTimeMeds.map(med => (
                                <div
                                    key={med.id}
                                    onClick={() => setEditingMed(med)}
                                    className="group relative bg-white/60 backdrop-blur-lg rounded-2xl p-4 border border-white/50 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer opacity-70"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-600">{med.name}</h2>
                                            <p className="text-xs font-medium text-gray-400">{med.dosage}</p>
                                        </div>
                                    </div>

                                    <InventoryBar current={med.inventory} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {meds.length === 0 && !showAddForm && (
                    <div className="text-center py-20 opacity-30 grayscale">
                        <span className="text-6xl mb-4 block">📦</span>
                        <p className="font-bold">Sua lista está vazia. Que tal adicionar o primeiro?</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showAddForm && (
                <AddMedModal
                    onClose={() => setShowAddForm(false)}
                    onSuccess={fetchData}
                    tid={tid}
                    suggestions={allUserTimes}
                />
            )}

            {editingMed && (
                <EditMedModal
                    med={editingMed}
                    onClose={() => setEditingMed(null)}
                    onSuccess={fetchData}
                    tid={tid}
                    suggestions={allUserTimes}
                />
            )}

            {showSettings && (
                <SettingsModal
                    user={user}
                    onClose={() => setShowSettings(false)}
                    onSuccess={fetchData}
                    tid={tid}
                />
            )}

            {/* Hidden Camera Input (for Vision, if we want to add it back) */}
            <input
                id="cam-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
            // onChange={...} // Vision logic would go here or be passed to modals
            />
        </div>
    )
}

export default function Home() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">💊 Carregando...</div>}>
            <MedsList />
        </Suspense>
    )
}
