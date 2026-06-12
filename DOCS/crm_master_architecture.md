# DROPLEAD CRM — MASTER ARCHITECTURE

## Visión

Droplead CRM no es un CRM tradicional.

La misión del producto es ayudar a empresas de servicios premium (domótica, remodelación, construcción, arquitectura, ingeniería especializada, etc.) a identificar oportunidades, priorizar acciones comerciales y cerrar más proyectos.

El CRM debe evolucionar hacia un Sistema Comercial Predecible (SCP), donde la plataforma no solo almacena información, sino que recomienda acciones y mide el avance real de cada oportunidad.

---

# Stack Tecnológico

Frontend:

* Next.js 14
* TypeScript
* TailwindCSS

Backend:

* Supabase

Auth:

* Supabase Auth

Base de datos:

* PostgreSQL (Supabase)

---

# Principios Arquitectónicos

## Multi-Tenant Obligatorio

Toda entidad de negocio debe pertenecer a una organización.

Campos requeridos:

organization_id

Tablas afectadas:

* profiles
* clients
* quotes
* client_activities
* client_scores
* futuras tablas

Nunca almacenar datos comerciales sin organization_id.

---

## RLS Obligatorio

Toda tabla nueva debe:

1. Enable RLS
2. Policies SELECT
3. Policies INSERT
4. Policies UPDATE

Nunca crear tablas sin RLS.

---

## Single Source of Truth

No duplicar información.

Ejemplo:

Cliente:

* nombre
* correo
* teléfono

deben vivir únicamente en clients.

Las cotizaciones referencian al cliente.

---

# Estado Actual del Proyecto

Implementado:

* Auth

* Register

* Login

* Logout

* Middleware protegido

* Organizations

* Profiles

* Onboarding

* Clients

* Client Detail

* Quotes

* Quote Detail

* Quote Edit

* Client Activities

* Timeline Comercial

* Momentum Engine v0

---

# Entidades Principales

## Organizations

Representa una empresa.

Campos importantes:

* id
* name
* slug

Futuro:

* currency
* settings
* branding

---

## Profiles

Representa un usuario.

Campos:

* user_id
* organization_id
* role

Roles:

* owner
* admin
* sales_rep

---

## Clients

Representa una oportunidad comercial.

Campos actuales:

* name
* email
* phone
* company

Futuro:

* stage
* source
* budget
* timeframe
* decision_makers

---

## Quotes

Representa una propuesta comercial.

Estados:

* draft
* sent
* viewed
* accepted
* rejected

Templates válidos:

* classic
* modern
* minimal

---

## Client Activities

Representa eventos comerciales.

Tipos actuales:

* client_created
* proposal_created

Tipos futuros:

* note_added
* call_logged
* meeting_completed
* proposal_sent
* proposal_viewed
* proposal_accepted
* proposal_rejected
* stage_changed
* budget_confirmed
* plans_received

---

## Client Scores

Representa métricas calculadas.

No editar manualmente.

Debe ser generado por motores internos.

---

# Sistema SCP

SCP = Sistema Comercial Predecible

Objetivo:

Transformar actividad comercial en indicadores accionables.

---

# Momentum Comercial

Pregunta:

¿Qué tan viva está esta oportunidad?

Escala:

0-100

Niveles:

0-25
Crítico

26-50
Frío

51-70
Activo

71-85
Caliente

86-100
Momentum Máximo

---

# Momentum Engine v0

Variables:

## Valor Potencial

Basado en total de cotizaciones.

## Número de Cotizaciones

Basado en cantidad.

## Actividad Reciente

Basado en client_activities.

## Penalización por Inactividad

30+
60+
90+ días.

---

# SCP Health Score (Futuro)

No mide interés.

Mide salud del proceso comercial.

Variables futuras:

* Discovery realizado
* Presupuesto validado
* Decision maker identificado
* Próxima acción definida
* Cotización enviada
* Seguimiento realizado

---

# WOW Features

## Radar de Dinero

Identifica:

* dinero recuperable
* oportunidades calientes
* oportunidades en riesgo

---

## Resumen Ejecutivo IA

Resume:

* contexto
* objeciones
* proyecto
* próxima acción

---

## Memoria Comercial

Aprende:

* preferencias
* objeciones
* stakeholders
* decisiones previas

---

# Roadmap

## Sprint 1

Completado

* Auth
* Organizations
* Profiles
* Clients
* Quotes

## Sprint 2

En progreso

* Timeline
* Momentum Comercial
* Score Engine

