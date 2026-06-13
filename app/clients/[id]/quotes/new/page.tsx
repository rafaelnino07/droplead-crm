import { createQuote } from '../actions'

export default async function NewQuotePage({
    params,
}: {
    params: { id: string }
}) {
    await createQuote(params.id)

    return null
}
