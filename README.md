# UnderTickets

Aplicacion full-stack para venta de entradas de eventos locales construida con Next.js, Supabase, Stripe y Resend.

## Funcionalidades principales

- listado publico de eventos y pagina de detalle
- compra de entradas con Stripe Checkout
- emision de tickets digitales con QR y codigo alfanumerico
- generacion de PDF de entrada
- envio de entradas por email
- validacion de accesos en tiempo real
- panel admin con dashboard, escaneo y seguimiento de asistentes

## Stack

- Next.js App Router
- Tailwind CSS
- Supabase
- Stripe
- Resend
- pdf-lib
- qrcode

## Variables de entorno

Crea un archivo `.env.local` con estos valores:

```env
NEXT_PUBLIC_APP_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

RESEND_API_KEY=
TICKET_EMAIL_FROM=
```

## Desarrollo

```bash
npm install
npm run dev
```

## Base de datos

Las migraciones SQL estan en `supabase/migrations`. Deben aplicarse en Supabase antes de usar la app en entorno real.

## Despliegue

Pensado para desplegarse en Vercel. Tras desplegar, configura en Stripe un webhook publico apuntando a:

```text
https://tu-dominio.com/api/webhook
```
