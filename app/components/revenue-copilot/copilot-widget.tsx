'use client'

import { useState, type FormEvent } from 'react'

type Message = {
    role: 'user' | 'assistant'
    text: string
}

const SUGGESTED_QUESTIONS = ['¿Qué debo cerrar hoy?', '¿Cuánto tengo en riesgo?', '¿Cuál es mi mejor oportunidad?']

export default function CopilotWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [assistantName, setAssistantName] = useState<string>(() =>
        typeof window !== 'undefined' ? localStorage.getItem('assistant_name') || '' : ''
    )
    const [isNaming, setIsNaming] = useState(false)

    async function sendQuestion(question: string) {
        const trimmed = question.trim()
        if (!trimmed || isLoading) return

        setMessages((prev) => [...prev, { role: 'user', text: trimmed }])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/revenue-copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: trimmed }),
            })

            const data = await response.json()

            const answerText: string = response.ok
                ? data.answer
                : data.error ?? 'No pude procesar tu pregunta. Intenta de nuevo.'

            setMessages((prev) => [...prev, { role: 'assistant', text: answerText }])
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', text: 'No pude conectar con el Revenue Copilot. Intenta de nuevo.' },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        sendQuestion(input)
    }

    function saveAssistantName(value: string) {
        const trimmed = value.trim()
        if (trimmed) {
            localStorage.setItem('assistant_name', trimmed)
            setAssistantName(trimmed)
        }
        setIsNaming(false)
    }

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 rounded-full bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-violet-500"
            >
                {assistantName ? `🤖 ${assistantName}` : '🤖 Asistente'}
            </button>
        )
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex h-[480px] w-[380px] flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
                <div className="flex items-center gap-2">
                    {assistantName ? (
                        <div>
                            <p className="font-semibold text-white">{assistantName}</p>
                            <p className="text-xs text-neutral-400">Tu asistente comercial</p>
                        </div>
                    ) : (
                        <p className="font-semibold text-white">🤖 Asistente Comercial</p>
                    )}
                    <button
                        type="button"
                        onClick={() => setIsNaming((prev) => !prev)}
                        className="text-neutral-400 transition-colors hover:text-white"
                    >
                        ✏️
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-neutral-400 transition-colors hover:text-white"
                >
                    ✕
                </button>
            </div>

            {isNaming && (
                <div className="border-b border-neutral-800 px-4 py-3">
                    <input
                        type="text"
                        autoFocus
                        defaultValue={assistantName}
                        placeholder="Ponle nombre a tu asistente... (Atlas, Nova, Diego...)"
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                saveAssistantName(event.currentTarget.value)
                            }
                        }}
                        onBlur={(event) => saveAssistantName(event.currentTarget.value)}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-neutral-500">Ejemplos: Atlas · Nova · Hermes · Bruno · Vega</p>
                </div>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 ? (
                    <div>
                        <p className="text-sm text-neutral-400">
                            {assistantName ? `Hola, soy ${assistantName}. ¿En qué te ayudo hoy?` : '¿En qué te puedo ayudar hoy?'}
                        </p>
                        <div className="mt-3 space-y-2">
                            {SUGGESTED_QUESTIONS.map((question) => (
                                <button
                                    key={question}
                                    type="button"
                                    onClick={() => sendQuestion(question)}
                                    className="block w-full rounded-lg border border-neutral-700 px-3 py-2 text-left text-sm text-neutral-300 transition-colors hover:border-neutral-600 hover:text-white"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <p
                                className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                                    message.role === 'user' ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-neutral-200'
                                }`}
                            >
                                {message.text}
                            </p>
                        </div>
                    ))
                )}

                {isLoading && (
                    <div className="flex justify-start">
                        <p className="rounded-xl bg-neutral-800 px-3 py-2 text-sm text-neutral-400">...</p>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-neutral-800 p-3">
                <input
                    type="text"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Escribe tu pregunta..."
                    disabled={isLoading}
                    className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Enviar
                </button>
            </form>
        </div>
    )
}
