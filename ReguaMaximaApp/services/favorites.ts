import { getAccessToken } from "./auth";
import type { Barbershop } from "./barbershops";

const API_URL = "https://reguamaxima.cotrimdev.com.br";

export type FavoriteBarber = {
  id: string;
  nome: string | null;
  avatar: string | null;
  jobTitle: string;
  barbershop: { id: string; name: string } | null;
};

export type Favorites = {
  barbershops: Barbershop[];
  barbers: FavoriteBarber[];
};

type FavoritesResponse = { data?: Favorites; error?: string };
type ToggleResponse = { data?: { favorited: boolean }; error?: string };

async function parseResponse<T>(response: Response) {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const text = await response.text();
  if (!contentType.includes("application/json") || !text.trim()) {
    if (response.status === 404) {
      throw new Error("O serviço de favoritos ainda não está disponível no servidor publicado.");
    }
    throw new Error("O servidor respondeu de forma inesperada.");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("O servidor retornou uma resposta inválida.");
  }
}

async function authenticatedRequest(path: string, init?: RequestInit) {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error("Sua sessão expirou. Entre novamente.");
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });
}

export async function listFavorites() {
  const response = await authenticatedRequest("/api/mobile/favorites");
  const result = await parseResponse<FavoritesResponse>(response);
  if (!response.ok || !result.data) {
    throw new Error(result.error || "Não foi possível carregar seus favoritos.");
  }
  return result.data;
}

export async function toggleFavoriteBarbershop(barbershopId: string) {
  const response = await authenticatedRequest("/api/mobile/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ barbershopId }),
  });
  const result = await parseResponse<ToggleResponse>(response);
  if (!response.ok || !result.data) {
    throw new Error(result.error || "Não foi possível atualizar o favorito.");
  }
  return result.data.favorited;
}
