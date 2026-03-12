import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { db, auth } from '../firebase';
import { User, Symptom, HealthRecord, Appointment, PregnancyWeek, Message, AIConversation } from '../types';

const API_BASE = '/api';

export const api = {
  // Auth
  async login({ email, password }: any) {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', res.user.uid));
    return { token: 'firebase-auth', user: userDoc.data() as User };
  },

  async register(data: any) {
    const { email, password, name, pregnancy_start_date } = data;
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const startDate = new Date(pregnancy_start_date);
    const dueDate = new Date(startDate.getTime() + 280 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const userData: User = {
      id: res.user.uid,
      name,
      email,
      pregnancy_start_date,
      due_date: dueDate,
      role: 'mother' // Default role
    };

    await setDoc(doc(db, 'users', res.user.uid), userData);
    return { token: 'firebase-auth', user: userData };
  },

  async logout() {
    await signOut(auth);
  },

  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          callback({ id: firebaseUser.uid, ...userDoc.data() } as User);
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },

  // Weeks (Keep SQLite for this as it's static reference data)
  async getWeekInfo(week: number): Promise<PregnancyWeek> {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE}/weeks/${week}`, { 
      headers: { 'Authorization': `Bearer ${token}` } 
    });
    if (!res.ok) throw new Error('Failed to fetch week info');
    return res.json();
  },

  // Symptoms
  async getSymptoms(userId: string): Promise<Symptom[]> {
    const q = query(collection(db, 'symptoms'), where('userId', '==', userId), orderBy('date_recorded', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Symptom));
  },

  async getHealthRecords(userId: string): Promise<HealthRecord[]> {
    const q = query(collection(db, 'health_records'), where('userId', '==', userId), orderBy('record_date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthRecord));
  },

  async getAppointments(userId: string): Promise<Appointment[]> {
    const q = query(collection(db, 'appointments'), where('userId', '==', userId), orderBy('appointment_date', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
  },

  subscribeSymptoms(userId: string, callback: (symptoms: Symptom[]) => void) {
    const q = query(collection(db, 'symptoms'), where('userId', '==', userId), orderBy('date_recorded', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const symptoms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Symptom));
      callback(symptoms);
    });
  },

  async addSymptom(data: any) {
    await addDoc(collection(db, 'symptoms'), {
      ...data,
      userId: auth.currentUser?.uid
    });
  },

  // Health
  subscribeHealth(userId: string, callback: (records: HealthRecord[]) => void) {
    const q = query(collection(db, 'health_records'), where('userId', '==', userId), orderBy('record_date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthRecord));
      callback(records);
    });
  },

  async addHealthRecord(data: any) {
    await addDoc(collection(db, 'health_records'), {
      ...data,
      userId: auth.currentUser?.uid
    });
  },

  // Appointments
  subscribeAppointments(userId: string, callback: (appointments: Appointment[]) => void) {
    const q = query(collection(db, 'appointments'), where('userId', '==', userId), orderBy('appointment_date', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      callback(appointments);
    });
  },

  async addAppointment(data: any) {
    await addDoc(collection(db, 'appointments'), {
      ...data,
      userId: auth.currentUser?.uid
    });
  },

  // Messaging
  subscribeMessages(userId: string, otherId: string, callback: (messages: Message[]) => void) {
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', userId),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Message))
        .filter(m => m.participants.includes(otherId));
      callback(messages);
    });
  },

  async sendMessage(receiverId: string, text: string) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    await addDoc(collection(db, 'messages'), {
      senderId: userId,
      receiverId,
      text,
      timestamp: new Date().toISOString(),
      participants: [userId, receiverId].sort()
    });
  },

  async getUsers(): Promise<User[]> {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => doc.data() as User);
  },

  // AI Advisor
  async getAIConversation(userId: string): Promise<AIConversation | null> {
    const q = query(collection(db, 'ai_conversations'), where('uid', '==', userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AIConversation;
  },

  async updateAIConversation(userId: string, messages: { role: 'user' | 'model'; text: string }[]) {
    const conv = await this.getAIConversation(userId);
    const data = {
      uid: userId,
      messages,
      updatedAt: new Date().toISOString()
    };
    if (conv) {
      await setDoc(doc(db, 'ai_conversations', conv.id), data);
    } else {
      await addDoc(collection(db, 'ai_conversations'), data);
    }
  }
};
