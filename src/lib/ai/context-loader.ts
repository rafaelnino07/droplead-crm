import fs from 'fs'
import path from 'path'

type ContextType = 'deal-coach' | 'morning-brief' | 'general'

export function loadAIContext(type: ContextType): string {
    const contextDir = path.join(process.cwd(), 'src/lib/ai/context')

    const files: Record<ContextType, string[]> = {
        'deal-coach': ['sales-methodology.md', 'business-principles.md'],
        'morning-brief': ['business-principles.md'],
        'general': ['sales-methodology.md', 'business-principles.md'],
    }

    const filesToLoad = files[type] ?? []

    return filesToLoad
        .map((file) => {
            try {
                const filePath = path.join(contextDir, file)
                return fs.readFileSync(filePath, 'utf-8')
            } catch {
                console.warn(`Context file not found: ${file}`)
                return ''
            }
        })
        .filter(Boolean)
        .join('\n\n---\n\n')
}
