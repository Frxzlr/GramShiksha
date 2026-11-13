# GramShiksha (ग्रामशिक्षा)

> **Offline-first learning and infrastructure planning platform for rural Indian schools.** Built for intermittent connectivity, multi-grade classrooms, and resource-constrained environments aligned with India's **Samagra Shiksha** mission.

---

## 1. Problem Statement

Rural schools across India face severe infrastructural and connectivity bottlenecks:
* **Intermittent Connectivity:** Cellular and broadband coverage in rural and tribal belts often fluctuates between 0 and 5 Mbps with high network downtime (often exceeding 50%).
* **Bilingual Learning Gap:** Students transition from local vernacular mediums to English curricula; comprehension drops without parallel Hindi support.
* **Severe Resource Disparities:** Many village schools suffer from missing textbooks, damaged solar chargers, or insufficient digital learning tablets.
* **Administrative Blindspots:** Block and district education officers lack unified real-time visibility into which schools urgently require hardware intervention vs. academic support.
* **Teacher Bandwidth:** Rural educators frequently teach composite/multi-grade classes and spend extensive time creating custom formative assessments.

**GramShiksha** solves these challenges by combining an **offline-first student learning PWA**, a **district planner dashboard**, an **inventory resource tracker**, and an **AI-assisted teacher lesson creator**.

---

## 2. Architecture

```
                       ┌─────────────────────────────────────────────────────────┐
                       │                   Client (Frontend PWA)                 │
                       │   Vite + React 19 + Tailwind v4 + Recharts (Port 5173)   │
                       └────────────────────────────┬────────────────────────────┘
                                                    │
                 ┌──────────────────────────────────┴──────────────────────────────────┐
                 ▼                                                                     ▼
    ┌──────────────────────────┐                                          ┌──────────────────────────┐
    │       Student Tab        │                                          │  Planner & Tracker Tabs  │
    │ • Offline-first quizzes  │                                          │ • 4 Stat Summary Cards   │
    │ • Bilingual lessons      │                                          │ • Recharts Bar Visuals   │
    │ • Local queue / fallback │                                          │ • Priority Score (0-100) │
    │ • Online/offline badge   │                                          │ • Inline stock +/- edits │
    └────────────┬─────────────┘                                          └────────────┬─────────────┘
                 │                                                                     │
                 │                 ┌───────────────────────────┐                       │
                 │                 │        Teacher Tab        │                       │
                 │                 │ • Chapter text digestion  │                       │
                 │                 │ • Gemini 2.5 / Claude AI  │                       │
                 │                 │ • Offline demo fallback   │                       │
                 │                 │ • Bilingual editor/publish│                       │
                 │                 └─────────────┬─────────────┘                       │
                 │                               │                                     │
                 └───────────────────────────────┼─────────────────────────────────────┘
                                                 │ HTTP / REST
                                                 ▼
                       ┌─────────────────────────────────────────────────────────┐
                       │                  Server (Backend API)                   │
                       │           Node.js + Express ES Modules (Port 4000)      │
                       ├─────────────────────────────────────────────────────────┤
                       │  • GET/POST /api/lessons      • GET/POST /api/results   │
                       │  • GET      /api/schools      • GET/PATCH /api/resources│
                       │  • GET      /api/analytics    • POST /api/generate      │
                       └────────────────────────────┬────────────────────────────┘
                                                    │
                                                    ▼
                       ┌─────────────────────────────────────────────────────────┐
                       │                     File Storage                        │
                       │    backend/data.json (auto-migrating seed collections)  │
                       └─────────────────────────────────────────────────────────┘
```

* **Client (Frontend):** Fast Vite + React 19 PWA styled with modern Tailwind CSS v4. Features responsive tabs (**Student**, **Planner**, **Resources**, and **Teacher**), real-time network connectivity detection, and Recharts analytics.
* **Server (Backend):** Lightweight Node.js Express server utilizing native `fetch` with no heavy database dependencies. Automatically populates and migrates missing seed data (`schools`, `resources`, `results`, `lessons`) into `backend/data.json`.
* **AI Orchestration (`POST /api/generate`):** Server-side LLM integration supporting **Google Gemini 2.5 Flash** or **Anthropic Claude 3.7 Sonnet / Claude Sonnet 4.6**, falling back gracefully to an offline demo module with zero runtime 500s.

