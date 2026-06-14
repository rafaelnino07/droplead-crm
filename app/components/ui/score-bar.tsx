type ScoreBarProps = {
    score: number
    label?: string
}

export function ScoreBar({ score, label }: ScoreBarProps) {
    return (
        <div>
            {label && <p className="text-neutral-500">{label}</p>}

            <div className="w-full bg-neutral-800 rounded-full h-2">
                <div
                    className="h-2 rounded-full"
                    style={{ width: `${score}%`, backgroundColor: `hsl(${score * 1.2}, 80%, 45%)` }}
                />
            </div>

            <p className="mt-2 text-xs text-neutral-500">{score}/100</p>
        </div>
    )
}
