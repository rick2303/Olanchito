---
name: Olanchito Features - Mapa, Badge Nuevo, Prioridad, Owner Portal
description: Features implementados: mapa interactivo, badge Nuevo (3 días), sort featured>new>score, Owner Portal con Stripe + catálogo
type: project
---

Mapa interactivo (react-leaflet), badge Nuevo (3 días), sort featured>new>score.

Owner Portal implementado:
- /owner/login — login con email + password
- /owner/setup — seteo de contraseña tras invite de Supabase
- /owner/[slug] — dashboard con 3 tabs: Mi Negocio, Catálogo, Estadísticas
- /api/stripe/checkout — crea sesión de Stripe Checkout
- /api/stripe/webhook — activa sub + invita owner via Supabase Auth
- components/owner/CatalogManager.tsx — CRUD de items del catálogo
- Catálogo visible en /negocios/[slug] si subscription_active = true
- Pricing page rediseñada con Owner Portal + Stripe form

**Why:** owner portal es feature de pago ($6/mes) para que dueños gestionen su negocio sin depender del admin.

**How to apply:** Pendiente: agregar variables de entorno de Stripe y correr SQL de migración en Supabase.
