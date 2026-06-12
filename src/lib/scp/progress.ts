export function calculatePipelineProgress(
    progressPercentage: number
) {
    const value = Math.max(
        0,
        Math.min(100, progressPercentage)
    )

    return {
        percentage: value,
        normalized: value / 100,
    }
}