export type QuickActionCategory = 'touchpoint' | 'discovery' | 'milestone'

export type QuickActionType =
    | 'call_completed'
    | 'whatsapp_sent'
    | 'email_sent'
    | 'site_visit_completed'
    | 'meeting_completed'
    | 'demo_presented'
    | 'no_response'
    | 'decision_maker_identified'
    | 'budget_confirmed'
    | 'competitor_identified'
    | 'target_date_defined'
    | 'plans_received'
    | 'proposal_sent'
    | 'verbal_acceptance'
    | 'project_won'
    | 'project_lost'

export const QUICK_ACTION_CATEGORIES: {
    key: QuickActionCategory
    label: string
}[] = [
        { key: 'touchpoint', label: 'Touchpoints' },
        { key: 'discovery', label: 'Descubrimientos' },
        { key: 'milestone', label: 'Hitos SCP' },
    ]

export const QUICK_ACTIONS: {
    key: QuickActionType
    label: string
    title: string
    description: string
    category: QuickActionCategory
}[] = [
        // Touchpoints (acciones ejecutadas)
        {
            key: 'call_completed',
            label: 'Llamada realizada',
            title: 'Llamada realizada',
            description: 'Se registró una llamada con el cliente.',
            category: 'touchpoint',
        },
        {
            key: 'whatsapp_sent',
            label: 'WhatsApp enviado',
            title: 'WhatsApp enviado',
            description: 'Se envió un mensaje de WhatsApp al cliente.',
            category: 'touchpoint',
        },
        {
            key: 'email_sent',
            label: 'Correo enviado',
            title: 'Correo enviado',
            description: 'Se envió un correo al cliente.',
            category: 'touchpoint',
        },
        {
            key: 'site_visit_completed',
            label: 'Visita a obra realizada',
            title: 'Visita a obra realizada',
            description: 'Se realizó una visita técnica al sitio del proyecto.',
            category: 'touchpoint',
        },
        {
            key: 'meeting_completed',
            label: 'Reunión realizada',
            title: 'Reunión realizada',
            description: 'Se completó una reunión con el cliente.',
            category: 'touchpoint',
        },
        {
            key: 'demo_presented',
            label: 'Demo presentada',
            title: 'Demo presentada',
            description: 'Se presentó una demostración al cliente.',
            category: 'touchpoint',
        },
        {
            key: 'no_response',
            label: 'Sin respuesta',
            title: 'Sin respuesta',
            description: 'El cliente no respondió al intento de contacto.',
            category: 'touchpoint',
        },

        // Descubrimientos comerciales
        {
            key: 'decision_maker_identified',
            label: 'Decisor identificado',
            title: 'Decisor identificado',
            description: 'Se identificó al tomador de decisión del proyecto.',
            category: 'discovery',
        },
        {
            key: 'budget_confirmed',
            label: 'Presupuesto confirmado',
            title: 'Presupuesto confirmado',
            description: 'El cliente confirmó su presupuesto.',
            category: 'discovery',
        },
        {
            key: 'competitor_identified',
            label: 'Competidor identificado',
            title: 'Competidor identificado',
            description: 'Se identificó que el cliente está evaluando a un competidor.',
            category: 'discovery',
        },
        {
            key: 'target_date_defined',
            label: 'Fecha objetivo definida',
            title: 'Fecha objetivo definida',
            description: 'El cliente definió una fecha objetivo para el proyecto.',
            category: 'discovery',
        },
        {
            key: 'plans_received',
            label: 'Planos recibidos',
            title: 'Planos recibidos',
            description: 'Se recibieron planos o documentación técnica del cliente.',
            category: 'discovery',
        },

        // Hitos SCP
        {
            key: 'proposal_sent',
            label: 'Propuesta enviada',
            title: 'Propuesta enviada',
            description: 'Se envió la propuesta comercial al cliente.',
            category: 'milestone',
        },
        {
            key: 'verbal_acceptance',
            label: 'Aceptación verbal',
            title: 'Aceptación verbal',
            description: 'El cliente dio aceptación verbal al proyecto.',
            category: 'milestone',
        },
        {
            key: 'project_won',
            label: 'Proyecto ganado',
            title: 'Proyecto ganado',
            description: 'El proyecto fue cerrado y ganado.',
            category: 'milestone',
        },
        {
            key: 'project_lost',
            label: 'Proyecto perdido',
            title: 'Proyecto perdido',
            description: 'El proyecto fue marcado como perdido.',
            category: 'milestone',
        },
    ]
