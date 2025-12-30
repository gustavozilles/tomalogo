import { Bot, Context, session, InlineKeyboard } from 'grammy'
import { prisma } from './prisma'
import { MedicationService } from './services'
import { calculateDistance, getStartOfDay } from './utils'

// 1. Define custom context type (if we need session data later)
export type BotContext = Context & {
    // Add custom properties here
}

// 2. Initialize Bot
const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) throw new Error("TELEGRAM_BOT_TOKEN not found")

export const bot = new Bot<BotContext>(token)

// 3. Middleware: Auto-Register User
bot.use(async (ctx, next) => {
    if (ctx.from?.id && ctx.chat?.type === 'private') {
        const telegramId = BigInt(ctx.from.id)
        try {
            const user = await prisma.user.findUnique({ where: { telegramId } })
            if (!user) {
                await prisma.user.create({
                    data: {
                        telegramId,
                        username: ctx.from.username,
                        firstName: ctx.from.first_name,
                        timezone: 'America/Sao_Paulo'
                    }
                })
                console.log(`[New User] ${ctx.from.first_name} (${telegramId})`)
            }
        } catch (e) {
            console.error("User registration error", e)
        }
    }
    await next()
})

// 4. Commands

bot.command("start", async (ctx) => {
    await ctx.reply(`👋 Olá ${ctx.from?.first_name}! Eu sou o TomaAgora.
  
Vou te encher o saco até você tomar seus remédios. 💊

Comandos:
➕ /add - Adicionar novo remédio
📋 /remedios - Ver seus remédios
📸 Mande uma foto para eu contar pílulas (Em breve)
  `)
})

bot.command("remedios", async (ctx) => {
    const telegramId = BigInt(ctx.from!.id)

    try {
        const user = await prisma.user.findUnique({
            where: { telegramId },
            include: { medications: true }
        })

        if (!user || user.medications.length === 0) {
            return ctx.reply("✨ Você ainda não tem remédios cadastrados.\n\nUse `/add [Nome] [Dose] [Qtd]` ou clique no botão abaixo para gerenciar pelo app!", {
                parse_mode: "Markdown",
                reply_markup: new InlineKeyboard().url("⚙️ Abrir App de Estoque", `http://${process.env.PUBLIC_URL || "135.181.97.102"}:3000/?tid=${telegramId.toString()}`)
            })
        }

        const morning: string[] = []
        const afternoon: string[] = []
        const evening: string[] = []
        const noTime: string[] = []

        for (const med of user.medications) {
            const entry = `• *${med.name}* (${med.dosage}) - \`${med.inventory}\` un.`

            if (!med.times) {
                noTime.push(entry)
                continue
            }

            try {
                const times = JSON.parse(med.times) as string[]
                if (times.length === 0) {
                    noTime.push(entry)
                    continue
                }

                for (const time of times) {
                    const hour = parseInt(time.split(":")[0])
                    if (hour >= 5 && hour < 12) morning.push(`• *${med.name}* (\`${time}\`)`)
                    else if (hour >= 12 && hour < 18) afternoon.push(`• *${med.name}* (\`${time}\`)`)
                    else evening.push(`• *${med.name}* (\`${time}\`)`)
                }
            } catch {
                noTime.push(entry)
            }
        }

        let message = `💊 **SEU DASHBOARD DE SAÚDE**\n\n`

        if (morning.length > 0) message += `🌅 **MANHÃ** (05h - 12h)\n${morning.join("\n")}\n\n`
        if (afternoon.length > 0) message += `☀️ **TARDE** (12h - 18h)\n${afternoon.join("\n")}\n\n`
        if (evening.length > 0) message += `🌙 **NOITE** (18h - 05h)\n${evening.join("\n")}\n\n`
        if (noTime.length > 0) message += `📦 **OUTROS / SEM HORA**\n${noTime.join("\n")}\n\n`

        const publicHost = process.env.PUBLIC_URL || "135.181.97.102"
        const url = `http://${publicHost}:3000/?tid=${telegramId.toString()}`

        await ctx.reply(message, {
            parse_mode: "Markdown",
            reply_markup: new InlineKeyboard().url("⚙️ Gerenciar Estoque & Horários", url)
        })
    } catch (e) {
        console.error("Error in /remedios:", e)
        await ctx.reply("❌ Ocorreu um erro ao buscar seus remédios. Tente novamente.")
    }
})

