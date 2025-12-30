// scripts/dev-bot.ts
import { bot } from '../lib/bot'
import { startScheduler } from '../lib/scheduler'

async function run() {
    console.log("🤖 Starting Bot in Polling Mode...")

    // 1. Delete webhook if exists (polling and webhook cannot coexist)
    await bot.api.deleteWebhook()
    console.log("✅ Webhook deleted")

    // 2. Start polling
    startScheduler()

    await bot.start({
        onStart: (botInfo) => {
            console.log(`🚀 Bot @${botInfo.username} is running!`)
        }
    })
}

run().catch(console.error)
