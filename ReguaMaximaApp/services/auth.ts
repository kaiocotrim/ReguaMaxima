// import * as SecureStore from "expo-secure-store";

// const API_URL = "https://reguamaxima.cotrimdev.com.br";

// export type AuthUser = {
//   id: string;
//   name: string | null;
//   email: string;
//   image: string | null;
//   role: "CLIENT" | "BARBER" | null;
// };

// type LoginResponse = {
//   token?: string;
//   user?: AuthUser;
//   error?: string;
// };

// export async function loginWithEmail(
//   email: string,
//   password: string,
// ): Promise<{
//   token: string;
//   user: AuthUser;
// }> {
//   const response = await fetch(
//     `${API_URL}/api/celular/login`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//       },
//       body: JSON.stringify({
//         email: email.trim().toLowerCase(),
//         password,
//       }),
//     },
//   );

//   const responseText = await response.text();

//   console.log("Status da API:", response.status);
//   console.log("Resposta da API:", responseText);

//   let data: LoginResponse;

//   try {
//     data = JSON.parse(responseText) as LoginResponse;
//   } catch {
//     throw new Error(
//       `A API respondeu em formato inválido. Status: ${response.status}`,
//     );
//   }

//   if (!response.ok) {
//     throw new Error(
//       data.error || "Não foi possível entrar.",
//     );
//   }

//   if (!data.token || !data.user) {
//     throw new Error(
//       "A API não retornou os dados necessários para o login.",
//     );
//   }

//   await SecureStore.setItemAsync(
//     "auth_token",
//     data.token,
//   );

//   await SecureStore.setItemAsync(
//     "auth_user",
//     JSON.stringify(data.user),
//   );

//   return {
//     token: data.token,
//     user: data.user,
//   };
// }

// export async function getAuthToken() {
//   return SecureStore.getItemAsync("auth_token");
// }

// export async function getStoredUser(): Promise<AuthUser | null> {
//   const storedUser =
//     await SecureStore.getItemAsync("auth_user");

//   if (!storedUser) {
//     return null;
//   }

//   try {
//     return JSON.parse(storedUser) as AuthUser;
//   } catch {
//     await SecureStore.deleteItemAsync("auth_user");
//     return null;
//   }
// }

// export async function logout() {
//   await Promise.all([
//     SecureStore.deleteItemAsync("auth_token"),
//     SecureStore.deleteItemAsync("auth_user"),
//   ]);
// }



// type ForgotPasswordResponse = {
//   message?: string;
//   error?: string;
// };

// export async function requestPasswordReset(
//   email: string,
// ): Promise<string> {
//   const normalizedEmail = email.trim().toLowerCase();

//   const response = await fetch(
//     `${API_URL}/api/forgot-password`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Accept: "application/json",
//       },
//       body: JSON.stringify({
//         email: normalizedEmail,
//       }),
//     },
//   );

//   const responseText = await response.text();

//   console.log("Status esqueci senha:", response.status);
//   console.log("Resposta esqueci senha:", responseText);

//   let data: ForgotPasswordResponse;

//   try {
//     data = JSON.parse(responseText) as ForgotPasswordResponse;
//   } catch {
//     throw new Error(
//       `A API respondeu em formato inválido. Status: ${response.status}`,
//     );
//   }

//   if (!response.ok) {
//     throw new Error(
//       data.error ||
//         "Não foi possível solicitar a recuperação de senha.",
//     );
//   }

//   return (
//     data.message ||
//     "As instruções para redefinir sua senha foram enviadas."
//   );
// }

import * as SecureStore from "expo-secure-store";

const API_URL = "https://reguamaxima.cotrimdev.com.br";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "CLIENT" | "BARBER";
};

