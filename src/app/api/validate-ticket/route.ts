import { NextResponse } from "next/server";
import { z } from "zod";
import { validateTicketByLookup } from "@/lib/ticket-validation";

const validateTicketSchema = z.object({
  value: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = validateTicketSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        status: "not_found",
        message: "Debes enviar un QR o codigo alfanumerico para validar.",
        ticket: null,
      },
      { status: 400 },
    );
  }

  const result = await validateTicketByLookup(parsedBody.data.value);
  const responseStatus =
    result.status === "validated"
      ? 200
      : result.status === "not_configured"
        ? 503
        : 409;

  return NextResponse.json(result, { status: responseStatus });
}