// Action Handlers
// --- BULK ACTIONS ---
bot.callbackQuery(/^take_all_time_(.+)$/, async (ctx) => {
    const timeKey = ctx.match[1]
    const telegramId = BigInt(ctx.from!.id)

    // Normalize time format (e.g., "7:00" -> "07:00")
    const normalizeTime = (t: string): string => {
        const parts = t.split(':')
        if (parts.length !== 2) return t
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
    }
    const normalizedTimeKey = normalizeTime(timeKey)

    console.log(`[TakeAllTime] Callback triggered for time=${timeKey}, normalized=${normalizedTimeKey}`)

    try {
        const user = await prisma.user.findUnique({
            where: { telegramId },
            include: { medications: true }
        })
        if (!user) return

        const activeMeds = user.medications.filter(m => {
            if (!m.times) return false
            try {
                const times = JSON.parse(m.times) as string[]
                // Normalize all times before comparison
                return times.some(t => normalizeTime(t) === normalizedTimeKey)
            } catch { return false }
        })

        console.log(`[TakeAllTime] Found ${activeMeds.length} meds for ${normalizedTimeKey}`)

        const today = getStartOfDay()

        for (const med of activeMeds) {
            // Check current log to avoid double take
            const alreadyTaken = await prisma.actionLog.findFirst({
                where: {
                    medicationId: med.id,
                    timestamp: { gte: today },
                    action: "TAKEN",
                    scheduledTime: normalizedTimeKey
                }
            })

            if (!alreadyTaken) {
                await MedicationService.takeDose(med.id, normalizedTimeKey)
                console.log(`[TakeAllTime] Logged TAKEN for ${med.name} at ${normalizedTimeKey}`)
            } else {
                console.log(`[TakeAllTime] Already taken: ${med.name} at ${normalizedTimeKey}`)
            }
        }
        await ctx.answerCallbackQuery("Todos tomados! ✅")
        await ctx.editMessageText(`✅ **Todos os remédios das ${normalizedTimeKey} foram tomados!**\n\nContinue assim, campeão! 💪`, { parse_mode: "Markdown" })
    } catch (e) {
        console.error("Take All Error", e)
        await ctx.answerCallbackQuery("Erro ao registrar.")
    }
})

bot.callbackQuery(/^discard_all_time_(.+)$/, async (ctx) => {
    const timeKey = ctx.match[1]
    const telegramId = BigInt(ctx.from!.id)

    // Normalize time format
    const normalizeTime = (t: string): string => {
        const parts = t.split(':')
        if (parts.length !== 2) return t
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
    }
    const normalizedTimeKey = normalizeTime(timeKey)

    try {
        const user = await prisma.user.findUnique({
            where: { telegramId },
            include: { medications: true }
        })
        if (!user) return

        const activeMeds = user.medications.filter(m => {
            if (!m.times) return false
            try {
                const times = JSON.parse(m.times) as string[]
                return times.some(t => normalizeTime(t) === normalizedTimeKey)
            } catch { return false }
        })

        for (const med of activeMeds) {
            await MedicationService.skipDose(med.id, normalizedTimeKey)
        }
        await ctx.answerCallbackQuery("Todos descartados.")
        await ctx.editMessageText(`🗑️ **Notificações das ${normalizedTimeKey} descartadas.**`, { parse_mode: "Markdown" })
    } catch (e) {
        console.error("Discard All Error", e)
    }
})

bot.callbackQuery("snooze_all_15", async (ctx) => {
    await ctx.answerCallbackQuery("Adiado por 15m 💤")
    await ctx.deleteMessage()
})

// --- INDIVIDUAL ACTIONS ---
bot.callbackQuery(/^take_([^_]+)(?:_(.+))?$/, async (ctx) => {
    const medId = ctx.match[1]
    const scheduledTime = ctx.match[2] || null // Extract scheduledTime if present
    try {
        const { med, newInventory } = await MedicationService.takeDose(medId, scheduledTime)
        await ctx.editMessageText(`✅ **Tomado!**\n💊 ${med.name}\n📉 Estoque: ${newInventory}`, { parse_mode: "Markdown" })
    } catch (e: any) {
        console.error("Take Error", e)
        await ctx.answerCallbackQuery(e.message || "Erro ao tomar.")
    }
})

bot.callbackQuery(/^discard_(.+)$/, async (ctx) => {
    const medId = ctx.match[1]
    try {
        const { med } = await MedicationService.skipDose(medId)
        await ctx.editMessageText(`🗑️ **Dose descartada.**\n💊 ${med.name}\n\nO "nagging" para este horário foi encerrado.`, { parse_mode: "Markdown" })
    } catch (e: any) {
        await ctx.answerCallbackQuery("Erro: " + e.message)
    }
})

