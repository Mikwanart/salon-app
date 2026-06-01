// Base URL for the Express API
const API_URL = 'http://localhost:3001/api';

export const fetchSalons = async (searchQuery: string = '') => {
  const url = searchQuery ? `${API_URL}/salons?search=${encodeURIComponent(searchQuery)}` : `${API_URL}/salons`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch salons');
  }
  return response.json();
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

export const createAppointment = async (bookingData: { salonId: string; serviceId: string; stylistId?: string; date: string; notes?: string }, token: string) => {
  const response = await fetch(`${API_URL}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(bookingData),
  });
  if (!response.ok) {
    throw new Error('Failed to create appointment');
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
  return response.json();
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
