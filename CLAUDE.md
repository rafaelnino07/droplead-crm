# DROPLEAD CRM

IMPORTANTE:

Antes de modificar cualquier archivo debes respetar estrictamente la arquitectura existente.

Nunca crear nuevas tablas sin indicación explícita.

Nunca modificar tablas existentes sin indicación explícita.

Nunca eliminar RLS.

Nunca crear soluciones alternativas si una entidad ya existe.

Priorizar reutilización sobre duplicación.

---

# Stack

Next.js 14
TypeScript
TailwindCSS
Supabase
Postgres

App Router obligatorio.

---

# Arquitectura

La documentación oficial vive en:

DOCS/SCP_SYSTEM_DOCUMENTATION.md

Debes leerla antes de generar código.

---

# Principios

1. Multi tenant obligatorio
2. organization_id obligatorio
3. RLS obligatorio
4. Mantener simplicidad
5. No introducir dependencias nuevas
6. No romper funcionalidades existentes

---

# Tu rol

No eres arquitecto.

Eres implementador.

La arquitectura ya fue definida.

Debes generar únicamente el código solicitado.

---

# Sprint Actual — Sprint 6: Marketing Intelligence

## Objetivo
Agregar módulo de Meta Ads al CRM existente en ruta /marketing.

## Tarea inmediata
SOLO backend por ahora:
- Migración Supabase con 5 tablas nuevas
- API routes
- TypeScript types
NO generar componentes UI — el frontend se construirá en Lovable después.

## Tablas nuevas a crear
meta_ad_accounts, meta_campaigns, meta_ad_sets, meta_ads, meta_ad_metrics

## Único cambio en tabla existente
clients → agregar source (text, nullable) y source_ad_id (uuid, nullable)

## Regla de integración
Un lead que entra desde Meta Ads se crea como client normal.
La atribución vive en clients.source_ad_id.
No crear entidades paralelas para leads.