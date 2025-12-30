import { bot } from '../../../lib/bot'
import { webhookCallback } from 'grammy'

export const dynamic = 'force-dynamic'

export const POST = webhookCallback(bot, 'std/http')

// Optional: GET to setup webhook easily
export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const webhookUrl = `${url.protocol}//${url.host}/api/bot`

        await bot.api.setWebhook(webhookUrl)
        return new Response(`Webhook set to ${webhookUrl}`)
    } catch (e) {
        return new Response(`Error: ${e}`, { status: 500 })
    }
}
