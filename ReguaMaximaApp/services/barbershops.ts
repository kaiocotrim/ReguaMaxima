const API_URL = "https://reguamaxima.cotrimdev.com.br";

export type Barbershop = {
  id: string;
  name: string;
  address: string;
  cidade: string | null;
  imageUrl: string;
  capaUrl: string | null;
  acceptsBookings: boolean;
  averageRating: number | null;
  reviewCount: number;
};

export type BarbershopDetails = Barbershop & {
  phones: string[];
  instagram: string | null;
  description: string | null;
  services: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string;
    price: number;
    duration: number;
  }[];
  barbers: {
    id: string;
    name: string;
    avatar: string | null;
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    userName: string;
  }[];
};

type BarbershopsResponse = {
  data?: Barbershop[];
  error?: string;
};

type BarbershopDetailsResponse = {
  data?: BarbershopDetails;
  error?: string;
};

export async function listBarbershops(search = "", service = "") {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (service.trim()) params.set("service", service.trim());

  const query = params.toString();
  const response = await fetch(`${API_URL}/api/barbershops${query ? `?${query}` : ""}`, {
    headers: { Accept: "application/json" },
  });
  const data = (await response.json()) as BarbershopsResponse;

  if (!response.ok || !data.data) {
    throw new Error(data.error || "Não foi possível carregar as barbearias.");
  }

  return data.data;
}

export async function getBarbershop(id: string) {
  const response = await fetch(`${API_URL}/api/barbershops/${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json" },
  });
  const data = (await response.json()) as BarbershopDetailsResponse;

  if (!response.ok || !data.data) {
    throw new Error(data.error || "Não foi possível carregar a barbearia.");
  }

  return data.data;
}
