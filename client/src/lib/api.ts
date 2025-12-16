import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

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

