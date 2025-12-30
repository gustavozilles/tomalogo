import { bot } from './bot'
import { prisma } from './prisma'
import { MedicationService } from './services'
import { InlineKeyboard } from 'grammy'

export function startScheduler() {
    console.log("⏰ Scheduler started...")

    // Check every minute for reminders
    setInterval(() => {
        checkReminders().catch(e => console.error("[Scheduler Error]", e))
    }, 60 * 1000)

    // Daily Inventory Alert at 10:00 AM
    setInterval(() => {
        const now = new Date()
        const ptTime = now.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
        })
        if (ptTime === "10:00") {
            checkLowInventory().catch(e => console.error("[Inventory Check Error]", e))
        }
    }, 60 * 1000)
}

async function checkLowInventory() {
    console.log("[Scheduler] Running daily inventory check...")
    const users = await prisma.user.findMany({
        include: { medications: { where: { inventory: { lte: 15 } } } }
    })

    for (const user of users) {
        if (user.medications.length === 0) continue

        let message = `⚠️ **AVISO DE ESTOQUE BAIXO**\n\n`
        for (const med of user.medications) {
            message += `💊 *${med.name}*: Restam apenas **${med.inventory}** comprimidos.\n`
        }

        const buttons = new InlineKeyboard()

        if (user.doctorPhone) {
            const encodedMsg = encodeURIComponent(`Olá Doutor, aqui é o ${user.firstName}. Meu estoque de remédios está acabando (tenho menos de 15 un). Poderia me enviar uma nova receita?`)
            const waUrl = `https://wa.me/${user.doctorPhone}?text=${encodedMsg}`
            buttons.url("📲 Pedir Receita (WhatsApp)", waUrl).row()
        }

        buttons.url("📦 Ver Meu Estoque", `http://${process.env.PUBLIC_URL || "135.181.97.102"}:3000/?tid=${user.telegramId.toString()}`)

        try {
            await bot.api.sendMessage(Number(user.telegramId), message, {
                parse_mode: "Markdown",
                reply_markup: buttons
            })
        } catch (e) {
            console.error(`Failed to send low stock alert to ${user.telegramId}`, e)
        }
    }
}

async function checkReminders() {
    const now = new Date()
    const timeString = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo'
    })

    console.log(`[Scheduler] Scanning for active doses at ${timeString}...`)

    const meds = await prisma.medication.findMany({
        where: { times: { not: null } },
        include: { user: true }
    })

    console.log(`[Scheduler] Found ${meds.length} meds with inventory.`)

    // SMART BATCHING: Fetch all logs for these meds at once (1 Query)
    const medIds = meds.map(m => m.id)
    const dailyLogs = await MedicationService.getDailyLogs(medIds)

    // Group active reminders by TelegramID
    const pendingReminders = new Map<bigint, any[]>()
    // Group voice calls by phone+scheduledTime to avoid multiple calls
    const pendingCalls = new Map<string, { phone: string, meds: any[], scheduledTime: string, userId: string }>()

    for (const med of meds) {
        if (!med.times || med.remindAtHome) {
            if (med.remindAtHome) console.log(`[Scheduler] Skipping ${med.name} (RemindAtHome enabled)`)
            continue
        }

        let schedules: string[] = []
        try { schedules = JSON.parse(med.times) } catch {
            console.error(`[Scheduler] Error parsing times for ${med.name}: ${med.times}`)
            continue
        }

        for (const scheduledTime of schedules) {
            // efficient memory check instead of DB query
            const wasHandled = MedicationService.isDoseHandled(dailyLogs, med.id, scheduledTime)

            if (wasHandled) {
                continue
            }

            const diffMinutes = getMinutesDiff(scheduledTime, timeString)

            const isInitial = diffMinutes === 0
            // Exact match to avoid duplicates (reverted fuzzy window)
            const isNagInterval = diffMinutes > 0 && diffMinutes <= 10800 && diffMinutes % 15 === 0 // 10800 = 180 min * 60

            // Fix nagging check: diffMinutes is in minutes.
            const naggingCheck = diffMinutes > 0 && diffMinutes <= 180 && (diffMinutes % 15 === 0)

            if (isInitial || naggingCheck) {
                console.log(`[Scheduler] TRIGGER! ${med.name} (${scheduledTime}) - Diff: ${diffMinutes}m (Initial: ${isInitial}, Nag: ${naggingCheck})`)

                const protocol = med.user.naggingInterval || 30
                const shouldCall = diffMinutes > 0 && diffMinutes % protocol === 0 && med.user.phoneNumber

                if (shouldCall && med.user.phoneNumber) {
                    // Collect for grouped voice call instead of calling immediately
                    const callKey = `${med.user.phoneNumber}_${scheduledTime}`
                    if (!pendingCalls.has(callKey)) {
                        pendingCalls.set(callKey, {
                            phone: med.user.phoneNumber,
                            meds: [],
                            scheduledTime,
                            userId: med.userId
                        })
                    }
                    pendingCalls.get(callKey)!.meds.push(med)
                    // User requested NO Telegram message during call
                } else {
                    // Add to pending batch only if NOT calling
                    if (!pendingReminders.has(med.user.telegramId)) {
                        pendingReminders.set(med.user.telegramId, [])
                    }
                    const list = pendingReminders.get(med.user.telegramId)!

                    if (!list.find(m => m.id === med.id && m.scheduledTime === scheduledTime)) {
                        list.push({ ...med, scheduledTime, diffMinutes })
                    }
                }
            }
        }
    }

    // Process Telegram Batches (Parallel)
    const telegramPromises = Array.from(pendingReminders).map(([telegramId, reminders]) =>
        sendGroupedReminder(telegramId, reminders)
    )
    await Promise.all(telegramPromises)

    // Process Voice Calls (ONE per user+time group)
    for (const [callKey, callData] of pendingCalls) {
        const medNames = callData.meds.map(m => m.name).join(', ')
        console.log(`[Scheduler] TRIGGER GROUPED VOICE! ${medNames} to ${callData.phone}`)
        await triggerGroupedVoiceCall(callData.phone, callData.meds, callData.scheduledTime)
    }
}

