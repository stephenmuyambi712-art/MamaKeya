/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Calendar, 
  Activity, 
  Stethoscope, 
  User as UserIcon, 
  Plus, 
  ChevronRight, 
  Baby, 
  Info, 
  LogOut,
  Clock,
  Weight,
  Droplets,
  Smile,
  Moon,
  ChevronLeft,
  MessageCircle,
  Send
} from 'lucide-react';
import { api } from './services/api';
import { aiAdvisor } from './services/ai';
import { User, Symptom, HealthRecord, Appointment, PregnancyWeek, Message } from './types';

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button' }: any) => {
  const base = "px-6 py-3 rounded-full font-medium transition-all active:scale-95 flex items-center justify-center gap-2";
  const variants: any = {
    primary: "bg-rose-500 text-white shadow-lg shadow-rose-200 hover:bg-rose-600",
    secondary: "bg-white text-rose-500 border border-rose-100 hover:bg-rose-50",
    ghost: "text-gray-500 hover:bg-gray-100"
  };
  return (
    <button type={type} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-3xl p-6 shadow-sm border border-rose-50/50 ${className}`}>
    {children}
  </div>
);

const Input = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">{label}</label>}
    <input 
      {...props} 
      className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-200 transition-all"
    />
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'dashboard' | 'symptoms' | 'health' | 'appointments' | 'week-detail' | 'profile' | 'ai-advisor' | 'messages'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Data states
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentWeekInfo, setCurrentWeekInfo] = useState<PregnancyWeek | null>(null);

  // Messaging state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  useEffect(() => {
    const unsubscribe = api.onAuthChange((u) => {
      setUser(u);
      if (u) {
        fetchInitialData(u);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchInitialData = async (u: User) => {
    try {
      const week = calculateCurrentWeek(u.pregnancy_start_date);
      const weekInfo = await api.getWeekInfo(week);
      setCurrentWeekInfo(weekInfo);

      // Subscribe to real-time updates
      const unsubSymptoms = api.subscribeSymptoms(u.id, setSymptoms);
      const unsubHealth = api.subscribeHealth(u.id, setHealthRecords);
      const unsubAppointments = api.subscribeAppointments(u.id, setAppointments);

      const users = await api.getUsers();
      setAllUsers(users.filter(user => user.id !== u.id));

      return () => {
        unsubSymptoms();
        unsubHealth();
        unsubAppointments();
      };
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && selectedChatUser) {
      const unsub = api.subscribeMessages(user.id, selectedChatUser.id, setChatMessages);
      return () => unsub();
    }
  }, [user, selectedChatUser]);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setView('dashboard');
  };

  const calculateCurrentWeek = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) + 1;
    return Math.min(Math.max(week, 1), 40);
  };

  const remainingWeeks = useMemo(() => {
    if (!user) return 0;
    return 40 - calculateCurrentWeek(user.pregnancy_start_date);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center shadow-xl shadow-rose-200">
            <Heart className="text-white fill-current" size={32} />
          </div>
          <p className="text-rose-500 font-serif italic text-xl">MamaKeya</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen view={authView} setView={setAuthView} />;
  }

  return (
    <div className="min-h-screen bg-[#FDF8F7] text-gray-800 font-sans pb-24">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">MamaKeya</h1>
          <p className="text-sm text-gray-400 font-medium">Hello, {user.name.split(' ')[0]} ✨</p>
        </div>
        <button onClick={() => setView('profile')} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-rose-50">
          <UserIcon className="text-rose-400" size={24} />
        </button>
      </header>

      <main className="px-6 space-y-6">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* AI Advisor Entry */}
              <Card 
                className="bg-indigo-600 text-white border-none flex items-center gap-4 cursor-pointer hover:bg-indigo-700 transition-colors"
                onClick={() => setView('ai-advisor')}
              >
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Smile size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">MamaKeya AI Advisor</h3>
                  <p className="text-xs opacity-80">Get personalized advice based on your data</p>
                </div>
                <ChevronRight />
              </Card>

              {/* Progress Card */}
              <Card className="bg-gradient-to-br from-rose-400 to-rose-500 text-white border-none overflow-hidden relative">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest opacity-80">Current Progress</span>
                      <h2 className="text-4xl font-serif font-bold mt-1">Week {calculateCurrentWeek(user.pregnancy_start_date)}</h2>
                    </div>
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                      <Baby size={32} />
                    </div>
                  </div>
                  
                  <div className="w-full bg-white/20 h-2 rounded-full mb-2">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(calculateCurrentWeek(user.pregnancy_start_date) / 40) * 100}%` }}
                      className="bg-white h-full rounded-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs font-medium opacity-90">
                    <span>{remainingWeeks} weeks to go</span>
                    <span>Due: {new Date(user.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-rose-300/20 rounded-full blur-3xl" />
              </Card>

              {/* Baby Size Visualization */}
              <Card className="flex items-center gap-6 bg-orange-50 border-orange-100">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm text-4xl">
                  {currentWeekInfo?.baby_size.includes('seed') ? '🌱' : 
                   currentWeekInfo?.baby_size.includes('berry') ? '🫐' : 
                   currentWeekInfo?.baby_size.includes('fruit') ? '🍊' : '👶'}
                </div>
                <div>
                  <h3 className="font-bold text-orange-900">Your baby is the size of a</h3>
                  <p className="text-2xl font-serif font-bold text-orange-600">{currentWeekInfo?.baby_size}</p>
                  <button onClick={() => setView('week-detail')} className="text-xs font-bold text-orange-400 uppercase tracking-wider mt-2 flex items-center gap-1">
                    Learn more <ChevronRight size={14} />
                  </button>
                </div>
              </Card>

              {/* Health Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="flex flex-col gap-2">
                  <div className="p-2 bg-blue-50 w-fit rounded-xl">
                    <Weight className="text-blue-500" size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Weight</span>
                  <p className="text-xl font-bold">{healthRecords[0]?.weight || '--'} <span className="text-sm font-normal text-gray-400">kg</span></p>
                </Card>
                <Card className="flex flex-col gap-2">
                  <div className="p-2 bg-purple-50 w-fit rounded-xl">
                    <Activity className="text-purple-500" size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase">BP</span>
                  <p className="text-xl font-bold">{healthRecords[0]?.blood_pressure || '--'}</p>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">Quick Actions</h3>
                <div className="grid grid-cols-3 gap-3">
                  <ActionButton icon={<Droplets />} label="Symptom" onClick={() => setView('symptoms')} color="rose" />
                  <ActionButton icon={<Activity />} label="Health" onClick={() => setView('health')} color="blue" />
                  <ActionButton icon={<Calendar />} label="Visit" onClick={() => setView('appointments')} color="purple" />
                </div>
              </div>

              {/* Upcoming Appointment */}
              {appointments.length > 0 && (
                <Card className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
                    <Clock className="text-purple-500" size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">Next Appointment</h4>
                    <p className="text-xs text-gray-500">{appointments[0].doctor_name} • {new Date(appointments[0].appointment_date).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight className="text-gray-300" />
                </Card>
              )}
            </motion.div>
          )}

          {view === 'symptoms' && <SymptomsView symptoms={symptoms} onAdd={() => {}} onBack={() => setView('dashboard')} />}
          {view === 'health' && <HealthView records={healthRecords} onAdd={() => {}} onBack={() => setView('dashboard')} />}
          {view === 'appointments' && <AppointmentsView appointments={appointments} onAdd={() => {}} onBack={() => setView('dashboard')} />}
          {view === 'week-detail' && <WeekDetailView info={currentWeekInfo} onBack={() => setView('dashboard')} />}
          {view === 'profile' && <ProfileView user={user} onLogout={handleLogout} onBack={() => setView('dashboard')} />}
          {view === 'ai-advisor' && <AIAdvisorView user={user} symptoms={symptoms} health={healthRecords} appointments={appointments} onBack={() => setView('dashboard')} />}
          {view === 'messages' && (
            <MessagesView 
              user={user} 
              allUsers={allUsers} 
              selectedUser={selectedChatUser} 
              setSelectedUser={setSelectedChatUser} 
              messages={chatMessages}
              onBack={() => setView('dashboard')} 
            />
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-xl border border-rose-50 rounded-[32px] p-2 flex justify-around items-center shadow-2xl shadow-rose-100 z-50">
        <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<Heart />} />
        <NavButton active={view === 'ai-advisor'} onClick={() => setView('ai-advisor')} icon={<Smile />} />
        <NavButton active={view === 'messages'} onClick={() => setView('messages')} icon={<MessageCircle />} />
        <NavButton active={view === 'profile'} onClick={() => setView('profile')} icon={<UserIcon />} />
      </nav>
    </div>
  );
}

