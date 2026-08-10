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

type BarbershopsResponse = {
  data?: Barbershop[];
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
