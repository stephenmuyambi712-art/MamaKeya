import { User, Symptom, HealthRecord, Appointment, PregnancyWeek } from '../types';

const API_BASE = '/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  async login(credentials: any) {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async register(data: any) {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/me`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async getWeekInfo(week: number): Promise<PregnancyWeek> {
    const res = await fetch(`${API_BASE}/weeks/${week}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch week info');
    return res.json();
  },

  async getSymptoms(): Promise<Symptom[]> {
    const res = await fetch(`${API_BASE}/symptoms`, { headers: getAuthHeader() });
    return res.json();
  },

  async addSymptom(data: any) {
    const res = await fetch(`${API_BASE}/symptoms`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  },

  async getHealthRecords(): Promise<HealthRecord[]> {
    const res = await fetch(`${API_BASE}/health`, { headers: getAuthHeader() });
    return res.json();
  },

  async addHealthRecord(data: any) {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  },

  async getAppointments(): Promise<Appointment[]> {
    const res = await fetch(`${API_BASE}/appointments`, { headers: getAuthHeader() });
    return res.json();
  },

  async addAppointment(data: any) {
    const res = await fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  }
};
