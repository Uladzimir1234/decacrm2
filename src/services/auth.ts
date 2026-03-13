import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

const authClient = axios.create({
  baseURL: apiUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

const TOKEN_KEY = 'deca_auth_token';
const REFRESH_KEY = 'deca_refresh_token';
const USERNAME_KEY = 'deca_auth_username';
const ROLE_KEY = 'deca_auth_role';
const DISPLAY_NAME_KEY = 'deca_auth_display_name';
const TEAM_MEMBER_KEY = 'deca_auth_team_member_id';

export type UserRole = 'admin' | 'seller' | 'viewer';

export interface UserInfo {
  username: string;
  role: UserRole;
  displayName: string;
  teamMemberId: number | null;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function getStoredRole(): UserRole | null {
  return localStorage.getItem(ROLE_KEY) as UserRole | null;
}

export function getStoredUserInfo(): UserInfo | null {
  const username = localStorage.getItem(USERNAME_KEY);
  if (!username) return null;
  return {
    username,
    role: (localStorage.getItem(ROLE_KEY) as UserRole) || 'viewer',
    displayName: localStorage.getItem(DISPLAY_NAME_KEY) || username,
    teamMemberId: localStorage.getItem(TEAM_MEMBER_KEY) ? parseInt(localStorage.getItem(TEAM_MEMBER_KEY)!) : null,
  };
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(DISPLAY_NAME_KEY);
  localStorage.removeItem(TEAM_MEMBER_KEY);
}

function storeAuth(data: {
  token: string;
  refreshToken?: string;
  username: string;
  role?: string;
  displayName?: string;
  teamMemberId?: number;
}) {
  localStorage.setItem(TOKEN_KEY, data.token);
  if (data.refreshToken) localStorage.setItem(REFRESH_KEY, data.refreshToken);
  localStorage.setItem(USERNAME_KEY, data.username);
  if (data.role) localStorage.setItem(ROLE_KEY, data.role);
  if (data.displayName) localStorage.setItem(DISPLAY_NAME_KEY, data.displayName);
  if (data.teamMemberId) localStorage.setItem(TEAM_MEMBER_KEY, String(data.teamMemberId));
}

export async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data } = await authClient.post('/auth/login', { username, password });
    if (data.token) {
      storeAuth(data);
      return { success: true };
    }
    return { success: false, error: 'Invalid response from server' };
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response) {
      const msg = err.response.data?.message || err.response.data?.error || 'Invalid credentials';
      return { success: false, error: msg };
    }
    return { success: false, error: 'Unable to reach server' };
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return false;
  try {
    const { data } = await authClient.post('/auth/refresh', { refreshToken });
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      if (data.role) localStorage.setItem(ROLE_KEY, data.role);
      if (data.displayName) localStorage.setItem(DISPLAY_NAME_KEY, data.displayName);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function verifyToken(): Promise<UserInfo | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const { data } = await authClient.get('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (data.valid) {
      return {
        username: data.username,
        role: data.role || 'viewer',
        displayName: data.displayName || data.username,
        teamMemberId: data.teamMemberId || null,
      };
    }
    // Try refresh
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return getStoredUserInfo();
    }
    return null;
  } catch {
    // Try refresh on failure
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return getStoredUserInfo();
    }
    return null;
  }
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  const token = getStoredToken();
  try {
    await authClient.post('/auth/logout', { refreshToken }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    // Ignore errors on logout
  }
  clearAuth();
}
