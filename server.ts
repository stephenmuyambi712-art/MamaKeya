import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "mamakeya-secret-key";

app.use(express.json());

// Database setup
const db = new Database("mamakeya.db");

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    pregnancy_start_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS symptoms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    symptom TEXT NOT NULL,
    severity TEXT NOT NULL,
    notes TEXT,
    date_recorded TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS health_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    weight REAL,
    blood_pressure TEXT,
    mood TEXT,
    sleep_hours REAL,
    record_date TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    doctor_name TEXT NOT NULL,
    hospital TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS pregnancy_weeks (
    week_number INTEGER PRIMARY KEY,
    baby_size TEXT,
    baby_development TEXT,
    mother_changes TEXT,
    health_tips TEXT,
    nutrition_tips TEXT
  );
`);

// Seed pregnancy weeks if empty
const weekCount = db.prepare("SELECT COUNT(*) as count FROM pregnancy_weeks").get() as { count: number };
if (weekCount.count === 0) {
  const insertWeek = db.prepare(`
    INSERT INTO pregnancy_weeks (week_number, baby_size, baby_development, mother_changes, health_tips, nutrition_tips)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const seedData = [
    [1, "Poppy seed", "Conception occurs. The fertilized egg travels to the uterus.", "You might not feel different yet.", "Start taking folic acid.", "Eat a balanced diet."],
    [2, "Poppy seed", "Implantation happens. The amniotic sac begins to form.", "Hormone levels start to rise.", "Avoid alcohol and smoking.", "Stay hydrated."],
    [3, "Peppercorn", "The embryo is growing rapidly. The heart starts to beat.", "Possible mild cramping or spotting.", "Schedule your first prenatal visit.", "Increase calcium intake."],
    [4, "Sesame seed", "Major organs begin to develop. Neural tube forms.", "Missed period. Early pregnancy symptoms like fatigue.", "Rest when you feel tired.", "Eat small, frequent meals."],
    [5, "Orange seed", "The brain and spinal cord are developing.", "Morning sickness might start.", "Ginger tea can help with nausea.", "Focus on iron-rich foods."],
    [6, "Sweet pea", "Facial features are forming. Tiny buds for limbs appear.", "Breast tenderness and frequent urination.", "Wear a supportive bra.", "Avoid unpasteurized dairy."],
    [7, "Blueberry", "Hands and feet are developing. Brain is growing fast.", "Mood swings are common.", "Practice relaxation techniques.", "Eat fiber-rich foods to prevent constipation."],
    [8, "Raspberry", "Eyelids and ears are forming. The tail is disappearing.", "Your uterus is expanding.", "Stay active with gentle exercise.", "Include healthy fats like avocado."],
    [9, "Grape", "The heart is fully formed. Muscles are developing.", "You might start to show a tiny bit.", "Listen to your body's needs.", "Stay consistent with prenatal vitamins."],
    [10, "Prune", "Vital organs are functioning. Fingers and toes are visible.", "Increased blood volume.", "Stay hydrated and move regularly.", "Eat plenty of fruits and vegetables."],
    [11, "Brussels sprout", "The baby is moving, though you can't feel it yet.", "Nausea might start to subside.", "Consider a prenatal yoga class.", "Focus on protein intake."],
    [12, "Lime", "Reflexes are developing. Fingernails appear.", "The risk of miscarriage drops significantly.", "Share the news with family and friends.", "Maintain a healthy weight gain."],
    [13, "Lemon", "Vocal cords are forming. The baby can swallow.", "Energy levels might start to return.", "Start looking into childbirth classes.", "Eat magnesium-rich foods."],
    [14, "Peach", "The baby can make facial expressions.", "The 'pregnancy glow' might appear.", "Moisturize your skin to prevent itching.", "Include lean meats and beans."],
    [15, "Apple", "The skeleton is hardening. Hair starts to grow.", "Nasal congestion is common.", "Use a humidifier if needed.", "Stay active with walking or swimming."],
    [16, "Avocado", "The baby can sense light. Limbs are well-developed.", "You might feel the first 'flutters'.", "Sleep on your side for better circulation.", "Eat calcium-rich snacks."],
    [17, "Onion", "Fat stores are beginning to form.", "Increased appetite.", "Carry healthy snacks with you.", "Focus on whole grains."],
    [18, "Sweet potato", "The baby can hear sounds. Fingerprints are formed.", "Backaches might start.", "Practice good posture.", "Include vitamin C for iron absorption."],
    [19, "Mango", "A protective coating (vernix) forms on the skin.", "Skin changes like the 'mask of pregnancy'.", "Use sunscreen when outdoors.", "Stay hydrated."],
    [20, "Banana", "The baby is very active. Halfway there!", "The top of your uterus is at your navel.", "Celebrate this milestone!", "Eat a variety of colorful foods."],
    [21, "Carrot", "The digestive system is maturing.", "Leg cramps might occur.", "Stretch your legs before bed.", "Include potassium-rich foods."],
    [22, "Papaya", "The baby looks like a miniature newborn.", "Stretch marks might appear.", "Use a gentle moisturizer.", "Focus on healthy fats."],
    [23, "Grapefruit", "The baby's lungs are preparing for breathing.", "Swelling in ankles and feet.", "Elevate your feet when resting.", "Reduce salt intake."],
    [24, "Corn", "The baby is gaining weight steadily.", "Possible Braxton Hicks contractions.", "Learn about signs of preterm labor.", "Stay consistent with exercise."],
    [25, "Cauliflower", "The baby's skin is becoming less translucent.", "Heartburn might be an issue.", "Eat smaller meals and avoid lying down after eating.", "Avoid spicy foods."],
    [26, "Kale", "The baby can open and close their eyes.", "Difficulty sleeping.", "Use a pregnancy pillow for support.", "Limit caffeine."],
    [27, "Lettuce", "The baby's brain is very active.", "Shortness of breath.", "Take it slow and rest often.", "Include DHA-rich foods."],
    [28, "Eggplant", "The baby is dreaming. Eyelashes are present.", "The third trimester begins!", "Start counting baby kicks.", "Focus on iron and vitamin C."],
    [29, "Butternut squash", "The baby's head is growing to accommodate the brain.", "Increased pressure on your bladder.", "Stay near a bathroom.", "Eat small, nutrient-dense meals."],
    [30, "Cucumber", "The baby is shedding the fine hair (lanugo).", "Mood swings might return.", "Practice deep breathing.", "Stay hydrated."],
    [31, "Pineapple", "The baby can turn their head from side to side.", "Leaking colostrum from breasts.", "Use nursing pads if needed.", "Include healthy snacks."],
    [32, "Squash", "The baby's skin is soft and smooth.", "Lower back pain.", "Use a warm compress for relief.", "Focus on protein and calcium."],
    [33, "Durian", "The baby's immune system is developing.", "Difficulty finding a comfortable position.", "Try different sitting and sleeping postures.", "Stay active but gentle."],
    [34, "Cantaloupe", "The baby's bones are fully developed but soft.", "Increased fatigue.", "Prioritize sleep.", "Eat iron-rich foods."],
    [35, "Honeydew melon", "The baby is mostly taking up space in the uterus.", "Frequent urination.", "Stay hydrated during the day.", "Prepare your hospital bag."],
    [36, "Romaine lettuce", "The baby is likely in a head-down position.", "The baby 'drops' lower into the pelvis.", "Breathe easier but walk with a waddle.", "Finalize your birth plan."],
    [37, "Swiss chard", "The baby is considered 'early term'.", "Increased vaginal discharge.", "Monitor for signs of labor.", "Rest as much as possible."],
    [38, "Leek", "The baby's organs are ready to function on their own.", "Intense Braxton Hicks.", "Stay calm and focused.", "Eat light, energy-giving foods."],
    [39, "Watermelon", "The baby is full term!", "Loss of mucus plug or water breaking.", "Contact your doctor if labor starts.", "Stay positive."],
    [40, "Pumpkin", "The baby is ready to meet you!", "Due date week.", "Be patient, the baby will come when ready.", "Keep your hospital bag ready."]
  ];

  for (const data of seedData) {
    insertWeek.run(...data);
  }
}

