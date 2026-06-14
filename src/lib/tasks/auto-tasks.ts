export type AutoTaskTrigger =
    | 'client_created'
    | 'stage_changed'
    | 'quote_sent'
    | 'quote_viewed'
    | 'quote_accepted'
    | 'quote_rejected'
    | 'no_response'
    | 'call_completed'
    | 'whatsapp_sent'
    | 'meeting_completed'
    | 'site_visit_completed'
    | 'proposal_sent'
    | 'verbal_acceptance'
    | 'budget_confirmed'
    | 'plans_received'

export type AutoTaskSuggestion = {
    title: string
    description: string
    type: string
    priority: 'Alta' | 'Media' | 'Baja'
    due_in_hours: number
} | null

export function generateAutoTask(trigger: AutoTaskTrigger): AutoTaskSuggestion {
    switch (trigger) {
        case 'client_created':
            return { title: 'Calificar lead', description: 'Confirmar presupuesto, urgencia y próximo paso.', type: 'follow_up', priority: 'Alta', due_in_hours: 24 }
        case 'call_completed':
        case 'whatsapp_sent':
            return { title: 'Follow up si no hay respuesta', description: 'Si el cliente no responde en 3 días, hacer seguimiento.', type: 'follow_up', priority: 'Media', due_in_hours: 72 }
        case 'meeting_completed':
        case 'site_visit_completed':
            return { title: 'Enviar cotización', description: 'Preparar y enviar propuesta comercial en máximo 48 horas.', type: 'quote', priority: 'Alta', due_in_hours: 48 }
        case 'plans_received':
            return { title: 'Elaborar cotización con planos', description: 'Revisar planos recibidos y preparar propuesta técnica.', type: 'quote', priority: 'Alta', due_in_hours: 48 }
        case 'budget_confirmed':
            return { title: 'Presentar propuesta ajustada al presupuesto', description: 'El cliente confirmó presupuesto. Ajustar y enviar cotización.', type: 'quote', priority: 'Alta', due_in_hours: 24 }
        case 'proposal_sent':
        case 'quote_sent':
            return { title: 'Follow up de cotización', description: 'Contactar al cliente para resolver dudas y avanzar la decisión.', type: 'follow_up', priority: 'Alta', due_in_hours: 72 }
        case 'quote_viewed':
            return { title: 'Contactar ahora — vio la cotización', description: 'El cliente acaba de abrir la propuesta. Es el momento ideal para llamar.', type: 'call', priority: 'Alta', due_in_hours: 2 }
        case 'no_response':
            return { title: 'Reintento de contacto', description: 'El cliente no respondió. Intentar por otro canal.', type: 'follow_up', priority: 'Media', due_in_hours: 48 }
        case 'verbal_acceptance':
            return { title: 'Confirmar arranque del proyecto', description: 'Aceptación verbal recibida. Definir fechas, contrato y anticipo.', type: 'follow_up', priority: 'Alta', due_in_hours: 24 }
        case 'quote_accepted':
            return { title: 'Coordinar inicio de proyecto', description: 'Proyecto ganado. Agendar kick-off y definir entregables.', type: 'visit', priority: 'Alta', due_in_hours: 48 }
        case 'quote_rejected':
            return { title: 'Entender motivo de rechazo', description: 'Contactar para conocer por qué rechazó y documentar aprendizaje.', type: 'call', priority: 'Media', due_in_hours: 24 }
        default:
            return null
    }
}
