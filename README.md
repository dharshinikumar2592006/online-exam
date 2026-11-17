# Online Examination System Using Finite Automata (MERN Stack)

A full-stack, production-ready Online Examination System built on the **MERN** stack (MongoDB, Express.js, React.js with Vite, Node.js) featuring a **Deterministic Finite Automaton (DFA)** execution engine in the backend that formally controls and validates the examination security lifecycle.

---

## 🔬 Deterministic Finite Automaton (DFA) Architecture

The backend implements a formal Deterministic Finite Automaton:
$$\mathbf{M} = (Q, \Sigma, \delta, q_0, F)$$

### 1. State Set $Q = \{S_0, S_1, S_2, S_3, S_4, S_5, S_6\}$
| State | Name | Category | Description |
|---|---|---|---|
| **$S_0$** | `NOT_LOGGED_IN` | Initial State ($q_0$) | Unauthenticated user. No examination data or questions accessible. |
| **$S_1$** | `AUTHENTICATED` | Normal State | User credentials verified via JWT. Access to exam catalog and profile. |
| **$S_2$** | `EXAM_ACCESS_GRANTED` | Normal State | Prerequisites verified, rules and honor code presented to student. |
| **$S_3$** | `EXAM_IN_PROGRESS` | Active State | Live test session. Timer ticking, questions active, answers saved. |
| **$S_4$** | `SUBMITTED` | Accepting State ($F_1$) | Student voluntarily completes and manually submits examination. |
| **$S_5$** | `AUTO_SUBMITTED` | Accepting State ($F_2$) | Countdown timer hits `00:00`; backend automatically grades test. |
| **$S_6$** | `BLOCKED` | Trap / Dead State | Triggered upon 3 tab-switching security infractions or admin block. |

### 2. Alphabet $\Sigma$
`LOGIN`, `LOGOUT`, `REQUEST_EXAM_ACCESS`, `START_EXAM`, `SAVE_ANSWER`, `MANUAL_SUBMIT`, `TIME_EXPIRED`, `VIOLATION_DETECTED`, `ADMIN_BLOCK`, `ADMIN_UNBLOCK`

### 3. Transition Function $\delta: Q \times \Sigma \to Q$
- $\delta(S_0, \text{LOGIN}) = S_1$
- $\delta(S_1, \text{LOGOUT}) = S_0$
- $\delta(S_1, \text{REQUEST_EXAM_ACCESS}) = S_2$
- $\delta(S_1, \text{ADMIN_BLOCK}) = S_6$
- $\delta(S_2, \text{START_EXAM}) = S_3$
- $\delta(S_2, \text{LOGOUT}) = S_0$
- $\delta(S_2, \text{VIOLATION_DETECTED}) = S_6$
- $\delta(S_2, \text{ADMIN_BLOCK}) = S_6$
- $\delta(S_3, \text{SAVE_ANSWER}) = S_3$ *(Deterministic self-loop)*
- $\delta(S_3, \text{MANUAL_SUBMIT}) = S_4$ *(Accepting final state)*
- $\delta(S_3, \text{TIME_EXPIRED}) = S_5$ *(Accepting final state on timeout)*
- $\delta(S_3, \text{VIOLATION_DETECTED}) = S_6$ *(Excessive tab switches)*
- $\delta(S_3, \text{ADMIN_BLOCK}) = S_6$ *(Administrative emergency freeze)*
- $\delta(S_6, \text{ADMIN_UNBLOCK}) = S_1$ *(Administrative reset to authenticated)*

> **Server-Side Enforcement**: Any attempt to perform an unmapped transition (e.g. attempting to save answers from $S_0, S_1, S_2, S_4, S_5, S_6$ or jumping directly from $S_1 \to S_4$) is immediately rejected with a formal HTTP 400 `INVALID_DFA_TRANSITION` error.

---

## 🚀 Getting Started & Execution Commands

### Prerequisites
- Node.js (v18 or higher; tested on v24)
- MongoDB service running on `mongodb://127.0.0.1:27017`

### 1. Quick Seed (Initial Accounts & Exams)
Populate the database with pre-configured administrative accounts, student accounts, and two complete sample examinations:
```bash
npm run seed
```
*(Or navigate to `backend/` and run `npm run seed`)*

### 2. Start the Backend Server
```bash
npm run dev:backend
```
Backend runs at: `http://localhost:5000`

### 3. Start the Frontend Development Server
In a separate terminal window:
```bash
npm run dev:frontend
```
Frontend runs at: `http://localhost:5173`

---

