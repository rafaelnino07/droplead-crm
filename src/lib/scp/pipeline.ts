import { CLIENT_STAGES } from './stages'

export function buildPipeline(clients: any[]) {
    return CLIENT_STAGES.map((stage) => ({
        ...stage,
        clients: clients.filter(
            (client) => client.stage === stage.key
        ),
    }))
}