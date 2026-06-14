# Droplead CRM — Handoff para UI

## Stack
- Next.js 14, TypeScript, TailwindCSS, Supabase
- App Router, Server Components por defecto
- No component library — UI desde cero con Tailwind

## Principios de diseño (del North Star doc)
- Premium first — comparable a Linear, Stripe, Mercury
- Elegancia silenciosa — nunca saturar
- Densidad inteligente — mucha info, pero ligera
- Motion design intencional — solo animaciones funcionales
- Paleta: negro profundo, grises suaves, violeta como acento (#7C3AED), verde éxito, ámbar advertencia, rojo crítico

## Páginas existentes y su función

### `/dashboard`
Dashboard principal (CEO Morning Brief). Vista de alto nivel de toda la organización.
- **Componentes clave**: `ImpersonationBanner`, `BranchFilter`, `NotificationBell`, `AIActionButton`, `ScoreBar` (vía secciones de Radar/Momentum)
- **Datos que muestra**:
  - Header con fecha + saludo + filtro de sucursal + campana de notificaciones
  - "CEO Morning Brief" generado por IA (con botón de regenerar)
  - 4 stat cards: clientes totales, cotizaciones abiertas, cerradas este mes, valor en pipeline
  - "Radar de Dinero" (4 cards: dinero caliente, en riesgo, recuperable, ganado)
  - "Money Leak Detector": cards con severidad, enlazan a `/clients/[id]`
  - "Pipeline": barras horizontales por etapa SCP + forecast ponderado
  - "Tareas pendientes" (top 3, enlaza a `/tasks`)
  - "Top 3 acciones": Next Best Action por cliente
  - "Actividad reciente" (últimas 5)
- Fuentes de datos: `clients`, `quotes`, `client_activities`, `tasks`, `morning_briefs`, `notifications`, `branches` — todo filtrado por `organization_id` y `branch_id` opcional

### `/pipeline`
"Pipeline SCP" — vista kanban de clientes agrupados por etapa.
- **Componentes clave**: `ImpersonationBanner`
- **Datos que muestra**: columnas por etapa SCP (`buildPipeline`) con label y probabilidad de cierre; cada card de cliente muestra nombre, empresa (si no es persona) y email/teléfono
- Enlaza a `/scp` y `/clients`

### `/clients`
Listado general de clientes.
- **Componentes clave**: `BranchFilter`
- **Datos que muestra**: tabla con nombre, email/teléfono, badge de sucursal (si aplica), badge de etapa SCP, probabilidad de forecast (%)
- Filtro por `searchParams.branch_id`
- Enlaza a `/clients/new` y `/scp`

### `/clients/new`
Formulario de alta de cliente.
- **Componentes clave**: `ClientFields` (campos del formulario + lista de sucursales)
- **Datos que muestra**: formulario vacío; muestra error desde `searchParams.error` si la creación falla
- Server action: `createClient`

### `/clients/[id]`
"Expediente comercial" — página de detalle de cliente, la más completa del sistema.
- **Componentes clave**: `ScoreBar`, `FileUpload`, `FileViewButton`, `TaskCard`, `NewTaskForm`, `AIActionButton`, tooltip local (`TooltipIcon`)
- **Datos que muestra** (en orden):
  - Header: nombre del cliente + botón "Nueva cotización"
  - Info principal: empresa, teléfono, correo, fecha de creación, badge de etapa SCP + badge de sucursal + barra de progreso del pipeline + link "Cambiar etapa"
  - "Origen del lead" (solo si `source === 'meta_ads'`): imagen/nombre del anuncio, campaña, badge "Meta Ads", link al anuncio original
  - "Momentum Comercial": `ScoreBar` + nivel + razones
  - "Salud del SCP": `ScoreBar` + nivel + fortalezas/riesgos
  - "Radar de Dinero": 6 cards (caliente, en riesgo, recuperable, dormido, ganado, perdido) + acción recomendada
  - "Siguiente Mejor Acción": card con borde de color según prioridad
  - "Deal Coach" (IA): consejo dividido en bloques (Situación / Riesgo / Acción exacta / mensaje sugerido)
  - "Memoria Comercial": resumen de `commercial_memory` (presupuesto, urgencia, probabilidad, temperatura, tipo de proyecto, fuente, resumen ejecutivo, dolores/deseos/objeciones/competidores, próximo paso) + acciones (actualizar, generar resumen IA, editar)
  - "Archivos del proyecto / Expediente visual": `FileUpload` + lista de archivos con categoría (`FileViewButton`)
  - "Expediente comercial" stats: cotizaciones, actividad, valor potencial
  - "Cotizaciones": lista, enlaza a `/quotes/[id]`
  - "Quick Actions SCP": botones desde `organization_quick_actions`, enlaza a `/settings/quick-actions`
  - "Tareas": `NewTaskForm` + lista de `TaskCard`
  - "Activity Intelligence": conteos de touchpoints/discoveries/milestones/notas + mensaje + acción operativa recomendada
  - "Timeline comercial": formulario de nota + lista de actividades

### `/clients/[id]/memory`
Formulario de edición de Memoria Comercial.
- **Componentes clave**: `FieldLabel` (label + tooltip)
- **Datos que muestra**:
  - "Perfil comercial": presupuesto estimado, probabilidad de cierre, urgencia (select: Baja/Media/Alta/Crítica), temperatura (select: Frío/Tibio/Caliente/Muy caliente/Ganado/Perdido), tipo de proyecto, fuente del lead
  - "Resumen ejecutivo" (textarea)
  - "Inteligencia comercial": dolores, deseos, objeciones, competidores (textareas con tooltip)
  - "Próximo paso": descripción + fecha
- Server action: `saveCommercialMemory`. Link "Cancelar" vuelve a `/clients/[id]`

### `/quotes/[id]`
Detalle de cotización.
- **Componentes clave**: `CopyLinkButton`
- **Datos que muestra**:
  - Header: número de cotización, nombre del proyecto, link "Editar cotización" (si está en borrador), link a "Previsualizar/Ver PDF" (`/quotes/[id]/print`)
  - Grid de info cliente/proyecto
  - Pill de estado (`draft/sent/viewed/accepted/rejected/expired`) + botones de acción según estado (`markQuoteAsSent/Accepted/Rejected`)
  - Tabla de partidas (`quote_items`)
  - Resumen financiero (subtotal, descuento, IVA, total)
  - "Visión del cliente"
  - "Notas internas"
  - "Link público": URL `https://droplead.app/q/{share_token}` con botón de copiar, o botón "Generar link público" (`generateShareToken`)

### `/quotes/[id]/edit`
Edición de cotización — solo accesible si `status === 'draft'` (si no, redirige a `/quotes/[id]`).
- **Componentes clave**: `FinancialPreview`, `SaveAsProductForm`
- **Datos que muestra**:
  - Formulario de metadatos: nombre/tipo/dirección del proyecto, visión del cliente, notas, válido hasta, % IVA, descuento global, moneda
  - "✨ Frecuentemente cotizados": cards de acceso rápido desde `getFrequentProducts`
  - Lista de partidas existentes (cada una con `SaveAsProductForm` + eliminar)
  - Formulario de nueva partida (nombre, descripción, cantidad, unidad, precio unitario, % descuento)
  - Resumen financiero
  - `FinancialPreview` flotante (cálculo en vivo client-side)
- Server actions: `updateQuoteMeta`, `upsertQuoteItem`, `deleteQuoteItem`, `addProductToQuote`

### `/quotes/[id]/print`
Vista imprimible / estilo PDF de la cotización.
- **Componentes clave**: `PrintButton`
- **Datos que muestra** (secciones numeradas en el código):
  1. Header (nombre de la organización, número de cotización, fecha)
  2. Bloque de cliente
  3. Info del proyecto
  4. Tabla de partidas
  5. Resumen financiero
  6. Footer (ejecutivo responsable, válido hasta, "Generado con Droplead")
- Incluye estilos `@media print` (`.no-print`, `@page { margin: 20mm; size: A4 }`)
- Nota en el código: ruta de migración futura a generación de PDF server-side (puppeteer/@sparticuz/chromium)

### `/q/[token]` (pública)
Vista pública de cotización, accesible sin login vía `share_token`.
- **Datos que muestra**: pill de estado, header del proyecto, info de cliente, info del proyecto, tabla de partidas, resumen financiero, footer con "válida hasta"
- Comportamiento: incrementa `view_count` y `last_viewed_at`; si el estado era `sent`, transiciona a `viewed`, registra actividad `quote_viewed` y dispara una auto-tarea (`createAutoTask`)
- Estilo visual: tema oscuro (`bg-neutral-950`)

### `/tasks`
Listado de tareas pendientes de toda la organización.
- **Componentes clave**: `NewTaskForm`, `TaskCard`
- **Datos que muestra**: tareas agrupadas por prioridad (`Alta`, `Media`, `Baja`), con nombre de cliente resuelto por separado

### `/products`
Catálogo de productos/servicios.
- **Componentes clave**: `NewProductForm`
- **Datos que muestra**:
  - Conteo de productos activos y archivados
  - Stats row: productos activos, más cotizado, última vez usado
  - Tabla: producto, categoría, precio, veces usado, último uso, botón archivar (`archiveProduct`)

### `/branches`
Gestión de sucursales.
- **Datos que muestra**:
  - Formulario de alta de sucursal (nombre, ciudad, teléfono, dirección) — `createBranch`
  - Lista de sucursales con badge activo/inactivo, conteo de clientes, valor de pipeline, link a `/branches/[id]`, botón de activar/desactivar (`toggleBranchActive`)
- Enlaza a `/branches/report`

### `/branches/[id]`
Dashboard de una sucursal individual.
- **Componentes clave**: `TaskCard`, `ScoreBar` (vía Radar de Dinero)
- **Datos que muestra**:
  - Stat cards: clientes, cotizaciones abiertas, cerradas este mes, pipeline
  - "Radar de Dinero" (4 cards, vía `calculateMoneyRadar`)
  - "Tareas pendientes" (`TaskCard`, límite 3)
  - "Actividad reciente" (límite 5, scoped a clientes de la sucursal)

### `/branches/report`
Reporte consolidado entre sucursales.
- **Datos que muestra**:
  - Cards de totales de la organización: clientes totales, pipeline total, dinero caliente, ganado
  - Tabla comparativa por sucursal: sucursal, clientes, pipeline, dinero caliente, ganado, cotizaciones abiertas, con fila de totales
- Fuente: `getConsolidatedReportData()`
- Enlaza a `/branches/report/print`

### `/scp`
SCP Dashboard — vista de inteligencia comercial agregada.
- **Componentes clave**: `ScoreBar`
- **Datos que muestra**:
  - 4 cards: dinero caliente total, en riesgo total, recuperable total, dormido total
  - Segunda fila: clientes activos, SCP Health promedio (`ScoreBar`), conteo de acciones críticas
  - "Top oportunidades por dinero detectado" (top 10 por `moneyRadar.totalDetected`)
  - "Cola de acciones SCP" (top 10 ordenadas por prioridad de Next Best Action, con acción concreta + `ScoreBar` de momentum)
- Fuente: `buildClientIntelligence` (agrega momentum, scpHealth, moneyRadar, nextBestAction, concreteAction por cliente)

### `/admin`
Panel de super-administrador (solo visible para usuarios en `super_admins`; si no, redirige a `/dashboard`).
- **Datos que muestra**:
  - Stats globales: total de organizaciones, total de clientes, pipeline total
  - Tabla de todas las organizaciones: nombre, slug, # clientes, cotizaciones abiertas, valor de pipeline, fecha de creación, botón "Acceder" (`impersonateOrg`)

### `/settings/quick-actions`
Configuración de Quick Actions del SCP.
- **Datos que muestra**:
  - "Acciones universales": badges siempre activas
  - "Biblioteca de acciones": toggles, con badge de etapa SCP si la acción está ligada a una transición
  - "Acciones personalizadas": lista con botón eliminar + formulario "Agregar" (límite de 2 acciones personalizadas, emoji + label)
- Server actions: `toggleQuickAction`, `createCustomAction`, `deleteCustomAction`

### `/marketing` (resumen)
Marketing Overview — módulo de Meta Ads (Sprint 6).
- **Componentes clave**: `SyncMetaButton`, `MarketingChart`, `ImpersonationBanner`
- **Estado vacío**: si no existe `meta_ad_accounts` para la organización, muestra empty state enlazando a `/marketing/settings`
- **Datos que muestra** (si hay cuenta conectada):
  - 4 KPI tiles (glass card + ícono con gradiente): inversión publicitaria, leads totales, CTR promedio, costo por lead
  - `MarketingChart`: serie de inversión + leads por día (últimos 30 días)
  - Tabla de rendimiento por campaña: campaña, estado (`StatusBadge` con `STATUS_LABELS`), inversión, leads, ROAS (actualmente hardcoded a 0)
- Usa extensivamente `.glass-card` y `.gradient-primary` de `globals.css`

### `/marketing/ads`
Biblioteca de creativos.
- **Componentes clave**: `AdsGrid`, `AdCard`
- **Estado vacío**: si no hay `meta_ads`, muestra empty state
- **Datos que muestra**: grid de anuncios con preview (imagen/video), CTA traducido (`CTA_LABELS`), estado (`STATUS_LABELS`), y métricas agregadas de los últimos 30 días (impresiones, alcance, clics, inversión, leads → CTR, CPL) con clasificación de rendimiento (`TOP`/`GOOD`/`AVG`/`LOW` según CTR)

### `/marketing/attribution`
Atribución / Lead Journey.
- **Estado vacío**: si no hay `clients` con `source === 'meta_ads'`, muestra empty state
- **Datos que muestra**:
  - 6 cards de resumen: leads totales, cerrados/ganados, tasa de conversión, ingresos atribuidos, CAC real, ROAS real
  - "Por campaña": tabla (campaña, leads, ganados, ingresos, inversión, CAC, ROAS)
  - "Todos los leads": tabla (cliente, anuncio origen, campaña, UTM campaign, fecha de ingreso, etapa actual con `StageBadge`/`StageJourney`, valor del trato)
- Fuente: `calculateAttributionSummary`; etapas del journey: Nuevo, Contactado, Calificado, Propuesta, Ganado, Perdido (mapeadas desde las etapas SCP)

### `/marketing/settings`
Configuración de conexión con Meta Ads.
- **Componentes clave**: `SyncButton`, `CopyButton`, `TokenInput`
- **Datos que muestra**:
  - Card de estado de conexión ("Meta Ads conectado" con indicador pulsante + info de última sincronización)
  - Formulario "Credenciales de Meta Ads" (ID de cuenta, token de acceso vía `TokenInput`) — `saveMetaAdAccount`
  - "Webhook de leads": endpoint `https://droplead.app/api/webhooks/lead` (POST) con botón copiar y nota sobre verificación de firma HMAC-SHA256 (`x-droplead-signature`)

## Componentes reutilizables existentes

### `app/components/`
- `admin/impersonation-banner.tsx` — `ImpersonationBanner`: banner fijo superior "👁 Viendo como: {org}" para super-admins en modo impersonación, con botón "Salir"
- `marketing/ad-card.tsx` — `AdCard`: preview de creativo (imagen o video) con estados de fallback y botón de reproducción/enlace a Meta
- `notifications/notification-bell.tsx` — `NotificationBell`: ícono de campana con contador de no leídas y dropdown de notificaciones (marcar como leída / marcar todas, navega al cliente)
- `products/new-product-form.tsx` — `NewProductForm`: formulario flotante para crear un producto del catálogo
- `quotes/financial-preview.tsx` — `FinancialPreview`: panel flotante que recalcula subtotal/descuento/IVA/total en vivo mientras se editan las partidas
- `quotes/save-as-product-form.tsx` — `SaveAsProductForm`: formulario flotante para guardar una partida de cotización como producto del catálogo
- `revenue-copilot/copilot-widget.tsx` — `CopilotWidget`: chat flotante "Asistente Comercial" (Revenue Copilot con IA), con preguntas sugeridas y nombre personalizable
- `tasks/new-task-form.tsx` — `NewTaskForm`: formulario para crear una tarea (título, tipo, prioridad, fecha límite, descripción)
- `tasks/task-card.tsx` — `TaskCard`: card de tarea con ícono por tipo, badge de prioridad, cliente vinculado, fecha límite (resaltada si vencida) y botones completar/cancelar
- `ui/ai-action-button.tsx` — `AIActionButton`: botón de submit con spinner de carga para acciones generadas por IA
- `ui/score-bar.tsx` — `ScoreBar`: barra de progreso 0-100 con color dinámico según el score (Momentum, SCP Health, etc.)

### `src/components/`
- `branches/branch-filter.tsx` — `BranchFilter`: select que filtra la página actual por sucursal vía query param `branch_id`
- `files/file-upload.tsx` — `FileUpload`: formulario para subir archivos al bucket `client-files` de Supabase Storage, con categoría, asociado a un cliente
- `files/file-view-button.tsx` — `FileViewButton`: botón que genera una signed URL y abre el archivo en una nueva pestaña
- `layout/sidebar-nav.tsx` — `SidebarNav`: navegación lateral de escritorio (oculta en rutas públicas/auth/print), secciones "General" y "Marketing", badge de notificaciones, link a Admin si super-admin
- `layout/sidebar.tsx` — `Sidebar`: server component que resuelve el estado de super-admin y el conteo de notificaciones no leídas, y renderiza `SidebarNav`
- `ui/button.tsx` — `Button`: botón base (shadcn/radix) con variantes (`default`/`outline`/`secondary`/`ghost`/`destructive`/`link`) y tamaños
- `ui/dialog.tsx` — `Dialog`: componentes de modal (shadcn/radix) — `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`

## Engines y lógica de negocio (NO tocar con Lovable)
- `src/lib/scoring/` — Money Radar, Momentum, SCP Health, Next Best Action
- `src/lib/ai/` — Deal Coach, Morning Brief, Revenue Copilot
- `src/lib/notifications/` — generación de alertas
- `src/lib/tasks/` — auto-tasks engine
- `src/lib/attribution/` — attribution engine

## Patrones de datos importantes
- Todos los queries usan `organization_id` (multi-tenant)
- Server Components para data fetching
- Server Actions para mutations
- `getActiveOrganizationId()` para impersonation

## Lo que Lovable DEBE hacer
- Rediseñar el visual de todas las páginas manteniendo la misma estructura de datos
- Implementar mobile-first (breakpoints: sm 640px, md 768px, lg 1024px)
- Agregar animaciones con Framer Motion
- Skeleton loaders en todos los estados de carga
- Design tokens consistentes (CSS variables)
- Sidebar colapsable en mobile

## Lo que Lovable NO debe tocar
- Lógica de server actions
- Queries de Supabase
- Engines de scoring
- Sistema de notificaciones
- API routes
- Middleware de auth
