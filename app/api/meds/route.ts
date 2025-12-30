import { prisma } from '../../../lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Helper to get User ID (MVP: Insecure header/query, TODO: Validate InitData)
async function getUser(req: NextRequest) {
    const tidStr = req.headers.get("x-telegram-id") || req.nextUrl.searchParams.get("tid")
    if (!tidStr) return null

    // Ensure BigInt parsing works
    try {
        const telegramId = BigInt(tidStr)
        return await prisma.user.findUnique({ where: { telegramId } })
    } catch {
        return null
    }
}

export async function GET(req: NextRequest) {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 })

    const meds = await prisma.medication.findMany({
        where: { userId: user.id },
        orderBy: { name: 'asc' }
    })

    return NextResponse.json({
        user: {
            firstName: user.firstName,
            doctorPhone: user.doctorPhone,
            phoneNumber: user.phoneNumber,
            naggingInterval: user.naggingInterval,
            homeLat: user.homeLat,
            homeLon: user.homeLon
        },
        medications: meds
    })
}

// DELETE medication
export async function DELETE(req: NextRequest) {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 })

    const id = req.nextUrl.searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID missing" }, { status: 400 })

    // Verify ownership
    const existing = await prisma.medication.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.medication.delete({ where: { id } })
    return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 })

    const body = await req.json()
    // Validation would go here
    const { name, dosage, inventory, times } = body

    const med = await prisma.medication.create({
        data: {
            userId: user.id,
            name,
            dosage,
            inventory: parseInt(inventory) || 0,
            times: times ? JSON.stringify(times) : null // ["08:00"]
        }
    })

    return NextResponse.json(med)
}

// PATCH for updating schedule/inventory
export async function PATCH(req: NextRequest) {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 })

    const body = await req.json()
    const { id, times, inventory } = body

    // Verify ownership
    const existing = await prisma.medication.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updated = await prisma.medication.update({
        where: { id },
        data: {
            times: times !== undefined ? JSON.stringify(times) : undefined,
            inventory: inventory !== undefined ? parseInt(inventory) : undefined
        }
    })

    return NextResponse.json(updated)
}
