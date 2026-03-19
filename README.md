🌍 TripMe.ai
Context-Aware Travel Intelligence Platform

TripMe.ai is an AI-powered travel planning platform designed to enhance and simplify travel experiences across Sri Lanka. Unlike traditional travel apps, TripMe.ai delivers personalized, context-aware recommendations using intelligent data processing.

🚀 Features
🧠 Smart Data Collection

Collects rich travel data including:

Weather conditions 🌦️

Safety insights 🔒

Estimated costs 💰

Available facilities 🏨

📍 Geolocation Support

Automatically detects user location (Latitude & Longitude)

🖼️ Media Optimization

Converts images to WebP format for faster performance

🛠️ Admin Portal

✅ Approve or reject submitted travel locations

🔍 Data Quality Audit

Detects missing or incomplete data (e.g., no images or coordinates)

📤 Export data in:

JSON

CSV

🤖 AI-Ready Infrastructure

Built with context-aware data, including:

Crowd levels 👥

Noise levels 🔊

Best visiting times ⏰

Structured database:

Categories

District-based organization

🧱 Tech Stack
🎨 Frontend

Framework: Next.js 15+ (App Router)

Language: TypeScript

Styling: Vanilla CSS (Glassmorphism UI)

⚙️ Backend

API: FastAPI (Python)

Database: SQLite (tripme.db)

Image Processing: Pillow

Server: Uvicorn

📂 Project Structure (Example)
tripme-ai/
│── frontend/        # Next.js App
│── backend/         # FastAPI Server
│── database/        # SQLite DB
│── assets/          # Images & media
│── README.md
⚡ Getting Started
1. Clone the Repository
git clone https://github.com/your-username/tripme-ai.git
cd tripme-ai
2. Setup Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
3. Setup Frontend
cd frontend
npm install
npm run dev
📊 Future Enhancements

🌐 Real-time travel recommendations

📱 Mobile app integration

🧭 AI trip planner (auto itinerary generation)

⭐ User reviews & ratings system

🤝 Contributing

Contributions are welcome! Feel free to fork this repo and submit pull requests.

📄 License

This project is licensed under the MIT License.

💡 Vision

To become Sri Lanka’s smartest travel assistant, delivering intelligent, personalized, and unforgettable travel experiences.
