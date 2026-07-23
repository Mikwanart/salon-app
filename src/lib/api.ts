// Base URL for the Express API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const fetchSalons = async (searchQuery: string = '') => {
  const url = searchQuery ? `${API_URL}/salons?search=${encodeURIComponent(searchQuery)}` : `${API_URL}/salons`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch salons');
  }
  const json = await response.json();
  // Handle paginated envelope { data, total, page, limit }
  return Array.isArray(json) ? json : (json.data ?? json);
};

export const fetchSalonById = async (id: string) => {
  const response = await fetch(`${API_URL}/salons/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch salon details');
  }
  return response.json();
};

// We will add more API functions here later for Appointments and Users

export const syncUserToBackend = async (user: { name: string, email: string }, token: string) => {
  const response = await fetch(`${API_URL}/users/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    throw new Error('Failed to sync user to backend');
  }
  return response.json();
};

export const createAppointment = async (
  bookingData: { 
    salonId: string; 
    serviceId: string; 
    stylistId?: string; 
    date: string; 
    notes?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    paymentDetails?: string;
    transactionId?: string;
  }, 
  token: string
) => {
  const response = await fetch(`${API_URL}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(bookingData),
  });
  if (!response.ok) {
    let errMsg = 'Failed to create appointment';
    try {
      const errData = await response.json();
      if (errData && errData.error) {
        errMsg = errData.error;
      }
    } catch (_) {}
    throw new Error(errMsg);
  }
  return response.json();
};

export const fetchMyAppointments = async (token: string) => {
  const response = await fetch(`${API_URL}/appointments/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch appointments');
  }
  const json = await response.json();
  // Handle paginated envelope { data, total, page, limit }
  return Array.isArray(json) ? json : (json.data ?? json);
};

export const submitReview = async (reviewData: { salonId: string; rating: number; comment: string }, token: string) => {
  const response = await fetch(`${API_URL}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reviewData),
  });
  if (!response.ok) {
    throw new Error('Failed to submit review');
  }
  return response.json();
};

export const updateAppointment = async (
  id: string,
  data: { date?: string; status?: string },
  token: string
) => {
  const response = await fetch(`${API_URL}/appointments/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update appointment');
  }
  return response.json();
};

export const verifyPaymentStatus = async (id: string, token: string) => {
  const response = await fetch(`${API_URL}/appointments/${id}/verify-payment`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to verify payment status');
  }
  return response.json();
};

/**
 * Fetches already-booked time slots for a salon on a given date.
 * Public endpoint — no auth token required.
 * @param salonId - The salon UUID
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Array of time strings like ["10:00 AM", "2:30 PM"]
 */
export const fetchBookedSlots = async (salonId: string, date: string): Promise<string[]> => {
  const response = await fetch(
    `${API_URL}/appointments/booked-slots?salonId=${encodeURIComponent(salonId)}&date=${encodeURIComponent(date)}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch booked slots');
  }
  return response.json();
};

export const registerSalon = async (token: string, data: any) => {
  const response = await fetch(`${API_URL}/salons/register`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    let errMsg = 'Failed to register salon';
    try {
      const errData = await response.json();
      if (errData && errData.error) errMsg = errData.error;
    } catch (_) {}
    throw new Error(errMsg);
  }
  return response.json();
};

/** Fetches the salon owned by the logged-in salon owner. */
export const fetchSalonOwnerSalon = async (token: string) => {
  const response = await fetch(`${API_URL}/salons/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    let errMsg = 'Failed to fetch your salon';
    try {
      const errData = await response.json();
      if (errData && errData.error) errMsg = errData.error;
    } catch (_) {}
    throw new Error(errMsg);
  }
  return response.json();
};

/** Fetches all salons owned by the logged-in salon owner. */
export const fetchSalonOwnerSalons = async (token: string) => {
  const response = await fetch(`${API_URL}/salons/mine/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    let errMsg = 'Failed to fetch your salons';
    try {
      const errData = await response.json();
      if (errData && errData.error) errMsg = errData.error;
    } catch (_) {}
    throw new Error(errMsg);
  }
  return response.json();
};

/** Fetches all customer appointments booked at the owner's salon(s). */
export const fetchSalonOwnerAppointments = async (token: string, page = 1, limit = 50) => {
  const response = await fetch(`${API_URL}/salons/mine/appointments?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch salon appointments');
  const json = await response.json();
  return Array.isArray(json) ? json : (json.data ?? json);
};

export const updateSalonOwnerSalon = async (token: string, data: any) => {
  const response = await fetch(`${API_URL}/salons/mine`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update salon');
  return response.json();
};

export const createSalonService = async (token: string, data: any) => {
  const response = await fetch(`${API_URL}/salons/mine/services`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create service');
  return response.json();
};

export const updateSalonService = async (token: string, id: string, data: any) => {
  const response = await fetch(`${API_URL}/salons/mine/services/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update service');
  return response.json();
};

export const deleteSalonService = async (token: string, id: string) => {
  const response = await fetch(`${API_URL}/salons/mine/services/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to delete service');
  return response.json();
};

export const createSalonStylist = async (token: string, data: any) => {
  const response = await fetch(`${API_URL}/salons/mine/stylists`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create stylist');
  return response.json();
};

export const updateSalonStylist = async (token: string, id: string, data: any) => {
  const response = await fetch(`${API_URL}/salons/mine/stylists/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update stylist');
  return response.json();
};

export const deleteSalonStylist = async (token: string, id: string) => {
  const response = await fetch(`${API_URL}/salons/mine/stylists/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to delete stylist');
  return response.json();
};

// Admin API Functions
export const fetchAdminStats = async (token: string) => {
  const response = await fetch(`${API_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch admin stats');
  return response.json();
};

export const fetchAdminSalons = async (token: string, status: string = 'ALL', search: string = '', page: number = 1) => {
  const url = `${API_URL}/admin/salons?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}&page=${page}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch admin salons');
  return response.json();
};

export const updateSalonStatus = async (token: string, id: string, status: string) => {
  const response = await fetch(`${API_URL}/admin/salons/${id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update salon status');
  return response.json();
};

export const fetchAdminUsers = async (token: string, role: string = 'ALL', search: string = '', page: number = 1) => {
  const url = `${API_URL}/admin/users?role=${encodeURIComponent(role)}&search=${encodeURIComponent(search)}&page=${page}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch admin users');
  return response.json();
};

export const updateUserRole = async (token: string, id: string, role: string) => {
  const response = await fetch(`${API_URL}/admin/users/${id}/role`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) throw new Error('Failed to update user role');
  return response.json();
};

export const fetchAdminAppointments = async (token: string, status: string = 'ALL', search: string = '', page: number = 1) => {
  const url = `${API_URL}/admin/appointments?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}&page=${page}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch admin appointments');
  return response.json();
};

