import { getAccessToken } from "./auth";

const API_URL = "https://reguamaxima.cotrimdev.com.br";

type AvailabilityResponse = {
  data?: {
    barberIds?: string[];
    firstTimes?: Record<string, string>;
    times?: string[];
  };
  error?: string;
};

type CreateBookingResponse = {
  data?: { bookingId: string };
  error?: string;
};

export type UpcomingBooking = {
  id: string;
  date: string;
  status: "EM_ANDAMENTO";
  service: { name: string };
  barbershop: {
    id: string;
    name: string;
    imageUrl: string;
  };
};

export type AppointmentStatus = "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO";

export type Appointment = {
  id: string;
  date: string;
  status: AppointmentStatus;
  durationMinutes?: number | null;
  agreedPrice?: number;
  service: { id?: string; name: string; price?: number; duration?: number };
  barbershop: {
    id: string;
    name: string;
    imageUrl: string;
    address?: string;
  };
  barber?: {
    id: string;
    nome: string | null;
    avatar: string | null;
    user: { name: string; image: string | null };
  };
};

type UpcomingBookingsResponse = {
  data?: UpcomingBooking[];
  error?: string;
};

type AppointmentsResponse = {
  data?: Appointment[];
  error?: string;
};

type CancelBookingResponse = {
  data?: { bookingId: string; status: "CANCELADO" };
  error?: string;
};

async function parseResponse<T>(response: Response) {
  const text = await response.text();
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.includes("application/json")) {
    if (response.status === 404) {
      throw new Error(
        "O serviço de agendamento ainda não está disponível no servidor publicado.",
      );
    }

    throw new Error(
      `O servidor de agendamento respondeu de forma inesperada (status ${response.status}).`,
    );
  }

  if (!text.trim()) {
    throw new Error(
      `O servidor de agendamento não retornou dados (status ${response.status}).`,
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `O servidor retornou um JSON inválido (status ${response.status}).`,
    );
  }
}

export async function getAvailableBarbers(
  barbershopId: string,
  serviceId: string,
  date: string,
) {
  const params = new URLSearchParams({ serviceId, date });
  const response = await fetch(
    `${API_URL}/api/barbershops/${encodeURIComponent(barbershopId)}/availability?${params}`,
    { headers: { Accept: "application/json" } },
  );
  const data = await parseResponse<AvailabilityResponse>(response);
  if (!response.ok || !data.data?.barberIds) {
    throw new Error(data.error || "Não foi possível consultar os barbeiros.");
  }
  return data.data.barberIds;
}

export async function getAvailableTimes(
  barbershopId: string,
  serviceId: string,
  barberId: string,
  date: string,
) {
  const params = new URLSearchParams({ serviceId, barberId, date });
  const response = await fetch(
    `${API_URL}/api/barbershops/${encodeURIComponent(barbershopId)}/availability?${params}`,
    { headers: { Accept: "application/json" } },
  );
  const data = await parseResponse<AvailabilityResponse>(response);
  if (!response.ok || !data.data?.times) {
    throw new Error(data.error || "Não foi possível consultar os horários.");
  }
  return data.data.times;
}

export async function createBooking(input: {
  barbershopId: string;
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
}) {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error("Sua sessão expirou. Entre novamente.");

  const response = await fetch(`${API_URL}/api/mobile/bookings`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  });
  const data = await parseResponse<CreateBookingResponse>(response);
  if (!response.ok || !data.data) {
    throw new Error(data.error || "Não foi possível concluir o agendamento.");
  }
  return data.data;
}

export async function listUpcomingBookings() {
  const accessToken = await getAccessToken();
  if (!accessToken) return [];

  const response = await fetch(`${API_URL}/api/mobile/bookings`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await parseResponse<UpcomingBookingsResponse>(response);
  if (!response.ok || !data.data) {
    throw new Error(data.error || "Não foi possível carregar seus agendamentos.");
  }
  return data.data;
}

export async function listAppointments() {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error("Sua sessão expirou. Entre novamente.");

  const response = await fetch(`${API_URL}/api/mobile/bookings?scope=all`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await parseResponse<AppointmentsResponse>(response);
  if (!response.ok || !data.data) {
    throw new Error(data.error || "Não foi possível carregar seus agendamentos.");
  }
  return data.data;
}

export async function cancelBooking(bookingId: string) {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error("Sua sessão expirou. Entre novamente.");

  const response = await fetch(
    `${API_URL}/api/mobile/bookings/${encodeURIComponent(bookingId)}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  const data = await parseResponse<CancelBookingResponse>(response);
  if (!response.ok || !data.data) {
    throw new Error(data.error || "Não foi possível cancelar o agendamento.");
  }
  return data.data;
}
