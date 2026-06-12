export type ActionQueueItem = {
    clientId: string
    clientName: string
    priority: 'Alta' | 'Media' | 'Baja'
    action: string
    momentum: number
}

export function buildActionQueue(
    items: ActionQueueItem[]
) {
    const priorityScore = {
        Alta: 3,
        Media: 2,
        Baja: 1,
    }

    return [...items].sort((a, b) => {
        const p =
            priorityScore[b.priority] -
            priorityScore[a.priority]

        if (p !== 0) {
            return p
        }

        return b.momentum - a.momentum
    })
}