export interface User {
  id: string;
  name: string;
  email: string;
  pregnancy_start_date: string;
  due_date: string;
  role?: 'mother' | 'doctor' | 'admin';
}

export interface Symptom {
  id: string;
  userId: string;
  symptom: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes: string;
  date_recorded: string;
}

export interface HealthRecord {
  id: string;
  userId: string;
  weight: number;
  blood_pressure: string;
  mood: string;
  sleep_hours: number;
  record_date: string;
}

export interface Appointment {
  id: string;
  uid: string;
  doctor_name: string;
  hospital: string;
  appointment_date: string;
  notes: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  participants: string[];
}

export interface AIConversation {
  id: string;
  uid: string;
  messages: { role: 'user' | 'model'; text: string }[];
  updatedAt: string;
}

export interface PregnancyWeek {
  week_number: number;
  baby_size: string;
  baby_development: string;
  mother_changes: string;
  health_tips: string;
  nutrition_tips: string;
}
