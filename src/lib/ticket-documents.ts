import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatEventDate, formatPrice } from "@/lib/formatters";

export type TicketWithEvent = {
  id: string;
  full_name: string;
  dni: string;
  phone: string;
  email: string;
  used: boolean;
  used_at: string | null;
  stripe_session_id: string;
  qr_code_value: string;
  alphanumeric_code: string;
  created_at: string;
  event: {
    id: string;
    slug: string;
    name: string;
    date: string;
    location: string;
    description: string;
    price: number;
    capacity: number;
    status: string;
  };
};

function dataUrlToUint8Array(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const buffer = Buffer.from(base64, "base64");
  return new Uint8Array(buffer);
}

export async function generateTicketQrDataUrl(value: string) {
  return QRCode.toDataURL(value, {
    width: 320,
    margin: 1,
  });
}

export async function getTicketWithEventById(ticketId: string) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("tickets")
    .select(
      "id, full_name, dni, phone, email, used, used_at, stripe_session_id, qr_code_value, alphanumeric_code, created_at, events(id, slug, name, date, location, description, price, capacity, status)",
    )
    .eq("id", ticketId)
    .single();

  if (error) {
    throw new Error(`No se pudo cargar el ticket: ${error.message}`);
  }

  const ticketRow = data as unknown as {
    id: string;
    full_name: string;
    dni: string;
    phone: string;
    email: string;
    used: boolean;
    used_at: string | null;
    stripe_session_id: string;
    qr_code_value: string;
    alphanumeric_code: string;
    created_at: string;
    events: TicketWithEvent["event"] | TicketWithEvent["event"][] | null;
  };

  const event = Array.isArray(ticketRow.events)
    ? ticketRow.events[0]
    : ticketRow.events;

  if (!event) {
    throw new Error("El ticket no tiene un evento asociado.");
  }

  return {
    id: ticketRow.id,
    full_name: ticketRow.full_name,
    dni: ticketRow.dni,
    phone: ticketRow.phone,
    email: ticketRow.email,
    used: ticketRow.used,
    used_at: ticketRow.used_at,
    stripe_session_id: ticketRow.stripe_session_id,
    qr_code_value: ticketRow.qr_code_value,
    alphanumeric_code: ticketRow.alphanumeric_code,
    created_at: ticketRow.created_at,
    event: {
      id: event.id,
      slug: event.slug,
      name: event.name,
      date: event.date,
      location: event.location,
      description: event.description,
      price: event.price,
      capacity: event.capacity,
      status: event.status,
    },
  } satisfies TicketWithEvent;
}

export async function generateTicketPdfBuffer(ticket: TicketWithEvent) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const qrDataUrl = await generateTicketQrDataUrl(ticket.qr_code_value);
  const qrImage = await pdf.embedPng(dataUrlToUint8Array(qrDataUrl));

  page.drawRectangle({
    x: 36,
    y: 36,
    width: 523,
    height: 770,
    color: rgb(0.99, 0.985, 0.965),
    borderColor: rgb(0.82, 0.76, 0.66),
    borderWidth: 1,
  });

  page.drawText("Entrada digital", {
    x: 56,
    y: 760,
    size: 26,
    font: titleFont,
    color: rgb(0.12, 0.11, 0.1),
  });

  page.drawText(ticket.event.name, {
    x: 56,
    y: 720,
    size: 20,
    font: titleFont,
    color: rgb(0.12, 0.11, 0.1),
  });

  const lines = [
    `Fecha: ${formatEventDate(ticket.event.date)}`,
    `Ubicacion: ${ticket.event.location}`,
    `Asistente: ${ticket.full_name}`,
    `DNI: ${ticket.dni}`,
    `Telefono: ${ticket.phone}`,
    `Email: ${ticket.email}`,
    `Precio: ${formatPrice(ticket.event.price)}`,
    `Codigo: ${ticket.alphanumeric_code}`,
    `Ticket ID: ${ticket.id}`,
  ];

  lines.forEach((line, index) => {
    page.drawText(line, {
      x: 56,
      y: 670 - index * 24,
      size: 12,
      font: bodyFont,
      color: rgb(0.25, 0.24, 0.22),
    });
  });

  page.drawText("Presenta este QR en el acceso al evento.", {
    x: 56,
    y: 480,
    size: 12,
    font: bodyFont,
    color: rgb(0.45, 0.4, 0.35),
  });

  page.drawImage(qrImage, {
    x: 56,
    y: 180,
    width: 220,
    height: 220,
  });

  page.drawText(ticket.event.description.slice(0, 220), {
    x: 320,
    y: 360,
    size: 11,
    font: bodyFont,
    color: rgb(0.28, 0.27, 0.25),
    maxWidth: 180,
    lineHeight: 16,
  });

  page.drawText("Entrada valida para un unico acceso.", {
    x: 56,
    y: 130,
    size: 11,
    font: bodyFont,
    color: rgb(0.6, 0.3, 0.16),
  });

  const pdfBytes = await pdf.save();
  return Buffer.from(pdfBytes);
}