function getMinutesDiff(startStr: string, currentStr: string) {
    const [sh, sm] = startStr.split(':').map(Number)
    const [ch, cm] = currentStr.split(':').map(Number)

    let diff = (ch * 60 + cm) - (sh * 60 + sm)
    // Handle midnight wrap if needed, but for medications it's usually daily
    return diff
}

async function sendGroupedReminder(telegramId: bigint, meds: any[]) {
    try {
        const title = meds.length > 1 ? "☀️ **Hora dos Remédios!**" : "☀️ **Hora do Remédio!**"
        let body = `${title}\n\n`
        const keyboardRows: any[][] = []

        // Use the scheduled time from the first med since they are grouped by time
        const timeKey = meds[0].scheduledTime

        for (const med of meds) {
            const stockStatus = med.inventory <= 15 ? "⚠️ Baixo" : `${med.inventory}`
            const lateMsg = med.diffMinutes > 0 ? ` (Atrasado ${med.diffMinutes}m)` : ""

            body += `💊 *${med.name}* ${med.dosage || ""}\n📦 Est: ${stockStatus}${lateMsg}\n\n`

            // Individual buttons with scheduledTime encoded
            keyboardRows.push([
                { text: `✅ Só ${med.name.split(' ')[0]}`, callback_data: `take_${med.id}_${med.scheduledTime}` },
                { text: "🏠 Casa", callback_data: `snooze_home_${med.id}` }
            ])
        }

        // Global Actions using the common time instead of list of IDs
        const globalActions = [
            { text: "✅ Tomar Todos", callback_data: `take_all_time_${timeKey}` }
        ]

        const secondaryActions = [
            { text: "💤 Adiar Tudo 15m", callback_data: `snooze_all_15` },
            { text: "🗑️ Descartar Tudo", callback_data: `discard_all_time_${timeKey}` }
        ]

        // Prepend global actions
        const finalKeyboard = [globalActions, secondaryActions, ...keyboardRows]

        await bot.api.sendMessage(Number(telegramId), body, {
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: finalKeyboard }
        })
    } catch (e) {
        console.error(`Failed to send grouped reminder to ${telegramId}: ${e}`)
    }
}

async function triggerGroupedVoiceCall(phone: string, meds: any[], scheduledTime: string) {
    const medNames = meds.map(m => m.name).join(', ')
    const firstMedId = meds[0].id // Use first med ID for the takeAllAtTime lookup
    console.log(`[📞 Voice Call] Triggering to ${phone} for: ${medNames}`)
    const publicUrl = process.env.PUBLIC_URL || "135.181.97.102"

    try {
        const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
        await client.calls.create({
            url: `http://${publicUrl}:3000/api/twilio?medName=${encodeURIComponent(medNames)}&medId=${firstMedId}&scheduledTime=${scheduledTime}`,
            to: phone,
            from: process.env.TWILIO_PHONE_NUMBER
        })
    } catch (e) {
        console.error("Twilio call failed", e)
    }
}
