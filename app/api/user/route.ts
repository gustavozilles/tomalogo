import { prisma } from '../../../lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

async function getUser(req: NextRequest) {
    const tidStr = req.headers.get("x-telegram-id")
    if (!tidStr) return null

    try {
        const telegramId = BigInt(tidStr)
        return await prisma.user.findUnique({ where: { telegramId } })
    } catch {
        return null
    }
}

export async function PATCH(req: NextRequest) {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 })

    const body = await req.json()
    const { doctorPhone, phoneNumber, naggingInterval } = body

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
            doctorPhone,
            phoneNumber,
            naggingInterval: naggingInterval !== undefined ? parseInt(naggingInterval) : undefined
        }
    })

    return NextResponse.json(updated)
}
