import { prisma } from '../../../lib/prisma'
import { MedicationService } from '../../../lib/services'
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'

export async function POST(req: Request) {
    const url = new URL(req.url)
    const medName = url.searchParams.get("medName") || "seu remédio"
    const medId = url.searchParams.get("medId")
    const scheduledTime = url.searchParams.get("scheduledTime")

    let digits = null
    const contentType = req.headers.get("content-type") || ""

    if (contentType.includes("form") || contentType.includes("multipart")) {
        try {
            const data = await req.formData()
            digits = data.get('Digits')
        } catch (e) {
            console.error("Twilio form data error:", e)
        }
    }

    const twiml = new VoiceResponse()

    if (digits) {
        if (digits === '1') {
            twiml.say({ voice: 'alice', language: 'pt-BR' }, 'Perfeito! Já registrei que você tomou todos. Até a próxima!')
            if (medId && scheduledTime) {
                try {
                    // Get the user from the medication to mark ALL their meds at this time
                    const med = await prisma.medication.findUnique({ where: { id: medId } })
                    if (med) {
                        const result = await MedicationService.takeAllAtTime(med.userId, scheduledTime)
                        console.log(`[Twilio] Marked ${result.count} meds as taken: ${result.meds.join(', ')}`)
                    }
                } catch (e) {
                    console.error("Twilio take all error", e)
                }
            }
        } else if (digits === '2') {
            twiml.say({ voice: 'alice', language: 'pt-BR' }, 'Combinado, vou te ligar novamente em breve. Não esqueça!')
            // Snooze is handled by the next scheduler check
        } else if (digits === '3') {
            twiml.say({ voice: 'alice', language: 'pt-BR' }, 'Entendido. Dose descartada. Tenha um bom dia.')
            if (medId) {
                try {
                    await MedicationService.skipDose(medId, scheduledTime)
                } catch (e) {
                    console.error("Twilio skip error", e)
                }
            }
        } else {
            twiml.say({ voice: 'alice', language: 'pt-BR' }, 'Opção inválida.')
        }
        twiml.hangup()
    } else {
        const gather = twiml.gather({
            numDigits: 1,
            timeout: 10,
        })

        const isMultiple = medName.includes(',')
        const medsText = isMultiple ? `os remédios: ${medName}` : `o remédio ${medName}`
        const actionText = isMultiple ? 'todos' : 'o remédio'

        gather.say({ voice: 'alice', language: 'pt-BR' },
            `Olá! Aqui é o Toma-Logo-Bot. Você tem um lembrete para ${medsText}. ` +
            `Digite 1 se você já tomou ${actionText}. Digite 2 para atrasar. Ou digite 3 para descartar.`
        )

        // If no input
        twiml.say({ voice: 'alice', language: 'pt-BR' }, 'Não entendi sua resposta. Vou te ligar novamente em breve.')
    }

    return new Response(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' }
    })
}
