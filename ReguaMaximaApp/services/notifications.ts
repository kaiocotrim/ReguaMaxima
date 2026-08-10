import { getValidAccessToken } from "./auth";

const API_URL = "https://reguamaxima.cotrimdev.com.br";

export type UserNotification = {
  id: string;
  title: string;
  message: string;
  bookingId: string | null;
  readAt: string | null;
  createdAt: string;
};

type ListResponse = { data?: UserNotification[]; error?: string };
type ReadResponse = { data?: { updated: number }; error?: string };

async function request<T>(method: "GET" | "PATCH", body?: object) {
  const token = await getValidAccessToken();
  const response = await fetch(`${API_URL}/api/mobile/notifications`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let result: T;
  try {
    result = JSON.parse(text) as T;
  } catch {
    throw new Error(response.status === 404
      ? "O serviço de notificações ainda não está disponível no servidor publicado."
      : "O servidor respondeu de forma inesperada.");
  }
  return { response, result };
}

export async function listNotifications() {
  const { response, result } = await request<ListResponse>("GET");
  if (!response.ok || !result.data) throw new Error(result.error || "Não foi possível carregar suas notificações.");
  return result.data;
}

export async function markNotificationsRead(notificationId?: string) {
  const { response, result } = await request<ReadResponse>("PATCH", { notificationId });
  if (!response.ok || !result.data) throw new Error(result.error || "Não foi possível atualizar as notificações.");
  return result.data.updated;
}