## 🔑 Pre-Configured Test Accounts

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin@exam.com` | `admin123` | Full control: create/edit exams, block/unblock students, view all scores & DFA logs |
| **Student** | `student@exam.com` | `student123` | Student portal: browse exams, take tests, view scorecard & DFA audit trails |
| **Student 2** | `alice@exam.com` | `student123` | Additional registered student account |

*Note: 1-Click Quick Demo Login buttons are also provided directly on the Login page.*

---

## 📋 Features Overview

### Student Dashboard
- **Authentication**: Registration and login with JWT and DFA state tracking.
- **Available Exams**: Browse active exams with duration, question count, and pass threshold.
- **Access Protocol ($S_1 \to S_2$)**: Exam guidelines, anti-cheating warning, and honor code acknowledgement.
- **Live Exam Room ($S_2 \to S_3$)**:
  - Live countdown timer with color alerts (warning at < 5 min, critical at < 1 min).
  - Question palette with status indicators (Current, Answered, Marked for Review, Unanswered).
  - Automatic answer saving on selection ($S_3 \to S_3$).
  - Anti-cheating tab-switching detector (strikes 1-3; 3 strikes enters $S_6$ BLOCKED).
  - Manual submission confirmation modal ($S_3 \to S_4$).
  - Automatic submission when timer expires ($S_3 \to S_5$).
- **Comprehensive Scorecard**:
  - Overall marks, percentage, and pass/fail badge.
  - Question-by-question breakdown with student choice, correct answer, and academic explanation.
  - Chronological DFA State Transition history audit trail.

### Admin Dashboard
- **Executive Metrics**: Total exams, registered students, completed submissions, active in-exam count.
- **Real-Time DFA Monitor**: Live distribution of active sessions across states $S_0 \dots S_6$ and visual state machine graph.
- **Exam Management**: Create and edit assessments with interactive MCQ builder, set duration and pass score.
- **Student Management**: View students, monitor their current DFA states, execute security locks ($S_6$), unblock students ($S_6 \to S_1$), or reset exam attempts.
- **Submission Audits**: Search and filter all submissions by exam and submission type (Manual $S_4$ vs Auto-Timer $S_5$ vs Blocked $S_6$).

---

## 🧪 Automated Testing

Run the automated test suite verifying DFA transitions, rejection of illegal states, and end-to-end API lifecycle:
```bash
npm test
```
All unit tests and integration tests pass with 100% test coverage.

---

## 📂 Project Directory Structure

```
online-exam/
├── package.json               # Root orchestrator scripts
├── README.md                  # Project documentation
├── backend/
│   ├── package.json           # Backend dependencies (express, mongoose, bcrypt, jwt)
│   ├── server.js              # Express app entry & centralized error handlers
│   ├── .env                   # Server configuration & JWT secret
│   ├── config/
│   │   └── db.js              # MongoDB connection & local mongod auto-start
│   ├── dfa/
│   │   ├── states.js          # Formal states S0..S6 and transition matrix delta
│   │   ├── engine.js          # Deterministic Finite Automaton execution engine
│   │   └── spec.js            # Formal mathematical specification and graph data
│   ├── models/
│   │   ├── User.js            # User schema with hashed passwords and global DFA state
│   │   ├── Exam.js            # Examination schema with questions, options, marks
│   │   └── ExamSession.js     # Exam session schema with state history & violation logs
│   ├── middleware/
│   │   ├── auth.js            # JWT protection & user extraction
│   │   ├── adminOnly.js       # Administrator access guard
│   │   └── dfaGuard.js        # Server-side DFA state requirement validator
│   ├── controllers/
│   │   ├── authController.js  # Login, registration, profile
│   │   ├── examController.js  # Exam CRUD operations
│   │   ├── dfaExamController.js # S1->S2, S2->S3, S3->S3, S3->S4, S3->S5, S3->S6 transitions
│   │   └── adminController.js # Student management, blocks, submissions, DFA overview
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── examRoutes.js
│   │   ├── dfaRoutes.js
│   │   ├── dfaExamRoutes.js
│   │   └── adminRoutes.js
│   ├── utils/
│   │   └── seed.js            # Database seeding script (admin, students, sample exams)
│   └── tests/
│       ├── dfa.test.js        # Unit tests for DFA state machine
│       └── integration.test.js# End-to-end HTTP integration test suite
└── frontend/
    ├── package.json           # Frontend dependencies (react, react-router, lucide-react)
    ├── vite.config.js         # Vite configuration with proxy to backend port 5000
    ├── index.html             # HTML5 entry with Inter font
    └── src/
        ├── main.jsx           # React DOM root
        ├── App.jsx            # App routes & layout
        ├── index.css          # Blue-and-white responsive CSS design system
        ├── context/
        │   └── AuthContext.jsx# React Context for authentication and state management
        ├── services/
        │   └── api.js         # API client service layer
        ├── components/
        │   ├── Navbar.jsx     # Header navigation with live DFA badge
        │   ├── Footer.jsx     # Footer
        │   ├── ProtectedRoute.jsx # Role-based route guard
        │   ├── DFAStateBadge.jsx  # S0-S6 colored state badges
        │   └── DFAVisualGraph.jsx # Interactive SVG Automaton state diagram
        └── pages/
            ├── Home.jsx       # Landing page with hero, live DFA diagram & quick login
            ├── Login.jsx      # Login page with 1-click demo accounts
            ├── Register.jsx   # Student registration page
            ├── student/
            │   ├── StudentDashboard.jsx  # Available exams & past results
            │   ├── ExamInstructions.jsx # S1->S2 Access verification
            │   ├── ExamRoom.jsx          # Live exam taking (S2->S3, palette, timer, S4/S5/S6)
            │   └── ExamResult.jsx        # Scorecard, review, & DFA audit trail
            └── admin/
                ├── AdminDashboard.jsx    # Metric KPIs & state distribution
                ├── ExamManager.jsx       # Exam list & status toggling
                ├── ExamEditor.jsx        # MCQ question builder & exam editor
                ├── StudentManager.jsx    # Student administration & S6 security block/unblock
                ├── SubmissionsManager.jsx# All submissions & detailed student audits
                └── DFAMonitor.jsx        # Dedicated formal Automata monitor & transition matrix
```
