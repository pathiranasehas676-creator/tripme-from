# TripMe.ai - Context-Aware Travel Intelligence Platform

TripMe.ai යනු ශ්‍රී ලංකාවේ චාරිකා සැලසුම් කිරීම පහසු කිරීම සඳහා නිර්මාණය කරන ලද, කෘතිම බුද්ධිය (AI) මූලික කරගත් නවීන මෘදුකාංග පද්ධතියකි. මෙය හුදු තොරතුරු ගබඩාවක් පමණක් නොව, පුද්ගලාරෝපිත සංචාරක අත්දැකීම් (Context-Aware Travel Planning) ලබා දීම සඳහා සැකසූ පද්ධතියකි.

## 🚀 පද්ධතියෙන් කළ හැකි දේ (Key Features)

### 1. ස්ථාන දත්ත රැස් කිරීම (Smart Data Collection)
- සංචාරක ස්ථාන වල මූලික තොරතුරු පමණක් නොව, කාලගුණය, ආරක්ෂාව, මුදල් වියදම් සහ පහසුකම් පිළිබඳ සියුම් දත්ත ඇතුළත් කිරීමේ හැකියාව.
- **Geolocation:** ඔබ සිටින ස්ථානය අනුව ස්වයංක්‍රීයව Latitude/Longitude ලබා ගැනීම.
- **Media Optimization:** ඇතුළත් කරන පින්තූර ස්වයංක්‍රීයව WebP ආකෘතියට හරවා වේගවත් preview ලබා දීම.

### 2. පරිපාලන පාලක පුවරුව (Admin Portal)
- ඇතුළත් කරන ලද ස්ථාන පරීක්ෂා කර අනුමත කිරීම (Approve) හෝ ප්‍රතික්ෂේප කිරීම (Reject).
- **Data Quality Audit:** දත්ත වල පවතින අඩුපාඩු (උදා: පින්තූර නැති ස්ථාන, පිහිටීම නැති ස්ථාන) හඳුනාගෙන ඒවා පෙන්වීම.
- **Export Data:** පද්ධතියේ ඇති දත්ත JSON සහ CSV ආකෘති වලින් ලබා ගැනීමේ පහසුකම.

### 3. AI සූදානම (AI-Ready Infrastructure)
- පද්ධතිය සතුව පවතින "Context-Aware" දත්ත (Crowd level, Noise, Best time) මඟින් AI මාදිලි වලට ඉතා නිවැරදි සංචාරක උපදෙස් ලබා දීමට මාවත සලසයි.
- දත්ත කාණ්ඩ (Categories) සහ දිස්ත්‍රික්ක (Districts) අනුව ක්‍රමවත්ව සැකසූ දත්ත ගබඩාව.

---

## 🛠 භාවිතා කර ඇති තාක්ෂණයන් (Tech Stack)

### Frontend (User Interface)
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Vanilla CSS (Glassmorphism design)

### Backend (Data Engine)
- **API:** Python FastAPI
- **Database:** SQLite (tripme.db)
- **Image Processing:** Pillow (for WebP conversion)
- **Server:** Uvicorn

---

## 💻 ලෝකල් එකේ රන් කරන ආකාරය (Setup Instructions)

### Backend එක පණ ගැන්වීමට:
1. `backend` folder එකට යන්න.
2. `pip install -r requirements.txt` ලබා දෙන්න.
3. `uvicorn main:app --port 8000 --reload` මඟින් සර්වර් එක ආරම්භ කරන්න.

### Frontend එක පණ ගැන්වීමට:
1. `frontend` folder එකට යන්න.
2. `npm install` ලබා දෙන්න.
3. `npm run dev` ලබා දෙන්න.

**URL:** [http://localhost:3005](http://localhost:3005)

---

## 🔐 රහස්පද (Access Credentials)
- **Admin Login:** [http://localhost:3005/admin](http://localhost:3005/admin)
- **Password:** `admin123`

---
© 2026 TripMe.ai Team. Precision engineered for Sri Lankan Tourism.
