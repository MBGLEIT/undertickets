export type EventStatus = "draft" | "published" | "sold_out" | "cancelled";

export type EventRecord = {
  id: string;
  slug: string;
  name: string;
  date: string;
  location: string;
  description: string;
  price: number;
  capacity: number;
  status: EventStatus;
  created_at: string;
  updated_at: string;
};

export type TicketRecord = {
  id: string;
  event_id: string;
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
};

export type EventTicketStatsRecord = {
  id: string;
  slug: string;
  name: string;
  date: string;
  location: string;
  price: number;
  capacity: number;
  sold_tickets: number;
  used_tickets: number;
  remaining_tickets: number;
};
