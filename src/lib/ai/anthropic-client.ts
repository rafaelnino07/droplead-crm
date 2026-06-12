const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001'

type AnthropicContentBlock = {
    type: string
    text?: string
}

type AnthropicMessagesResponse = {
    content: AnthropicContentBlock[]
}

type GenerateTextInput = {
    system: string
    prompt: string
    maxTokens?: number
}

export async function generateText({
    system,
    prompt,
    maxTokens = 500,
}: GenerateTextInput): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
        throw new Error(
            'ANTHROPIC_API_KEY no está configurada. Define la variable de entorno para usar el AI Executive Summary Engine.'
        )
    }

    const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL

    const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            system,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        }),
    })

    if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(
            `Anthropic API respondió con error ${response.status}: ${errorBody}`
        )
    }

    const data = (await response.json()) as AnthropicMessagesResponse

    const text = data.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text ?? '')
        .join('\n')
        .trim()

    if (!text) {
        throw new Error('Anthropic API devolvió una respuesta vacía.')
    }

    return text
}