// Middleware for auth
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth Routes
app.post("/api/register", async (req, res) => {
  const { name, email, password, pregnancy_start_date } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const startDate = new Date(pregnancy_start_date);
  const dueDate = new Date(startDate.getTime() + 280 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const result = db.prepare("INSERT INTO users (name, email, password, pregnancy_start_date, due_date) VALUES (?, ?, ?, ?, ?)")
      .run(name, email, hashedPassword, pregnancy_start_date, dueDate);
    
    const token = jwt.sign({ id: result.lastInsertRowid, email }, JWT_SECRET);
    res.json({ token, user: { id: result.lastInsertRowid, name, email, pregnancy_start_date, due_date: dueDate } });
  } catch (error) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    delete user.password;
    res.json({ token, user });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get("/api/me", authenticateToken, (req: any, res) => {
  const user = db.prepare("SELECT id, name, email, pregnancy_start_date, due_date FROM users WHERE id = ?").get(req.user.id);
  res.json(user);
});

// Pregnancy Week Info
app.get("/api/weeks/:week", authenticateToken, (req, res) => {
  const week = db.prepare("SELECT * FROM pregnancy_weeks WHERE week_number = ?").get(req.params.week);
  res.json(week);
});

// Symptoms
app.get("/api/symptoms", authenticateToken, (req: any, res) => {
  const symptoms = db.prepare("SELECT * FROM symptoms WHERE user_id = ? ORDER BY date_recorded DESC").all(req.user.id);
  res.json(symptoms);
});

app.post("/api/symptoms", authenticateToken, (req: any, res) => {
  const { symptom, severity, notes, date_recorded } = req.body;
  db.prepare("INSERT INTO symptoms (user_id, symptom, severity, notes, date_recorded) VALUES (?, ?, ?, ?, ?)")
    .run(req.user.id, symptom, severity, notes, date_recorded);
  res.sendStatus(201);
});

// Health Records
app.get("/api/health", authenticateToken, (req: any, res) => {
  const records = db.prepare("SELECT * FROM health_records WHERE user_id = ? ORDER BY record_date DESC").all(req.user.id);
  res.json(records);
});

app.post("/api/health", authenticateToken, (req: any, res) => {
  const { weight, blood_pressure, mood, sleep_hours, record_date } = req.body;
  db.prepare("INSERT INTO health_records (user_id, weight, blood_pressure, mood, sleep_hours, record_date) VALUES (?, ?, ?, ?, ?, ?)")
    .run(req.user.id, weight, blood_pressure, mood, sleep_hours, record_date);
  res.sendStatus(201);
});

// Appointments
app.get("/api/appointments", authenticateToken, (req: any, res) => {
  const appointments = db.prepare("SELECT * FROM appointments WHERE user_id = ? ORDER BY appointment_date ASC").all(req.user.id);
  res.json(appointments);
});

app.post("/api/appointments", authenticateToken, (req: any, res) => {
  const { doctor_name, hospital, appointment_date, notes } = req.body;
  db.prepare("INSERT INTO appointments (user_id, doctor_name, hospital, appointment_date, notes) VALUES (?, ?, ?, ?, ?, ?)")
    .run(req.user.id, doctor_name, hospital, appointment_date, notes);
  res.sendStatus(201);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
