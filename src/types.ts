export interface User {
  id: number;
  name: string;
  email: string;
  pregnancy_start_date: string;
  due_date: string;
}

export interface Symptom {
  id: number;
  symptom: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  notes: string;
  date_recorded: string;
}

export interface HealthRecord {
  id: number;
  weight: number;
  blood_pressure: string;
  mood: string;
  sleep_hours: number;
  record_date: string;
}

export interface Appointment {
  id: number;
  doctor_name: string;
  hospital: string;
  appointment_date: string;
  notes: string;
}

export interface PregnancyWeek {
  week_number: number;
  baby_size: string;
  baby_development: string;
  mother_changes: string;
  health_tips: string;
  nutrition_tips: string;
}
