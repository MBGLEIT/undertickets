# Undertickets Stripe Test Checklist

## Objetivo

Probar el flujo completo de compra sin gastar dinero real usando `Stripe test mode`.

## Variables que necesitaremos en Vercel Preview o Testing

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `TICKET_EMAIL_FROM`

## Claves de Stripe

- Usar siempre claves `pk_test_...` y `sk_test_...`
- Crear un webhook de prueba apuntando a:
  - `https://<tu-url-de-preview-o-testing>/api/webhook`
- Evento minimo:
  - `checkout.session.completed`

## Tarjeta de prueba principal

- Numero: `4242 4242 4242 4242`
- Fecha: cualquiera futura
- CVC: cualquiera
- Codigo postal: cualquiera

## Flujo principal a comprobar

1. Crear un evento visible desde el admin.
2. Abrir la web publica y entrar al detalle del evento.
3. Rellenar comprador y lanzar `Stripe Checkout`.
4. Pagar con tarjeta de prueba.
5. Confirmar que el webhook llega.
6. Confirmar que se crea el ticket en Supabase.
7. Confirmar que se genera el PDF.
8. Confirmar que se envia el email.
9. Confirmar que la entrada aparece en admin.
10. Validar el ticket desde QR o codigo manual.

## Casos extra recomendados

- Pago rechazado.
- Evento agotado.
- Evento cancelado.
- Reenvio de email.
- Retirada de entrada.
- Reutilizacion de ticket ya usado.

## Resultado esperado

El pago de prueba debe completar todo el flujo sin mover dinero real y dejar una entrada totalmente funcional para validar.
