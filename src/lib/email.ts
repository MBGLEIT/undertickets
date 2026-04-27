import { Resend } from "resend";
import { getEmailEnv } from "@/lib/env";
import {
  generateTicketPdfBuffer,
  generateTicketQrDataUrl,
  type TicketWithEvent,
} from "@/lib/ticket-documents";
import { formatEventDate, formatPrice } from "@/lib/formatters";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendTicketEmail(ticket: TicketWithEvent) {
  const env = getEmailEnv();
  const resend = new Resend(env.RESEND_API_KEY);
  const qrDataUrl = await generateTicketQrDataUrl(ticket.qr_code_value);
  const pdfBuffer = await generateTicketPdfBuffer(ticket);

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1b1b18;">
      <h1 style="margin-bottom: 8px;">Tu entrada ya esta confirmada</h1>
      <p style="margin-top: 0;">Gracias por tu compra. Aqui tienes los datos de acceso del evento.</p>
      <div style="margin: 24px 0; padding: 20px; border: 1px solid #ddd4c7; border-radius: 16px; background: #fffdf7;">
        <h2 style="margin-top: 0;">${escapeHtml(ticket.event.name)}</h2>
        <p><strong>Asistente:</strong> ${escapeHtml(ticket.full_name)}</p>
        <p><strong>DNI:</strong> ${escapeHtml(ticket.dni)}</p>
        <p><strong>Telefono:</strong> ${escapeHtml(ticket.phone)}</p>
        <p><strong>Email:</strong> ${escapeHtml(ticket.email)}</p>
        <p><strong>Fecha:</strong> ${escapeHtml(formatEventDate(ticket.event.date))}</p>
        <p><strong>Ubicacion:</strong> ${escapeHtml(ticket.event.location)}</p>
        <p><strong>Precio:</strong> ${escapeHtml(formatPrice(ticket.event.price))}</p>
        <p><strong>Codigo de acceso:</strong> ${escapeHtml(ticket.alphanumeric_code)}</p>
        <img src="${qrDataUrl}" alt="QR del ticket" width="220" height="220" style="display:block; margin-top: 16px;" />
      </div>
      <p>Tambien adjuntamos la entrada en PDF para que puedas guardarla o imprimirla.</p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: env.TICKET_EMAIL_FROM,
    to: [ticket.email],
    subject: `Tu entrada para ${ticket.event.name}`,
    html,
    attachments: [
      {
        filename: `${ticket.event.slug}-ticket.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(`No se pudo enviar el email del ticket: ${error.message}`);
  }
}
