const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

let onApiError: ((error: ApiError) => void) | null = null;

export const setApiErrorHandler = (handler: ((error: ApiError) => void) | null) => {
  onApiError = handler;
};

// Token provider for global injection
let getToken: (() => Promise<string | null>) | null = null;

export const setTokenProvider = (provider: () => Promise<string | null>) => {
  getToken = provider;
};

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Inject token if provider is set
  let token: string | null = null;
  if (getToken) {
    try {
      token = await getToken();
    } catch (e) {
      console.warn("Failed to get token", e);
    }
  }

  const isFormDataBody =
    typeof FormData !== 'undefined' &&
    options.body instanceof FormData;

  const config: RequestInit = {
    ...options,
    headers: {
      ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (error: any) {
    // Browser network/CORS failures often surface as TypeError: Failed to fetch
    const hint = `Network error calling ${url}. Is the backend running and CORS configured?`;
    const apiError = new ApiError(0, `${hint}${error?.message ? ` (${error.message})` : ''}`);
    onApiError?.(apiError);
    throw apiError;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    const apiError = new ApiError(response.status, error.message || 'Request failed');
    onApiError?.(apiError);
    throw apiError;
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    fetchApi<{ success: boolean; user: any; token?: string | null }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: {
    name: string;
    email: string;
    password: string;
    studentId?: string;
    department?: string;
  }) =>
    fetchApi<{
      success: boolean;
      user: any;
      email: string;
      token?: string | null;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => fetchApi<{ success: boolean; user: any }>('/auth/me'),

  verifyEmail: (data: { email: string; code: string }) =>
    fetchApi<{ success: boolean; user: any }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resendVerification: (data: { email: string }) =>
    fetchApi<{ success: boolean }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  googleSignIn: (credential: string) =>
    fetchApi<{ success: boolean; user: any; token?: string | null }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),
};

// Users API
export const usersApi = {
  getAll: (role?: string, token?: string, email?: string) => {
    let query = role ? `?role=${role}` : '';
    if (email) {
      query += query ? `&email=${email}` : `?email=${email}`;
    }
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return fetchApi<any[]>(`/users${query}`, { headers });
  },

  getById: (id: string) => fetchApi<any>(`/users/${id}`),

  create: (data: any) =>
    fetchApi<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    fetchApi<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getMe: () => fetchApi<any>('/users/me'),

  updateMe: (data: any) =>
    fetchApi<any>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  uploadMyAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchApi<any>('/users/me/avatar', {
      method: 'POST',
      body: formData,
    });
  },

  updatePassword: (id: string, oldPassword: string, newPassword: string) =>
    fetchApi<any>(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  updateMyPassword: (oldPassword: string, newPassword: string) =>
    fetchApi<any>(`/users/me/password`, {
      method: 'PATCH',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  toggleStatus: (id: string) =>
    fetchApi<any>(`/users/${id}/status`, {
      method: 'PATCH',
    }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// Activities API
export const activitiesApi = {
  getAll: (params?: { status?: string; category?: string; coordinatorId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchApi<any[]>(`/activities${query ? `?${query}` : ''}`);
  },

  getById: (id: string) => fetchApi<any>(`/activities/${id}`),

  create: (data: any) =>
    fetchApi<any>('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    fetchApi<any>(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/activities/${id}`, {
      method: 'DELETE',
    }),
};

// Applications API
export const applicationsApi = {
  getAll: (params?: { status?: string; studentId?: string; activityId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchApi<any[]>(`/applications${query ? `?${query}` : ''}`);
  },

  getApprovedForAttendance: (activityId: string) =>
    fetchApi<any[]>(`/applications/attendance/approved?activityId=${encodeURIComponent(activityId)}`),

  getById: (id: string) => fetchApi<any>(`/applications/${id}`),

  getStats: (activityId: string) =>
    fetchApi<Record<string, number>>(`/applications/stats/${activityId}`),

  create: (data: any) =>
    fetchApi<any>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string, notes?: string) =>
    fetchApi<any>(`/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/applications/${id}`, {
      method: 'DELETE',
    }),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: { recipientId?: string; read?: boolean; type?: string }) => {
    const query = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();
    return fetchApi<any[]>(`/notifications${query ? `?${query}` : ''}`);
  },

  getById: (id: string) => fetchApi<any>(`/notifications/${id}`),

  getUnreadCount: (recipientId?: string) => {
    const query = recipientId ? `?recipientId=${recipientId}` : '';
    return fetchApi<number>(`/notifications/unread/count${query}`);
  },

  create: (data: any) =>
    fetchApi<any>('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markAsRead: (id: string) =>
    fetchApi<any>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),

  markAllAsRead: (recipientId?: string) => {
    const query = recipientId ? `?recipientId=${recipientId}` : '';
    return fetchApi<any>(`/notifications/read/all${query}`, {
      method: 'PUT',
    });
  },

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/notifications/${id}`, {
      method: 'DELETE',
    }),
};

// Attendance API
export const attendanceApi = {
  getAll: (params?: { activityId?: string; studentId?: string; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchApi<any[]>(`/attendance${query ? `?${query}` : ''}`);
  },

  getById: (id: string) => fetchApi<any>(`/attendance/${id}`),

  getStats: (activityId: string) =>
    fetchApi<Record<string, number>>(`/attendance/stats/${activityId}`),

  markAttendance: (data: any) =>
    fetchApi<any>('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  batchMarkAttendance: (data: {
    activityId: string;
    attendanceData: Array<{
      studentId: string;
      studentName: string;
      applicationId: string;
      status: string;
    }>;
    markedBy: string;
  }) =>
    fetchApi<any[]>('/attendance/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Audit Logs API (Admin only)
export const auditLogsApi = {
  getAll: (params?: { q?: string; action?: string; actorId?: string; targetId?: string; from?: string; to?: string; skip?: number; take?: number }) => {
    const query = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>),
    ).toString();
    return fetchApi<any[]>(`/audit-logs${query ? `?${query}` : ''}`);
  },
};

