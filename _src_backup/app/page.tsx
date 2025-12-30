'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AddMedModal } from './components/modals/AddMedModal'
import { EditMedModal } from './components/modals/EditMedModal'
import { SettingsModal } from './components/modals/SettingsModal'

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
    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">💊 Carregando seu estoque...</div>

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8 font-sans text-gray-900 pb-24">

            {/* Header / Greeting */}
            <header className="mb-8 flex justify-between items-start">
                <div>
                    <p className="text-blue-600 font-semibold mb-1">Bem-vindo de volta!</p>
                    <h1 className="text-3xl font-extrabold tracking-tight">
                        Oi, {user?.firstName || 'Campeão'}! 👋
                    </h1>
                    <p className="text-gray-500 mt-1">Aqui está o resumo dos seus remédios.</p>
                </div>
                <button
                    onClick={() => setShowSettings(true)}
                    className="p-3 bg-white rounded-2xl shadow-sm border border-white active:scale-95 transition"
                >
                    ⚙️
                </button>
            </header>

            {/* Stats / Quick Summary */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-sm transition hover:shadow-md cursor-pointer">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-2xl font-black text-blue-600">{meds.length}</p>
                </div>
                <div
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-200 flex flex-col justify-center items-center text-white active:scale-95 transition cursor-pointer"
                >
                    <span className="text-2xl font-bold">+</span>
                    <span className="text-xs font-bold uppercase">Novo</span>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {meds.map(med => {
                    let timesDisplay = "Sem horário"
                    try {
                        if (med.times) {
                            const t = JSON.parse(med.times)
                            if (Array.isArray(t) && t.length > 0) timesDisplay = t.join(" • ")
                        }
                    } catch { }

                    const isLow = med.inventory <= 15

                    return (
                        <div key={med.id} className="group relative overflow-hidden bg-white/80 backdrop-blur-lg rounded-3xl p-5 border border-white shadow-sm hover:shadow-xl transition-all duration-300">
                            {isLow && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter">Estoque Baixo</div>}

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-800">{med.name}</h2>
                                    <p className="text-sm font-medium text-gray-400">{med.dosage}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-2xl font-black ${isLow ? 'text-red-500' : 'text-blue-600'}`}>
                                        {med.inventory}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-widest">Unidades</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold">
                                    <span>⏰</span> {timesDisplay}
                                </div>
                                <button
                                    onClick={() => setEditingMed(med)}
                                    className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition"
                                >
                                    Editar
                                </button>
                            </div>
                        </div>
                    )
                })}

                {meds.length === 0 && !showAddForm && (
                    <div className="text-center py-20 opacity-30 grayscale">
                        <span className="text-6xl mb-4 block">📦</span>
                        <p className="font-bold">Nenhum remédio por aqui.</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showAddForm && (
                <AddMedModal
                    onClose={() => setShowAddForm(false)}
                    onSuccess={fetchData}
                    tid={tid}
                />
            )}

            {editingMed && (
                <EditMedModal
                    med={editingMed}
                    onClose={() => setEditingMed(null)}
                    onSuccess={fetchData}
                    tid={tid}
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
