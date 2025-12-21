import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Add Accept-Language header based on current locale
api.interceptors.request.use((config) => {
  // Get locale from localStorage (since we can't use hooks in interceptor)
  const locale = (localStorage.getItem('locale') as 'ar' | 'en') || 'ar';
  config.headers['Accept-Language'] = locale;
  return config;
});

// Handle expected 401 errors for /auth/me (user not logged in)
// This works as a fallback even if backend still returns 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // For /auth/me 401 errors, return a successful response with null user
    // This prevents browser console errors for expected "not logged in" state
    if (error.config?.url?.includes('/auth/me') && error.response?.status === 401) {
      // Return successful response with null user
      return Promise.resolve({
        data: {
          data: {
            user: null,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: error.response?.headers || {},
        config: error.config,
      });
    }
    
    // For login 401 errors, suppress console logging but still reject the promise
    // (so the UI can show the error message)
    if (error.config?.url?.includes('/auth/login') && error.response?.status === 401) {
      // Mark error to suppress console logging
      error.suppressConsoleError = true;
    }
    
    return Promise.reject(error);
  }
);

// Suppress axios network errors in console for expected 401s
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Filter out expected 401 errors
    const firstArg = args[0];
    if (
      (firstArg?.config?.url?.includes('/auth/me') && firstArg?.response?.status === 401) ||
      (firstArg?.config?.url?.includes('/auth/login') && firstArg?.response?.status === 401 && firstArg?.suppressConsoleError)
    ) {
      return; // Don't log expected errors
    }
    originalError.apply(console, args);
  };
}

// Note: Browser Network tab will still show HTTP status codes
// This is expected and cannot be suppressed (it's a browser feature)
// The interceptor above handles the error gracefully in JavaScript

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// Auth
export const authApi = {
  register: (data: { name: string; username: string; email: string; password: string; phone?: string; city?: string }) =>
    api.post<ApiResponse<{ user: any }>>('/auth/register', data),
  login: (data: { username: string; password: string }) =>
    api.post<ApiResponse<{ user: any }>>('/auth/login', data),
  logout: () => api.post<ApiResponse<{ message: string }>>('/auth/logout'),
  me: () => api.get<ApiResponse<{ user: any }>>('/auth/me'),
};

// Pitches
export const pitchesApi = {
  getAll: (params?: { city?: string; indoor?: string; minPrice?: number; maxPrice?: number; search?: string }) =>
    api.get<ApiResponse<any[]>>('/pitches', { params }),
  getById: (id: string) => api.get<ApiResponse<any>>(`/pitches/${id}`),
  getAvailability: (id: string, date: string) =>
    api.get<ApiResponse<{ availableSlots: string[]; date: string }>>(`/pitches/${id}/availability`, { params: { date } }),
};

// Bookings
export const bookingsApi = {
  create: (data: { pitchId: string; date: string; startTime: string; durationMinutes?: number }) =>
    api.post<ApiResponse<any>>('/bookings', data),
  getMyBookings: () => api.get<ApiResponse<any[]>>('/bookings/me'),
  cancel: (id: string) => api.patch<ApiResponse<any>>(`/bookings/${id}/cancel`),
};

// Teams
export const teamsApi = {
  create: (data: { name: string; city: string; logoUrl?: string; preferredPitchId?: string }) =>
    api.post<ApiResponse<any>>('/teams', data),
  getAll: (params?: { city?: string; search?: string }) =>
    api.get<ApiResponse<any[]>>('/teams', { params }),
  getById: (id: string) => api.get<ApiResponse<any>>(`/teams/${id}`),
  update: (id: string, data: { name?: string; city?: string; logoUrl?: string; preferredPitchId?: string }) =>
    api.patch<ApiResponse<any>>(`/teams/${id}`, data),
  getSuggestions: (id: string) => api.get<ApiResponse<any[]>>(`/teams/${id}/suggestions`),
  addMember: (id: string, data: { userId: string }) =>
    api.post<ApiResponse<any>>(`/teams/${id}/members`, data),
  removeMember: (id: string, userId: string) =>
    api.delete<ApiResponse<any>>(`/teams/${id}/members/${userId}`),
  getSquad: (id: string) => api.get<ApiResponse<any>>(`/teams/${id}/squad`),
  updateSquad: (id: string, data: { mode: 5 | 6; formationId?: string; slots: Array<{ slotKey: string; playerId: string | null }> }) =>
    api.put<ApiResponse<any>>(`/teams/${id}/squad`, data),
};

// Users
export const usersApi = {
  search: (params: { q: string; excludeTeamId?: string; limit?: number }) =>
    api.get<ApiResponse<any[]>>('/users/search', { params }),
};

// Leagues
export const leaguesApi = {
  create: (data: { name: string; city: string; season?: string; startDate?: string }) =>
    api.post<ApiResponse<any>>('/leagues', data),
  getAll: (params?: { city?: string; status?: string; search?: string }) =>
    api.get<ApiResponse<any[]>>('/leagues', { params }),
  getById: (id: string) => api.get<ApiResponse<any>>(`/leagues/${id}`),
  update: (id: string, data: { name?: string; city?: string; season?: string; startDate?: string }) =>
    api.patch<ApiResponse<any>>(`/leagues/${id}`, data),
  addTeam: (id: string, data: { teamId: string }) =>
    api.post<ApiResponse<any>>(`/leagues/${id}/teams`, data),
  removeTeam: (id: string, teamId: string) =>
    api.delete<ApiResponse<any>>(`/leagues/${id}/teams/${teamId}`),
  lock: (id: string) => api.post<ApiResponse<any>>(`/leagues/${id}/lock`),
  getStandings: (id: string) => api.get<ApiResponse<any[]>>(`/leagues/${id}/standings`),
};

// Matches
export const matchesApi = {
  generateSchedule: (leagueId: string) =>
    api.post<ApiResponse<any>>(`/matches/leagues/${leagueId}/generate-schedule`),
  getLeagueMatches: (leagueId: string) =>
    api.get<ApiResponse<any[]>>(`/matches/leagues/${leagueId}/matches`),
  recordResult: (id: string, data: { homeScore: number; awayScore: number }) =>
    api.post<ApiResponse<any>>(`/matches/${id}/result`, data),
  update: (id: string, data: { scheduledDate?: string; scheduledTime?: string; pitchId?: string; bookingId?: string }) =>
    api.patch<ApiResponse<any>>(`/matches/${id}`, data),
};

// Admin
export const adminApi = {
  createPitch: (data: any) => api.post<ApiResponse<any>>('/admin/pitches', data),
  updatePitch: (id: string, data: any) => api.patch<ApiResponse<any>>(`/admin/pitches/${id}`, data),
  updateWorkingHours: (id: string, data: { dayOfWeek: number; openTime: string; closeTime: string }) =>
    api.patch<ApiResponse<any>>(`/admin/pitches/${id}/working-hours`, data),
  blockSlot: (id: string, data: { date: string; startTime: string; endTime: string; reason?: string }) =>
    api.post<ApiResponse<any>>(`/admin/pitches/${id}/block-slot`, data),
  deleteBlockedSlot: (id: string) => api.delete<ApiResponse<any>>(`/admin/blocked-slots/${id}`),
  getBookings: (params?: { pitchId?: string; date?: string }) =>
    api.get<ApiResponse<any[]>>('/admin/bookings', { params }),
};

export default api;