export type MobileSessionData = {
  user: AuthUser;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

type MobileAuthResponse = {
  data?: MobileSessionData;
  code?: string;
  error?: string;
};

const STORAGE_KEYS = {
  user: "auth_user",
  accessToken: "access_token",
  accessTokenExpiresAt: "access_token_expires_at",
  refreshToken: "refresh_token",
  refreshTokenExpiresAt: "refresh_token_expires_at",
} as const;

async function saveSession(session: MobileSessionData) {
  await Promise.all([
    SecureStore.setItemAsync(
      STORAGE_KEYS.user,
      JSON.stringify(session.user),
    ),

    SecureStore.setItemAsync(
      STORAGE_KEYS.accessToken,
      session.accessToken,
    ),

    SecureStore.setItemAsync(
      STORAGE_KEYS.accessTokenExpiresAt,
      session.accessTokenExpiresAt,
    ),

    SecureStore.setItemAsync(
      STORAGE_KEYS.refreshToken,
      session.refreshToken,
    ),

    SecureStore.setItemAsync(
      STORAGE_KEYS.refreshTokenExpiresAt,
      session.refreshTokenExpiresAt,
    ),
  ]);
}

async function parseJsonResponse(
  response: Response,
): Promise<MobileAuthResponse> {
  const responseText = await response.text();

  try {
    return JSON.parse(responseText) as MobileAuthResponse;
  } catch {
    throw new Error(
      `A API respondeu em formato inválido. Status: ${response.status}`,
    );
  }
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<MobileSessionData> {
  const normalizedEmail = email.trim().toLowerCase();

  const response = await fetch(
    `${API_URL}/api/mobile/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
      }),
    },
  );

  const data = await parseJsonResponse(response);

  if (!response.ok || !data.data) {
    throw new Error(
      data.error || "Não foi possível entrar.",
    );
  }

  await saveSession(data.data);

  return data.data;
}

export async function registerWithEmail(
  name: string,
  email: string,
  password: string,
  role: "CLIENT" | "BARBER",
): Promise<MobileSessionData> {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  const response = await fetch(
    `${API_URL}/api/mobile/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: normalizedName,
        email: normalizedEmail,
        password,
        role,
      }),
    },
  );

  const data = await parseJsonResponse(response);

  if (!response.ok || !data.data) {
    if (data.code === "EMAIL_ALREADY_REGISTERED") {
      throw new Error(
        "Este e-mail já está conectado a uma conta. Entre ou recupere sua senha.",
      );
    }

    if (data.code === "INVALID_NAME") {
      throw new Error(
        data.error || "Digite um nome válido.",
      );
    }

    if (data.code === "INVALID_EMAIL") {
      throw new Error(
        data.error || "Digite um e-mail válido.",
      );
    }

    if (data.code === "INVALID_PASSWORD") {
      throw new Error(
        data.error || "Digite uma senha válida.",
      );
    }

    if (data.code === "INVALID_ROLE") {
      throw new Error(
        data.error || "Selecione o tipo de perfil.",
      );
    }

    if (data.code === "RATE_LIMITED") {
      throw new Error(
        data.error ||
          "Muitas tentativas. Aguarde alguns minutos.",
      );
    }

    throw new Error(
      data.error || "Não foi possível criar sua conta.",
    );
  }

  await saveSession(data.data);

  return data.data;
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const storedUser = await SecureStore.getItemAsync(
    STORAGE_KEYS.user,
  );

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.user);
    return null;
  }
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(
    STORAGE_KEYS.accessToken,
  );
}

let refreshSessionPromise: Promise<MobileSessionData> | null = null;

async function refreshMobileSession() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error("Sua sessão expirou. Entre novamente.");
  }

  const response = await fetch(`${API_URL}/api/mobile/auth/refresh`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok || !data.data) {
    await clearSession();
    throw new Error(data.error || "Sua sessão expirou. Entre novamente.");
  }

  await saveSession(data.data);
  return data.data;
}

export async function getValidAccessToken() {
  const [accessToken, expiresAt] = await Promise.all([
    getAccessToken(),
    getAccessTokenExpiresAt(),
  ]);
  const expiresAtTime = expiresAt ? new Date(expiresAt).getTime() : 0;

  if (accessToken && expiresAtTime > Date.now() + 30_000) {
    return accessToken;
  }

  if (!refreshSessionPromise) {
    refreshSessionPromise = refreshMobileSession().finally(() => {
      refreshSessionPromise = null;
    });
  }

  return (await refreshSessionPromise).accessToken;
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(
    STORAGE_KEYS.refreshToken,
  );
}

export async function getAccessTokenExpiresAt() {
  return SecureStore.getItemAsync(
    STORAGE_KEYS.accessTokenExpiresAt,
  );
}

export async function getRefreshTokenExpiresAt() {
  return SecureStore.getItemAsync(
    STORAGE_KEYS.refreshTokenExpiresAt,
  );
}

export async function hasStoredSession() {
  const [
    user,
    accessToken,
    refreshToken,
  ] = await Promise.all([
    SecureStore.getItemAsync(STORAGE_KEYS.user),
    SecureStore.getItemAsync(
      STORAGE_KEYS.accessToken,
    ),
    SecureStore.getItemAsync(
      STORAGE_KEYS.refreshToken,
    ),
  ]);

  return Boolean(
    user &&
      accessToken &&
      refreshToken,
  );
}

export async function clearSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(
      STORAGE_KEYS.user,
    ),
    SecureStore.deleteItemAsync(
      STORAGE_KEYS.accessToken,
    ),
    SecureStore.deleteItemAsync(
      STORAGE_KEYS.accessTokenExpiresAt,
    ),
    SecureStore.deleteItemAsync(
      STORAGE_KEYS.refreshToken,
    ),
    SecureStore.deleteItemAsync(
      STORAGE_KEYS.refreshTokenExpiresAt,
    ),
  ]);
}

export async function logout() {
  await clearSession();
}
