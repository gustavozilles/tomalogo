import { prisma } from './prisma'
import { getStartOfDay } from './utils'

export class MedicationService {
    /**
     * Records a dose as taken. 
     * Handles inventory decrement and "smart" time inference if scheduleTime is missing.
     */
    static async takeDose(medId: string, scheduledTime?: string | null) {
        const med = await prisma.medication.findUnique({ where: { id: medId } })
        if (!med || med.inventory <= 0) {
            throw new Error("Medication not found or out of stock")
        }

        // 1. Decrement Inventory
        await prisma.medication.update({
            where: { id: medId },
            data: { inventory: { decrement: 1 } }
        })

        // 2. Infer Scheduled Time if not provided
        let determinedTime = scheduledTime
        if (!determinedTime && med.times) {
            try {
                const times = JSON.parse(med.times) as string[]
                // Find the closest time in the past (or very near future) that hasn't been handled today
                const now = new Date()
                const nowTotalMins = now.getHours() * 60 + now.getMinutes()

                // Sort times by minutes from midnight
                times.sort()

                let minDiff = Infinity
                let closest = null

                for (const t of times) {
                    const [h, m] = t.split(':').map(Number)
                    const tMins = h * 60 + m
                    const diff = Math.abs(nowTotalMins - tMins)
                    if (diff < minDiff) {
                        minDiff = diff
                        closest = t
                    }
                }
                determinedTime = closest || null
            } catch (e) {
                console.error("Error parsing times for inference:", e)
            }
        }

        // 3. Log Action
        const log = await prisma.actionLog.create({
            data: {
                userId: med.userId,
                medicationId: medId,
                action: "TAKEN",
                scheduledTime: determinedTime
            }
        })

        return { med, log, newInventory: med.inventory - 1, determinedTime }
    }

    /**
     * Records a dose as skipped/discarded.
     */
    static async skipDose(medId: string, scheduledTime?: string | null) {
        const med = await prisma.medication.findUnique({ where: { id: medId } })
        if (!med) throw new Error("Medication not found")

        const log = await prisma.actionLog.create({
            data: {
                userId: med.userId,
                medicationId: medId,
                action: "SKIPPED",
                scheduledTime: scheduledTime
            }
        })

        return { med, log }
    }

    /**
     * Takes ALL medications for a user at a specific scheduled time.
     * Used when confirming via phone call - marks all meds at that time as taken.
     */
    static async takeAllAtTime(userId: string, scheduledTime: string) {
        // Normalize the time
        const normalizeTime = (t: string): string => {
            const parts = t.split(':')
            if (parts.length !== 2) return t
            const h = parts[0].padStart(2, '0')
            const m = parts[1].padStart(2, '0')
            return `${h}:${m}`
        }
        const normalizedTime = normalizeTime(scheduledTime)

        // Find all medications for this user that have this scheduled time
        const allMeds = await prisma.medication.findMany({
            where: { userId, times: { not: null } }
        })

        const matchingMeds = allMeds.filter(med => {
            try {
                const times = JSON.parse(med.times!) as string[]
                return times.some(t => normalizeTime(t) === normalizedTime)
            } catch {
                return false
            }
        })

        console.log(`[TakeAllAtTime] Found ${matchingMeds.length} meds at ${normalizedTime} for user ${userId}`)

        const results = []
        for (const med of matchingMeds) {
            if (med.inventory > 0) {
                await prisma.medication.update({
                    where: { id: med.id },
                    data: { inventory: { decrement: 1 } }
                })

                await prisma.actionLog.create({
                    data: {
                        userId: med.userId,
                        medicationId: med.id,
                        action: "TAKEN",
                        scheduledTime: normalizedTime
                    }
                })
                results.push(med.name)
            }
        }

        return { count: results.length, meds: results }
    }

    /**
     * Efficiently fetches all action logs for today for a batch of medications.
     * Prevents N+1 query problem in scheduler.
     */
    static async getDailyLogs(medIds: string[]) {
        const startOfDay = getStartOfDay()

        return prisma.actionLog.findMany({
            where: {
                medicationId: { in: medIds },
                timestamp: { gte: startOfDay },
                action: { in: ['TAKEN', 'SKIPPED'] }
            }
        })
    }

    /**
     * Checks if a specific dose has been handled based on the pre-fetched logs.
     * Normalizes time format to handle cases like "7:00" vs "07:00".
     */
    static isDoseHandled(logs: any[], medId: string, scheduledTime: string) {
        const normalizeTime = (t: string | null | undefined): string => {
            if (!t) return ''
            const parts = t.split(':')
            if (parts.length !== 2) return t
            const h = parts[0].padStart(2, '0')
            const m = parts[1].padStart(2, '0')
            return `${h}:${m}`
        }

        const targetTime = normalizeTime(scheduledTime)

        return logs.some(log => {
            if (log.medicationId !== medId) return false

            // If log has no scheduledTime, it should NOT match any specific time
            if (!log.scheduledTime) return false

            const logTime = normalizeTime(log.scheduledTime)
            return logTime === targetTime
        })
    }
}