## Sprint 3

* Pipeline SCP
* Estados comerciales
* Radar de Dinero

## Sprint 4

* PDF
* Share Links
* Archivos

## Sprint 5

* WhatsApp
* Automatizaciones
* IA

---

# Reglas para Claude

Antes de generar código:

1. Respetar arquitectura existente.
2. No crear tablas innecesarias.
3. No eliminar RLS.
4. No modificar entidades sin justificación.
5. Mantener TypeScript estricto.
6. Mantener App Router.
7. Mantener multi-tenant.
8. Mantener organization_id en toda entidad comercial.
9. Priorizar simplicidad sobre complejidad.
10. No introducir dependencias nuevas sin justificación.


# SCP ENGINES

Los motores SCP son componentes de inteligencia que transforman datos comerciales en decisiones accionables.

Los motores NO almacenan datos.

Los motores calculan indicadores a partir de:

* clients
* quotes
* client_activities
* commercial_memory

Los motores deben ser determinísticos y reproducibles.

---

# MOTOR 1 — MOMENTUM COMERCIAL

Pregunta:

¿Qué tan viva está esta oportunidad?

Objetivo:

Medir señales de avance comercial.

Inputs:

* Valor total cotizado
* Cantidad de cotizaciones
* Actividad comercial reciente
* Tiempo sin actividad

Output:

score: 0-100

Niveles:

0-25 = Crítico

26-50 = Frío

51-70 = Activo

71-85 = Caliente

86-100 = Momentum Máximo

Propósito:

Priorizar atención comercial.

---

# MOTOR 2 — SCP HEALTH SCORE

Pregunta:

¿Qué tan saludable es el proceso comercial?

Objetivo:

Detectar huecos operativos y de documentación.

Inputs actuales:

* Cliente activo
* Fuente registrada
* Notas comerciales
* Actividad comercial
* Cotizaciones
* Valor detectado

Output:

score: 0-100

Niveles:

0-30 = Deficiente

31-60 = Estable

61-80 = Saludable

81-100 = Excelente

Propósito:

Detectar debilidades del sistema comercial.

Importante:

No mide intención de compra.

Mide calidad del proceso.

---

# MOTOR 3 — RADAR DE DINERO

Pregunta:

¿Dónde está el dinero?

Objetivo:

Clasificar oportunidades según riesgo y potencial económico.

Categorías:

Dinero caliente

* actividad reciente
* oportunidad viva
* requiere seguimiento

Dinero en riesgo

* existe cotización
* actividad disminuyendo

Dinero recuperable

* oportunidad enfriándose
* posibilidad de recuperación

Dinero dormido

* actividad nula
* seguimiento ausente

Dinero ganado

* proyecto cerrado

Dinero perdido

* oportunidad descartada

Output:

* totalDetected
* hotMoney
* atRiskMoney
* recoverableMoney
* sleepingMoney
* wonMoney
* lostMoney

Propósito:

Priorizar generación de ingresos.

# MOTOR 4 — NEXT BEST ACTION

Pregunta:

¿Qué debería hacer ahora?

Objetivo:

Convertir métricas en acciones concretas.

Inputs:

* Momentum
* SCP Health
* Radar de Dinero

Outputs posibles:

follow_up

qualify

recover

close

document

expand

create_quote

Prioridades:

Alta

Media

Baja

Ejemplos:

Dar seguimiento hoy

Reactivar oportunidad

Registrar origen del lead

Agregar notas comerciales

Crear primera cotización

Buscar expansión

Documentar pérdida

Principio:

Un CRM tradicional muestra datos.

Un SCP recomienda acciones.

---

# MEMORIA COMERCIAL

Definición:

Base de conocimiento permanente de una cuenta.

Objetivo:

Evitar pérdida de contexto comercial.

Cada cliente puede tener únicamente una memoria comercial.

Relación:

clients 1:1 commercial_memory

Campos principales:

Perfil:

* estimated_budget
* urgency
* closing_probability
* temperature
* project_type
* lead_source

Conocimiento:

* executive_summary
* pain_points
* desires
* objections
* competitors

Acción:

* next_step
* next_step_date

Principio:

La Memoria Comercial almacena aprendizaje.

El Timeline almacena eventos.

No deben confundirse.

Ejemplo:

Timeline:

"Se realizó llamada el 12 de marzo."

Memoria:

"El cliente teme retrasos en implementación y compara con Control4."

# VISIÓN SCP 2.0