// --- Sub-Views ---

const ActionButton = ({ icon, label, onClick, color }: any) => {
  const colors: any = {
    rose: "bg-rose-50 text-rose-500",
    blue: "bg-blue-50 text-blue-500",
    purple: "bg-purple-50 text-purple-500"
  };
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2">
      <div className={`w-full aspect-square rounded-3xl flex items-center justify-center ${colors[color]}`}>
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
    </button>
  );
};

const NavButton = ({ active, onClick, icon }: any) => (
  <button 
    onClick={onClick}
    className={`p-4 rounded-2xl transition-all ${active ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'text-gray-400 hover:text-rose-400'}`}
  >
    {React.cloneElement(icon, { size: 24 })}
  </button>
);

const AuthScreen = ({ view, setView }: any) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', pregnancy_start_date: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (view === 'login') {
        await api.login({ email: formData.email, password: formData.password });
      } else {
        await api.register(formData);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col p-8">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-rose-500 rounded-[32px] flex items-center justify-center shadow-2xl shadow-rose-200 mx-auto mb-6 rotate-6">
            <Heart className="text-white fill-current" size={40} />
          </div>
          <h1 className="text-4xl font-serif font-bold text-gray-900">MamaKeya</h1>
          <p className="text-gray-500 mt-2">Your pregnancy journey, simplified.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-8 rounded-[40px] shadow-xl shadow-rose-100/50 border border-rose-50">
          <h2 className="text-2xl font-serif font-bold mb-6">{view === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          
          {view === 'register' && (
            <Input 
              label="Full Name" 
              placeholder="Jane Doe" 
              value={formData.name} 
              onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} 
              required
            />
          )}
          
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="jane@example.com" 
            value={formData.email} 
            onChange={(e: any) => setFormData({ ...formData, email: e.target.value })} 
            required
          />
          
          <Input 
            label="Password" 
            type="password" 
            placeholder="••••••••" 
            value={formData.password} 
            onChange={(e: any) => setFormData({ ...formData, password: e.target.value })} 
            required
          />

          {view === 'register' && (
            <Input 
              label="Pregnancy Start Date" 
              type="date" 
              value={formData.pregnancy_start_date} 
              onChange={(e: any) => setFormData({ ...formData, pregnancy_start_date: e.target.value })} 
              required
            />
          )}

          {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}

          <Button type="submit" className="w-full mt-4">
            {view === 'login' ? 'Sign In' : 'Get Started'}
          </Button>

          <button 
            type="button"
            onClick={() => setView(view === 'login' ? 'register' : 'login')}
            className="text-sm text-gray-400 font-medium w-full text-center mt-4 hover:text-rose-500 transition-colors"
          >
            {view === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

const SymptomsView = ({ symptoms, onAdd, onBack }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ symptom: '', severity: 'mild', notes: '', date_recorded: new Date().toISOString().split('T')[0] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addSymptom(formData);
    onAdd();
    setShowAdd(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm"><ChevronLeft /></button>
        <h2 className="text-2xl font-serif font-bold">Symptoms</h2>
      </div>

      <Button onClick={() => setShowAdd(true)} className="w-full">
        <Plus size={20} /> Log New Symptom
      </Button>

      <div className="space-y-4">
        {symptoms.map((s: Symptom) => (
          <Card key={s.id} className="flex justify-between items-center">
            <div>
              <h4 className="font-bold">{s.symptom}</h4>
              <p className="text-xs text-gray-400">{new Date(s.date_recorded).toLocaleDateString()}</p>
              {s.notes && <p className="text-sm text-gray-600 mt-1 italic">"{s.notes}"</p>}
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
              s.severity === 'severe' ? 'bg-rose-100 text-rose-600' : 
              s.severity === 'moderate' ? 'bg-orange-100 text-orange-600' : 
              'bg-emerald-100 text-emerald-600'
            }`}>
              {s.severity}
            </span>
          </Card>
        ))}
      </div>

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xl font-serif font-bold">Log Symptom</h3>
            <Input label="Symptom" placeholder="e.g. Nausea, Fatigue" value={formData.symptom} onChange={(e: any) => setFormData({ ...formData, symptom: e.target.value })} required />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Severity</label>
              <select 
                className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-200"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
            <Input label="Notes" placeholder="Any additional details..." value={formData.notes} onChange={(e: any) => setFormData({ ...formData, notes: e.target.value })} />
            <Input label="Date" type="date" value={formData.date_recorded} onChange={(e: any) => setFormData({ ...formData, date_recorded: e.target.value })} required />
            <Button type="submit" className="w-full">Save Symptom</Button>
          </form>
        </Modal>
      )}
    </motion.div>
  );
};

const HealthView = ({ records, onAdd, onBack }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ weight: '', blood_pressure: '', mood: 'Good', sleep_hours: '', record_date: new Date().toISOString().split('T')[0] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addHealthRecord({ ...formData, weight: Number(formData.weight), sleep_hours: Number(formData.sleep_hours) });
    onAdd();
    setShowAdd(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm"><ChevronLeft /></button>
        <h2 className="text-2xl font-serif font-bold">Health Records</h2>
      </div>

      <Button onClick={() => setShowAdd(true)} className="w-full">
        <Plus size={20} /> Add Health Record
      </Button>

      <div className="space-y-4">
        {records.map((r: HealthRecord) => (
          <Card key={r.id} className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Weight size={16} className="text-blue-400" />
              <span className="text-sm font-medium">{r.weight} kg</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-rose-400" />
              <span className="text-sm font-medium">{r.blood_pressure}</span>
            </div>
            <div className="flex items-center gap-2">
              <Smile size={16} className="text-orange-400" />
              <span className="text-sm font-medium">{r.mood}</span>
            </div>
            <div className="flex items-center gap-2">
              <Moon size={16} className="text-purple-400" />
              <span className="text-sm font-medium">{r.sleep_hours} hrs</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {new Date(r.record_date).toLocaleDateString()}
            </div>
          </Card>
        ))}
      </div>

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xl font-serif font-bold">Add Health Record</h3>
            <Input label="Weight (kg)" type="number" step="0.1" value={formData.weight} onChange={(e: any) => setFormData({ ...formData, weight: e.target.value })} required />
            <Input label="Blood Pressure" placeholder="120/80" value={formData.blood_pressure} onChange={(e: any) => setFormData({ ...formData, blood_pressure: e.target.value })} required />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Mood</label>
              <select 
                className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-200"
                value={formData.mood}
                onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
              >
                <option>Great</option>
                <option>Good</option>
                <option>Okay</option>
                <option>Tired</option>
                <option>Emotional</option>
              </select>
            </div>
            <Input label="Sleep Hours" type="number" step="0.5" value={formData.sleep_hours} onChange={(e: any) => setFormData({ ...formData, sleep_hours: e.target.value })} required />
            <Input label="Date" type="date" value={formData.record_date} onChange={(e: any) => setFormData({ ...formData, record_date: e.target.value })} required />
            <Button type="submit" className="w-full">Save Record</Button>
          </form>
        </Modal>
      )}
    </motion.div>
  );
};

const AppointmentsView = ({ appointments, onAdd, onBack }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ doctor_name: '', hospital: '', appointment_date: '', notes: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addAppointment(formData);
    onAdd();
    setShowAdd(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm"><ChevronLeft /></button>
        <h2 className="text-2xl font-serif font-bold">Appointments</h2>
      </div>

      <Button onClick={() => setShowAdd(true)} className="w-full">
        <Plus size={20} /> Schedule Appointment
      </Button>

      <div className="space-y-4">
        {appointments.map((a: Appointment) => (
          <Card key={a.id} className="flex gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex flex-col items-center justify-center text-purple-600">
              <span className="text-[10px] font-bold uppercase">{new Date(a.appointment_date).toLocaleDateString('en-US', { month: 'short' })}</span>
              <span className="text-lg font-bold leading-none">{new Date(a.appointment_date).getDate()}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold">{a.doctor_name}</h4>
              <p className="text-xs text-gray-400">{a.hospital}</p>
              {a.notes && <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-2xl italic">"{a.notes}"</p>}
            </div>
          </Card>
        ))}
      </div>

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xl font-serif font-bold">Schedule Visit</h3>
            <Input label="Doctor Name" placeholder="Dr. Smith" value={formData.doctor_name} onChange={(e: any) => setFormData({ ...formData, doctor_name: e.target.value })} required />
            <Input label="Hospital/Clinic" placeholder="City General Hospital" value={formData.hospital} onChange={(e: any) => setFormData({ ...formData, hospital: e.target.value })} required />
            <Input label="Date & Time" type="datetime-local" value={formData.appointment_date} onChange={(e: any) => setFormData({ ...formData, appointment_date: e.target.value })} required />
            <Input label="Notes" placeholder="Reason for visit, questions to ask..." value={formData.notes} onChange={(e: any) => setFormData({ ...formData, notes: e.target.value })} />
            <Button type="submit" className="w-full">Save Appointment</Button>
          </form>
        </Modal>
      )}
    </motion.div>
  );
};

const WeekDetailView = ({ info, onBack }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div className="flex items-center gap-4">
      <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm"><ChevronLeft /></button>
      <h2 className="text-2xl font-serif font-bold">Week {info?.week_number}</h2>
    </div>

    <Card className="bg-rose-50 border-rose-100 p-8 text-center">
      <div className="text-6xl mb-4">
        {info?.baby_size.includes('seed') ? '🌱' : 
         info?.baby_size.includes('berry') ? '🫐' : 
         info?.baby_size.includes('fruit') ? '🍊' : '👶'}
      </div>
      <h3 className="text-sm font-bold text-rose-400 uppercase tracking-widest">Baby is the size of a</h3>
      <p className="text-3xl font-serif font-bold text-rose-600">{info?.baby_size}</p>
    </Card>

    <div className="space-y-4">
      <DetailSection title="Baby's Development" content={info?.baby_development} icon={<Baby className="text-blue-500" />} />
      <DetailSection title="Mother's Changes" content={info?.mother_changes} icon={<Activity className="text-rose-500" />} />
      <DetailSection title="Health Tips" content={info?.health_tips} icon={<Stethoscope className="text-purple-500" />} />
      <DetailSection title="Nutrition Tips" content={info?.nutrition_tips} icon={<Droplets className="text-orange-500" />} />
    </div>
  </motion.div>
);

const DetailSection = ({ title, content, icon }: any) => (
  <Card className="space-y-2">
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <h4 className="font-bold text-gray-900">{title}</h4>
    </div>
    <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
  </Card>
);

const ProfileView = ({ user, onLogout, onBack }: any) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div className="flex items-center gap-4">
      <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm"><ChevronLeft /></button>
      <h2 className="text-2xl font-serif font-bold">Profile</h2>
    </div>

    <Card className="text-center p-8">
      <div className="w-24 h-24 bg-rose-100 rounded-[40px] flex items-center justify-center mx-auto mb-4">
        <UserIcon size={48} className="text-rose-500" />
      </div>
      <h3 className="text-2xl font-serif font-bold">{user.name}</h3>
      <p className="text-gray-400">{user.email}</p>
    </Card>

    <div className="space-y-3">
      <Card className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-500">Pregnancy Start Date</span>
        <span className="font-bold">{new Date(user.pregnancy_start_date).toLocaleDateString()}</span>
      </Card>
      <Card className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-500">Expected Due Date</span>
        <span className="font-bold text-rose-500">{new Date(user.due_date).toLocaleDateString()}</span>
      </Card>
    </div>

    <Button onClick={onLogout} variant="secondary" className="w-full border-rose-200 text-rose-600">
      <LogOut size={20} /> Sign Out
    </Button>
  </motion.div>
);

const Modal = ({ children, onClose }: any) => (
  <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
    />
    <motion.div 
      initial={{ y: "100%" }} 
      animate={{ y: 0 }} 
      exit={{ y: "100%" }}
      className="relative bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl"
    >
      <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6" />
      {children}
      <button onClick={onClose} className="absolute top-8 right-8 text-gray-300 hover:text-gray-500">
        <Plus className="rotate-45" size={24} />
      </button>
    </motion.div>
  </div>
);

const AIAdvisorView = ({ user, symptoms, health, appointments, onBack }: any) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getAIConversation(user.id).then(conv => {
      if (conv) setMessages(conv.messages);
    });
  }, [user.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', text: input } as const];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const advice = await aiAdvisor.getAdvice(user, symptoms, health, appointments, messages);
      const updatedMessages = [...newMessages, { role: 'model', text: advice || 'I am sorry, I could not generate advice at this time.' } as const];
      setMessages(updatedMessages);
      await api.updateAIConversation(user.id, updatedMessages as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm"><ChevronLeft /></button>
        <h2 className="text-2xl font-serif font-bold">AI Advisor</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Smile size={48} className="mx-auto mb-4 opacity-20" />
            <p>Ask me anything about your pregnancy journey!</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-3xl ${m.role === 'user' ? 'bg-rose-500 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-rose-50'}`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-3xl rounded-tl-none shadow-sm border border-rose-50 flex gap-1">
              <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-rose-300 rounded-full" />
              <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-rose-300 rounded-full" />
              <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-rose-300 rounded-full" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          className="flex-1 bg-white border border-rose-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
        <button type="submit" className="bg-rose-500 text-white p-3 rounded-2xl shadow-lg shadow-rose-200">
          <Send size={24} />
        </button>
      </form>
    </motion.div>
  );
};

const MessagesView = ({ user, allUsers, selectedUser, setSelectedUser, messages, onBack }: any) => {
  const [input, setInput] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedUser) return;
    await api.sendMessage(selectedUser.id, input);
    setInput('');
  };

  if (selectedUser) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-180px)]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setSelectedUser(null)} className="p-2 bg-white rounded-xl shadow-sm"><ChevronLeft /></button>
          <div>
            <h2 className="text-xl font-serif font-bold leading-none">{selectedUser.name}</h2>
            <span className="text-[10px] font-bold uppercase text-rose-400 tracking-widest">{selectedUser.role}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.map((m: Message) => (
            <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-3xl ${m.senderId === user.id ? 'bg-rose-500 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-rose-50'}`}>
                <p className="text-sm">{m.text}</p>
                <span className={`text-[8px] block mt-1 ${m.senderId === user.id ? 'text-white/60' : 'text-gray-400'}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white border border-rose-100 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
          <button type="submit" className="bg-rose-500 text-white p-3 rounded-2xl shadow-lg shadow-rose-200">
            <Send size={24} />
          </button>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm"><ChevronLeft /></button>
        <h2 className="text-2xl font-serif font-bold">Messages</h2>
      </div>

      <div className="space-y-3">
        {allUsers.map((u: User) => (
          <Card 
            key={u.id} 
            className="flex items-center gap-4 cursor-pointer hover:bg-rose-50 transition-colors"
            onClick={() => setSelectedUser(u)}
          >
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500 font-bold">
              {u.name[0]}
            </div>
            <div className="flex-1">
              <h4 className="font-bold">{u.name}</h4>
              <p className="text-xs text-gray-400 capitalize">{u.role}</p>
            </div>
            <ChevronRight className="text-gray-300" />
          </Card>
        ))}
      </div>
    </motion.div>
  );
};
