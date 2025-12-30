import { useState } from 'react'

interface SettingsModalProps {
    onClose: () => void
    onSuccess: () => void
    tid: string
    user: any
}

export function SettingsModal({ onClose, onSuccess, tid, user }: SettingsModalProps) {
    const [formDoctor, setFormDoctor] = useState(user?.doctorPhone || "")
    const [formPhone, setFormPhone] = useState(user?.phoneNumber || "")
    const [formNagging, setFormNagging] = useState(user?.naggingInterval || 30)
    const [saving, setSaving] = useState(false)

    async function saveSettings() {
        if (!tid) return
        setSaving(true)
        await fetch('/api/user', {
            method: 'PATCH',
            headers: { 'x-telegram-id': tid },
            body: JSON.stringify({
                doctorPhone: formDoctor,
                phoneNumber: formPhone,
                naggingInterval: formNagging
            })
        })
        setSaving(false)
        onSuccess()
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 animate-in fade-in duration-200">
            {/* Header */}
            <div className="sticky top-0 z-10 px-6 py-4 flex justify-between items-center">
                <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white font-medium transition"
                >
                    ✕ Fechar
                </button>
                <h1 className="text-white font-bold text-lg">⚙️ Preferências</h1>
                <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="bg-white text-blue-600 font-bold px-4 py-2 rounded-xl shadow-lg active:scale-95 transition disabled:opacity-50"
                >
                    {saving ? '...' : 'Salvar'}
                </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-20 pt-4 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">

                {/* Greeting Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
                    <p className="text-white/60 text-sm">Olá,</p>
                    <p className="text-white text-2xl font-bold">{user?.firstName || 'Campeão'} 👋</p>
                    <p className="text-white/60 text-sm mt-1">Ajuste suas preferências aqui.</p>
                </div>

                {/* Doctor Contact */}
                <div className="bg-white rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">🩺</span>
                        <div>
                            <p className="font-bold text-gray-800">Contato do Médico</p>
                            <p className="text-xs text-gray-400">WhatsApp para pedir receita</p>
                        </div>
                    </div>
                    <input
                        type="tel"
                        value={formDoctor}
                        onChange={e => setFormDoctor(e.target.value)}
                        placeholder="5511999999999"
                        className="w-full bg-gray-50 rounded-2xl p-4 text-lg font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* My Phone */}
                <div className="bg-white rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">📱</span>
                        <div>
                            <p className="font-bold text-gray-800">Meu Telefone</p>
                            <p className="text-xs text-gray-400">Pra gente te ligar se você esquecer</p>
                        </div>
                    </div>
                    <input
                        type="tel"
                        value={formPhone}
                        onChange={e => setFormPhone(e.target.value)}
                        placeholder="5511999999999"
                        className="w-full bg-gray-50 rounded-2xl p-4 text-lg font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Call Frequency */}
                <div className="bg-white rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">📞</span>
                        <div>
                            <p className="font-bold text-gray-800">Frequência das Chamadas</p>
                            <p className="text-xs text-gray-400">Intervalo entre os alertas de voz</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setFormNagging(30)}
                            className={`p-4 rounded-2xl font-bold text-lg transition ${formNagging === 30
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                : 'bg-gray-100 text-gray-500'
                                }`}
                        >
                            30 min
                        </button>
                        <button
                            onClick={() => setFormNagging(60)}
                            className={`p-4 rounded-2xl font-bold text-lg transition ${formNagging === 60
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                : 'bg-gray-100 text-gray-500'
                                }`}
                        >
                            1 hora
                        </button>
                    </div>
                </div>

                {/* Home Location */}
                <div className={`rounded-3xl p-6 shadow-xl ${user?.homeLat ? 'bg-green-50 border-2 border-green-200' : 'bg-orange-50 border-2 border-orange-200'}`}>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📍</span>
                        <div className="flex-1">
                            <p className="font-bold text-gray-800">Localização de Casa</p>
                            {user?.homeLat ? (
                                <p className="text-green-600 font-medium">✅ Configurada!</p>
                            ) : (
                                <>
                                    <p className="text-orange-600 font-medium">❌ Não configurada</p>
                                    <p className="text-xs text-orange-500 mt-1">Envie /casa no Telegram</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