Objetivo final:

Transformar Droplead CRM de un sistema descriptivo a un sistema predictivo.

Evolución:

CRM Tradicional

↓
Registro de datos

↓
CRM Inteligente

↓
Sistema Comercial Predecible

Capacidades futuras:

1. Probabilidad de cierre dinámica

Calculada automáticamente usando:

* Momentum
* Health Score
* Urgencia
* Presupuesto
* Actividad

2. Extracción automática de memoria

La IA sugerirá:

* dolores
* deseos
* objeciones
* competidores
* próximos pasos

a partir de:

* notas
* timeline
* llamadas
* reuniones

3. Forecast Comercial

Predicción de:

* ingresos probables
* ingresos en riesgo
* ingresos recuperables

4. Action Queue Global

Lista priorizada de acciones para todo el equipo.

5. Resumen Ejecutivo IA

Generación automática de contexto para cualquier miembro del equipo.

---

# PRINCIPIO DE OPERACIONALIZACIÓN

Todo concepto abstracto debe convertirse en variables observables.

Ejemplos:

Confianza
→ Trust Score

Urgencia
→ Urgency Score

Dolor
→ Pain Severity

Interés
→ Momentum

Calidad del proceso
→ SCP Health

Cada concepto estratégico debe terminar convertido en:

* variable
* métrica
* score
* acción

Este principio gobierna toda la evolución futura del SCP.

---

# SPRINT 5 — PROJECT FILES / EXPEDIENTE VISUAL

## Objetivo

Permitir que cada cliente tenga archivos asociados a su expediente comercial.

Esto es crítico para negocios de:

- domótica
- remodelación premium
- construcción
- arquitectura
- ingeniería especializada

porque muchas decisiones comerciales dependen de material visual y técnico.

---

## Principio Arquitectónico

Los archivos NO viven en `clients`.

Los archivos deben vivir en una entidad separada:

`client_files`

Supabase Storage guarda el archivo físico.

PostgreSQL guarda la metadata.

---

## Entidad: client_files

Representa un archivo asociado a un cliente.

Debe incluir:

- organization_id
- client_id
- uploaded_by
- file_name
- file_path
- file_type
- file_size
- category
- created_at

---

## Categorías Iniciales

- foto
- render
- plano
- referencia
- contrato
- levantamiento
- otro

---

## Reglas

1. Todo archivo debe pertenecer a una organización.
2. Todo archivo debe pertenecer a un cliente.
3. Todo archivo debe respetar RLS.
4. El archivo físico debe vivir en Supabase Storage.
5. La metadata debe vivir en `client_files`.
6. No guardar URLs públicas permanentes si no son necesarias.
7. No mezclar archivos con notas o memoria comercial.

---

## Relación con SCP

Los archivos enriquecen la Memoria Comercial.

Ejemplos:

- renders ayudan a entender intención estética
- planos ayudan a estimar alcance
- fotos ayudan a diagnosticar proyecto
- contratos ayudan a validar cierre
- referencias ayudan a entender deseos del cliente

En el futuro, IA podrá analizar archivos y sugerir:

- tipo de proyecto
- alcance probable
- señales de urgencia
- inconsistencias
- próximos pasos

---

## Sprint 5 Roadmap

### Sprint 5.1

Crear tabla `client_files` y bucket de Storage.

### Sprint 5.2

Subir archivos al expediente del cliente.

### Sprint 5.3

Listar archivos dentro del expediente.

### Sprint 5.4

Categorizar archivos.

### Sprint 5.5

Conectar archivos con Memoria Comercial e IA.

# AI Usage Guardrails (Pendiente Producción)

Estado:

Pendiente de implementación antes de habilitar IA para clientes finales.

Objetivo:

Controlar costos, prevenir abuso y garantizar escalabilidad del sistema.

Requisitos mínimos:

* Registro de uso IA por organización.
* Registro de tokens de entrada.
* Registro de tokens de salida.
* Costo estimado por ejecución.
* Límite mensual por organización.
* Rate limiting por acción.
* Sistema de créditos IA por funcionalidad.

Ejemplos:

Executive Summary:
1 crédito

Análisis de expediente:
5 créditos

Análisis de llamada:
10 créditos

Generación de propuesta:
15 créditos

Restricción:

Ninguna funcionalidad IA deberá liberarse a clientes finales sin implementar previamente los AI Usage Guardrails.

Mientras no exista este sistema, las funcionalidades IA se consideran beta interna para uso del equipo Droplead.
