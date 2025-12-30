'use client'

interface InventoryBarProps {
    current: number
    max?: number
}

export function InventoryBar({ current, max = 30 }: InventoryBarProps) {
    const percentage = Math.min(100, Math.max(0, (current / max) * 100))

    // Color based on percentage
    let colorClass = 'bg-green-500'
    let bgClass = 'bg-green-100'

    if (percentage <= 20) {
        colorClass = 'bg-red-500'
        bgClass = 'bg-red-100'
    } else if (percentage <= 50) {
        colorClass = 'bg-yellow-500'
        bgClass = 'bg-yellow-100'
    }

    return (
        <div className="flex items-center gap-2">
            <div className={`flex-1 h-2 ${bgClass} rounded-full overflow-hidden`}>
                <div
                    className={`h-full ${colorClass} rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className={`text-sm font-bold min-w-[2rem] text-right ${percentage <= 20 ? 'text-red-500' : percentage <= 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                {current}
            </span>
        </div>
    )
}
