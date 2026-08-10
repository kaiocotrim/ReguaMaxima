const API_URL = "https://reguamaxima.cotrimdev.com.br";

export type PublicBarber = {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  city: string | null;
  jobTitle: string;
  specialties: string[];
  barbershop: { id: string; name: string } | null;
  averageRating: number | null;
  reviewCount: number;
  portfolio: { id: string; imageUrl: string }[];
  reviews: { id: string; rating: number; comment: string | null; createdAt: string; userName: string }[];
};

export async function getPublicBarber(id: string) {
  const response = await fetch(`${API_URL}/api/barbers/${encodeURIComponent(id)}`, { headers: { Accept: "application/json" } });
  const text = await response.text();
  let result: { data?: PublicBarber; error?: string };
  try {
    result = JSON.parse(text) as { data?: PublicBarber; error?: string };
  } catch {
    throw new Error(response.status === 404 ? "O perfil ainda não está disponível no servidor publicado." : "O servidor respondeu de forma inesperada.");
  }
  if (!response.ok || !result.data) throw new Error(result.error || "Não foi possível carregar o perfil.");
  return result.data;
}
