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
