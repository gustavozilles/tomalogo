
import { prisma } from '../lib/prisma'

async function main() {
    console.log('--- MEDICATIONS ---')
    const meds = await prisma.medication.findMany({
        include: { user: true }
    })

    meds.forEach(m => {
        console.log(`[${m.user.firstName}] ${m.name} | Inv: ${m.inventory} | Times: ${m.times} | Home: ${m.remindAtHome}`)
    })

    console.log('\n--- RECENT LOGS (Last 24h) ---')
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const logs = await prisma.actionLog.findMany({
        where: { timestamp: { gte: since } },
        orderBy: { timestamp: 'desc' },
        take: 20
    })

    logs.forEach(l => {
        console.log(`${l.timestamp.toISOString()} | MedId: ${l.medicationId} | Action: ${l.action} | Sched: ${l.scheduledTime}`)
    })
}

main()
