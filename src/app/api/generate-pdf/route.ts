import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildTicketPdfFilename,
  generateTicketPdfBuffer,
  getTicketWithEventById,
} from "@/lib/ticket-documents";

const generatePdfSearchSchema = z.object({
  ticketId: z.string().uuid(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsedParams = generatePdfSearchSchema.safeParse({
    ticketId: url.searchParams.get("ticketId"),
  });

  if (!parsedParams.success) {
    return NextResponse.json(
      { error: "Debes indicar un ticketId valido." },
      { status: 400 },
    );
  }

  const ticket = await getTicketWithEventById(parsedParams.data.ticketId);
  const pdfBuffer = await generateTicketPdfBuffer(ticket);

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${buildTicketPdfFilename(ticket)}"`,
    },
  });
}
