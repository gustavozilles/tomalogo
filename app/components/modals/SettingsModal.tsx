import { useState } from 'react'

interface AddMedModalProps {
    onClose: () => void
    onSuccess: () => void
    tid: string
    user: any // Replace with proper User interface
}

export function SettingsModal({ onClose, onSuccess, tid, user }: AddMedModalProps) {
    const [formDoctor, setFormDoctor] = useState(user?.doctorPhone || "")
    const [formPhone, setFormPhone] = useState(user?.phoneNumber || "")
    const [formNagging, setFormNagging] = useState(user?.naggingInterval || 30)

    async function saveSettings() {
        if (!tid) return
        await fetch('/api/user', {
            method: 'PATCH',
            headers: { 'x-telegram-id': tid },
            body: JSON.stringify({
                doctorPhone: formDoctor,
                phoneNumber: formPhone,
                naggingInterval: formNagging
            })
        })
        onSuccess()
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100] overflow-hidden">
            <div className="bg-white rounded-t-[40px] sm:rounded-[40px] w-full max-w-md p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 sm:hidden"></div>
                <h3 className="text-2xl font-black mb-6 italic">Minhas Preferências</h3>

                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-2">Contato do Médico (WhatsApp)</label>
                        <input
                            type="text"
                            value={formDoctor}
                            onChange={e => setFormDoctor(e.target.value)}
                            placeholder="Ex: 5511999999999"
                            className="w-full bg-gray-50 border-0 rounded-2xl p-4 mt-1 outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <p className="text-[10px] text-gray-400 mt-2 px-2 italic">Facilita pedir receita quando o estoque estiver baixo.</p>
                    </div>

                    <div>
                        <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-2">Meu Telefone (DDI+DDD+Num)</label>
                        <input
                            type="text"
                            value={formPhone}
                            onChange={e => setFormPhone(e.target.value)}
                            placeholder="Ex: 5511999999999"
                            className="w-full bg-gray-50 border-0 rounded-2xl p-4 mt-1 outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <p className="text-[10px] text-gray-400 mt-2 px-2 italic">Pra gente te ligar se você esquecer de tomar.</p>
                    </div>

                    <div>
                        <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-2">Frequência das Chamadas</label>
                        <div className="grid grid-cols-2 gap-4 mt-1">
                            <button
                                onClick={() => setFormNagging(30)}
                                className={`p-4 rounded-2xl font-bold transition ${formNagging === 30 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}
                            >
                                30 Minutos
                            </button>
                            <button
                                onClick={() => setFormNagging(60)}
                                className={`p-4 rounded-2xl font-bold transition ${formNagging === 60 ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}
                            >
                                1 Hora
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 px-2 italic">O intervalo entre os chamados se você não responder.</p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 italic">
                        <p className="text-xs text-blue-800 font-bold mb-1">📍 Localização de Casa</p>
                        <p className="text-xs text-blue-600">
                            {user?.homeLat ? "✅ Configurada!" : "❌ Não configurada."}
                        </p>
                        {!user?.homeLat && <p className="text-[10px] text-blue-400 mt-1">Mande o comando /casa no bot para configurar.</p>}
                    </div>
                </div>

                <div className="flex gap-4 mt-10">
                    <button onClick={onClose} className="flex-1 py-4 font-bold text-gray-400 transition">Fechar</button>
                    <button onClick={saveSettings} className="flex-2 bg-blue-600 text-white font-black py-4 px-8 rounded-2xl shadow-xl transition active:scale-95">Salvar</button>
                </div>
            </div>
        </div>
    )
}
