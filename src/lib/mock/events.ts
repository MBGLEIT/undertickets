import type { PublicEvent } from "@/lib/events";

export const mockEvents: PublicEvent[] = [
  {
    id: "evt-mock-1",
    slug: "indie-sunset-session",
    name: "Indie Sunset Session",
    date: "2026-07-11T20:30:00.000Z",
    location: "La Terraza del Puerto, Valencia",
    description:
      "Una noche de musica en directo con bandas emergentes, aforo limitado y ambiente intimo al aire libre.",
    imageUrl:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=80",
    ageRestriction: "+18",
    price: 1800,
    capacity: 120,
    status: "published",
    soldTickets: 74,
    remainingTickets: 46,
  },
  {
    id: "evt-mock-2",
    slug: "market-beats-local-fest",
    name: "Market Beats Local Fest",
    date: "2026-08-02T17:00:00.000Z",
    location: "Plaza Mayor, Toledo",
    description:
      "Festival local con DJs, puestos gastronomicos y programacion pensada para publico joven y familias.",
    imageUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=80",
    ageRestriction: "+16",
    price: 2500,
    capacity: 300,
    status: "published",
    soldTickets: 300,
    remainingTickets: 0,
  },
  {
    id: "evt-mock-3",
    slug: "jazz-patio-noche",
    name: "Jazz Patio Noche",
    date: "2026-09-18T19:30:00.000Z",
    location: "Patio de las Artes, Sevilla",
    description:
      "Concierto acustico de jazz contemporaneo en un formato reducido con experiencia premium y acceso numerado.",
    imageUrl:
      "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1400&q=80",
    ageRestriction: "+21",
    price: 3200,
    capacity: 90,
    status: "published",
    soldTickets: 41,
    remainingTickets: 49,
  },
];
