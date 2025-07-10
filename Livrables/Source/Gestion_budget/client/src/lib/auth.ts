import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  department?: string;
}

export interface AuthResponse {
  user: User;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    return response.json();
  },

  logout: async (): Promise<void> => {
    await apiRequest("POST", "/api/auth/logout");
  },

  getMe: async (): Promise<AuthResponse> => {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },
};