---

## 3. Solution Areas Mapping

| # | Problem-Statement Solution Area | Implemented Features in GramShiksha | Code Location |
|---|----------------------------------|--------------------------------------|---------------|
| **1** | **Intermittent Connectivity & Offline Resilience** | Resilient client-side API layer, online/offline network indicator, graceful offline fallback, local quiz queue handling (`onQueued`), auto-reconnect sync status. | `frontend/src/App.jsx`, `frontend/src/pages/Student.jsx` |
| **2** | **Bilingual & Contextual Pedagogy** | Dual-language curriculum display featuring clear English summaries paired with parallel Hindi summaries (`summary_hi`) for rural students in classes 6–8. | `frontend/src/pages/Student.jsx`, `backend/server.js` |
| **3** | **School Infrastructure & Resource Allocation** | Real-time Resource Tracker table with school-level filtering, red highlights on shortage gaps (`needed > stock`), and inline `+/-` stock updates with optimistic UI updates. | `frontend/src/pages/Resources.jsx`, `backend/server.js` |
| **4** | **District Analytics & Needs Prioritization** | Planner Dashboard with 4 high-level KPI cards, Recharts visualizations for quiz scores and internet bandwidth (Mbps), and a 0–100 weighted priority score ranking schools needing urgent intervention. | `frontend/src/pages/Planner.jsx`, `backend/server.js` |
| **5** | **AI-Assisted Lesson & Assessment Creation** | Teacher studio that accepts chapter text excerpts and generates bilingual lessons + 5-question comprehension quizzes via Gemini or Claude, featuring interactive editing and demo-mode fallback. | `frontend/src/pages/Teacher.jsx`, `backend/server.js` |
| **6** | **Low-Bandwidth & Device Independence** | Clean mobile-first design, green-600 thematic consistency, zero heavy CSS/UI runtime libraries, responsive horizontal scroll tables, and defensive payload handling. | `frontend/src/index.css`, `frontend/src/pages/*.jsx` |

---

## 4. Setup & Running Locally

### Prerequisites
* **Node.js** v20.x or higher
* **npm** v10.x or higher

### 1. Backend Setup
```bash
cd backend
npm install

# (Optional) Add your AI API key to backend/.env
# echo "GEMINI_API_KEY=your_key_here" >> .env
# OR
# echo "ANTHROPIC_API_KEY=your_key_here" >> .env

npm run dev
```
* The backend runs on `http://localhost:4000`.
* If no API key is provided, the AI lesson generator automatically operates in **Demo Mode**.

### 2. Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
* The frontend runs on `http://localhost:5173`.

---

## 5. Offline Demo Script

Follow these steps to demonstrate the offline-first experience:

1. **Initial Online Load:**
   * Open `http://localhost:5173` in your browser.
   * Verify the green **Online** status badge and **Synced** indicator in the header.
   * Open the **Student** tab to load the lesson catalogue from `/api/lessons`.
2. **Go Offline:**
   * Open Chrome DevTools (`F12` or `Cmd+Option+I`) -> Navigate to the **Network** tab -> Change throttling dropdown from **No throttling** to **Offline**.
   * Notice the header status badge updates immediately to amber **Offline**.
3. **Take a Quiz Offline:**
   * In the **Student** tab, select a lesson (e.g., "The Water Cycle" or "Fractions").
   * Read the English explanation and the Hindi summary (`हिंदी सारांश`).
   * Complete the quiz questions and click **Submit Answers**.
   * The quiz scores immediately and queues the attempt locally without crashing.
4. **Reconnect & Sync:**
   * Switch the DevTools Network dropdown back to **No throttling** (Online).
   * Observe the status badge switch back to green **Online** and the sync badge display **Syncing...** -> **Synced**.
5. **Generate & Publish Lessons (Teacher Tab):**
   * Switch to the **Teacher** tab.
   * Paste textbook notes into the chapter box (minimum 40 characters) and click **Generate lesson + quiz**.
   * With no API key set, notice the amber banner: `Demo mode: no AI key found, showing a sample lesson.`
   * Edit the title or questions directly in the preview, then click **Publish to students**.
   * Switch to the **Student** tab to immediately see the newly published lesson available for rural learners.
