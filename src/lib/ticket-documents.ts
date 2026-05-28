import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatEventShortDate, formatPrice } from "@/lib/formatters";

export type TicketWithEvent = {
  id: string;
  full_name: string;
  age: number;
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

function normalizeForFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim();
}

function buildBuyerFileSegment(fullName: string) {
  const parts = normalizeForFileName(fullName)
    .split(/\s+/)
    .filter(Boolean);

  const selected = parts.slice(0, 2);
  return selected.length > 0 ? selected.join("_") : "Comprador";
}

function buildEventFileSegment(eventName: string) {
  return normalizeForFileName(eventName)
    .split(/\s+/)
    .filter(Boolean)
    .join("-");
}

function buildEventDateFileSegment(eventDate: string) {
  const date = new Date(eventDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}-${month}-${year}`;
}

function wrapText(text: string, maxCharsPerLine: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export function buildTicketPdfFilename(ticket: TicketWithEvent) {
  const buyer = buildBuyerFileSegment(ticket.full_name);
  const event = buildEventFileSegment(ticket.event.name);
  const date = buildEventDateFileSegment(ticket.event.date);
  return `${buyer}_Ticket-${event}_${date}.pdf`;
}

export async function getTicketWithEventById(ticketId: string) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("tickets")
    .select(
      "id, full_name, age, dni, phone, email, used, used_at, stripe_session_id, qr_code_value, alphanumeric_code, created_at, events(id, slug, name, date, location, description, price, capacity, status)",
    )
    .eq("id", ticketId)
    .single();

  if (error) {
    throw new Error(`No se pudo cargar el ticket: ${error.message}`);
  }

  const ticketRow = data as unknown as {
    id: string;
    full_name: string;
    age: number;
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
    age: ticketRow.age,
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
    x: 24,
    y: 24,
    width: 547,
    height: 794,
    color: rgb(0.995, 0.992, 0.985),
    borderColor: rgb(0.87, 0.81, 0.71),
    borderWidth: 1,
  });

  page.drawRectangle({
    x: 24,
    y: 728,
    width: 547,
    height: 90,
    color: rgb(0.11, 0.1, 0.09),
  });

  page.drawText("UNDER TICKETS", {
    x: 46,
    y: 786,
    size: 12,
    font: bodyFont,
    color: rgb(0.93, 0.88, 0.8),
  });

  page.drawText("Entrada digital", {
    x: 46,
    y: 744,
    size: 30,
    font: titleFont,
    color: rgb(1, 1, 1),
  });

  page.drawText(ticket.event.name, {
    x: 46,
    y: 676,
    size: 24,
    font: titleFont,
    color: rgb(0.12, 0.11, 0.1),
  });

  const lines = [
    { label: "Nombre y apellidos", value: ticket.full_name, maxChars: 28 },
    { label: "DNI", value: ticket.dni, maxChars: 28 },
    { label: "Telefono", value: ticket.phone, maxChars: 28 },
    { label: "Ubicacion", value: ticket.event.location, maxChars: 28 },
    { label: "Fecha", value: formatEventShortDate(ticket.event.date), maxChars: 28 },
    { label: "Precio", value: formatPrice(ticket.event.price), maxChars: 28 },
    { label: "Codigo", value: ticket.alphanumeric_code, maxChars: 28 },
    { label: "Ticket ID", value: ticket.id, maxChars: 28 },
  ];

  page.drawRectangle({
    x: 46,
    y: 340,
    width: 276,
    height: 320,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.88, 0.84, 0.78),
    borderWidth: 1,
  });

  page.drawText("Datos de la entrada", {
    x: 62,
    y: 640,
    size: 12,
    font: titleFont,
    color: rgb(0.12, 0.11, 0.1),
  });

  let lineY = 616;

  lines.forEach((line) => {
    const wrappedLines = wrapText(`${line.label}: ${line.value}`, line.maxChars);

    wrappedLines.forEach((wrappedLine, wrappedIndex) => {
      page.drawText(wrappedLine, {
      x: 62,
      y: lineY - wrappedIndex * 16,
      size: 11.5,
      font: bodyFont,
      color: rgb(0.25, 0.24, 0.22),
      maxWidth: 244,
    });
    });

    lineY -= wrappedLines.length * 16 + 8;
  });

  page.drawRectangle({
    x: 342,
    y: 408,
    width: 220,
    height: 220,
    color: rgb(0.972, 0.948, 0.914),
    borderColor: rgb(0.88, 0.84, 0.78),
    borderWidth: 1,
  });

  page.drawText("Acceso", {
    x: 362,
    y: 594,
    size: 13,
    font: titleFont,
    color: rgb(0.12, 0.11, 0.1),
  });

  page.drawText("Presenta este QR y tu DNI en el acceso al evento.", {
    x: 362,
    y: 570,
    size: 11,
    font: bodyFont,
    color: rgb(0.35, 0.33, 0.3),
    maxWidth: 180,
    lineHeight: 14,
  });

  page.drawImage(qrImage, {
    x: 384,
    y: 412,
    width: 130,
    height: 130,
  });

  page.drawRectangle({
    x: 24,
    y: 24,
    width: 547,
    height: 60,
    color: rgb(0.75, 0.36, 0.17),
  });

  page.drawText("Entrada valida para un unico acceso. Guarda este PDF y presenta el QR y tu DNI en el control.", {
    x: 46,
    y: 48,
    size: 11,
    font: bodyFont,
    color: rgb(1, 0.98, 0.95),
    maxWidth: 500,
    lineHeight: 14,
  });

  const pdfBytes = await pdf.save();
  return Buffer.from(pdfBytes);
}