bot.command("casa", async (ctx) => {
    await ctx.reply("🏠 Por favor, envie sua localização (não precisa ser o Live Location agora) para eu salvar como sua **Home**.", {
        reply_markup: {
            keyboard: [[{ text: "📍 Enviar Minha Localização Atual", request_location: true }]],
            one_time_keyboard: true,
            resize_keyboard: true
        }
    })
})

bot.on("message:location", async (ctx) => {
    try {
        const telegramId = BigInt(ctx.from!.id)
        const { latitude, longitude } = ctx.message.location

        console.log(`[Location] Received from ${telegramId}: ${latitude}, ${longitude}`)

        await prisma.user.update({
            where: { telegramId },
            data: { homeLat: latitude, homeLon: longitude }
        })

        await ctx.reply(`✅ **Casa salva com sucesso!**\n\nAgora, quando você clicar em "Me lembre em casa" numa notificação, eu vou te avisar assim que chegar aqui.`, {
            parse_mode: "Markdown",
            reply_markup: { remove_keyboard: true }
        })
    } catch (e) {
        console.error("Error saving location:", e)
        await ctx.reply("❌ Erro ao salvar sua localização. Tente novamente.")
    }
})

bot.callbackQuery(/^snooze_home_(.+)$/, async (ctx) => {
    const medId = ctx.match[1]
    const telegramId = BigInt(ctx.from!.id)

    const user = await prisma.user.findUnique({ where: { telegramId } })

    console.log(`[GPS Snooze] User ${telegramId} requesting home snooze. HomeLat: ${user?.homeLat}`)

    if (!user?.homeLat) {
        return ctx.reply("❌ Você ainda não configurou sua casa. Use o comando /casa primeiro.")
    }

    await prisma.medication.update({
        where: { id: medId },
        data: { remindAtHome: true }
    })

    await ctx.answerCallbackQuery("Modo GPS ativado!")
    await ctx.editMessageText("📍 **Modo GPS ativado.**\n\nPor favor, compartilhe sua **Localização em Tempo Real** (Live Location) por 1h ou 8h para que eu possa te avisar quando você chegar em casa.", {
        parse_mode: "Markdown"
    })
})

// Listen for Live Location updates
bot.on("edited_message:location", async (ctx) => {
    const telegramId = BigInt(ctx.from!.id)
    const { latitude, longitude } = ctx.editedMessage.location!

    const user = await prisma.user.findUnique({
        where: { telegramId },
        include: { medications: { where: { remindAtHome: true } } }
    })

    if (!user || !user.homeLat || !user.homeLon || user.medications.length === 0) return

    const dist = calculateDistance(latitude, longitude, user.homeLat, user.homeLon)

    if (dist < 200) {
        for (const med of user.medications) {
            await ctx.reply(`🏠 **Você chegou em casa!**\n\nHora de tomar seu remédio:\n💊 *${med.name}* (${med.dosage})`, {
                parse_mode: "Markdown"
            })

            // Clear flag
            await prisma.medication.update({
                where: { id: med.id },
                data: { remindAtHome: false }
            })
        }
    }
})


bot.command("add", async (ctx) => {
    const rawArgs = ctx.match?.toString().split(" ") || []

    // Need at least 3 parts: Name (1+), Dose, Qty
    if (rawArgs.length < 3) {
        return ctx.reply("⚠️ Uso: `/add [Nome] [Dose] [Qtd]`\nEx: `/add Ritalina LA 10mg 30`", { parse_mode: "Markdown" })
    }

    // Parse from the end to allow spaces in name
    const inventoryStr = rawArgs.pop()!
    const dosage = rawArgs.pop()!
    const name = rawArgs.join(" ") // Rejoin the rest as name

    const inventory = parseInt(inventoryStr)

    if (isNaN(inventory)) {
        return ctx.reply("⚠️ A quantidade (último item) precisa ser um número.\nEx: `/add Ritalina 10mg 30`")
    }

    const telegramId = BigInt(ctx.from!.id)
    const user = await prisma.user.findUnique({ where: { telegramId } })

    if (user) {
        await prisma.medication.create({
            data: {
                userId: user.id,
                name,
                dosage,
                inventory
            }
        })
        await ctx.reply(`✅ **${name}** adicionado!\n📦 Dose: ${dosage}\n🔢 Qtd: ${inventory}`, { parse_mode: "Markdown" })
    }
})

bot.on("message:photo", (ctx) => {
    return ctx.reply("📸 Foto recebida! (Visão IA em desenvolvimento)")
})
