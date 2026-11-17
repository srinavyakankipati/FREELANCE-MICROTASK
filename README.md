# TaskForge — Freelance Micro-Task Marketplace & Escrow Platform

TaskForge is a production-grade, full-stack micro-task platform built with **Node.js, Express, MongoDB (Mongoose), Socket.io, JWT Authentication, and React 19 (Vite)**.

It delivers role-based experiences (**Client/Poster, Freelancer, and Platform Admin**), milestone-locked escrow payments, verified skill tests, real-time workspace collaboration, dispute arbitration, and comprehensive search/discovery.

---

## 🏛️ System Architecture

```mermaid
graph TD
    ClientApp[React 19 SPA / Vite] -->|REST APIs + JWT| ExpressServer[Express API Server :5000]
    ClientApp -->|WebSockets| SocketServer[Socket.io Server]
    ExpressServer -->|Mongoose ODM| MongoDatabase[(MongoDB :27017)]
    ExpressServer -->|Multer + Cloudinary (local fallback)| UploadsDir[/workspace deliverables/]
    
    subgraph Core Functional Engines
        ExpressServer --> AuthEngine[JWT & RBAC Security]
        ExpressServer --> EscrowEngine[Milestone Escrow & Release]
        ExpressServer --> MatchEngine[Skill Scoring & Recommendations]
        ExpressServer --> DisputeEngine[Arbitration & Evidence Vault]
    end
```

---

## 📁 Repository Structure

```
Freelance micro-task/
├── .env                                  # Active environment config (PORT, MONGO_URI, JWT_SECRET, etc.)
├── .env.example                          # Environment variable template
├── package.json                          # Backend dependencies and concurrently runner
├── server.js                             # Express & Socket.io server bootstrap
├── TaskForge_Postman_Collection.json     # Postman collection (74 APIs across 13 modules)
├── scripts/
│   └── seed.js                           # Complete database seed script (Users, Tasks, Tests, Milestones)
├── src/
│   ├── config/
│   │   ├── db.js                         # Mongoose MongoDB connection
│   │   └── cloudinary.js                 # Cloudinary / local storage fallback
│   ├── controllers/
│   │   ├── adminController.js            # Platform stats, user suspension, task moderation
│   │   ├── authController.js             # Register, login, getMe, role verification
│   │   ├── disputeController.js          # Dispute filing, evidence uploads, escrow split
│   │   ├── matchingController.js         # Algorithmic freelancer-task matching & applications
│   │   ├── milestoneController.js        # Milestone creation, funding, submission, release
│   │   ├── notificationController.js     # User notification read/unread management
│   │   ├── reviewController.js           # Reviews submission & average rating recalculation
│   │   ├── searchController.js           # Full-text task/freelancer search & aggregations
│   │   ├── skillTestController.js        # Assessments, auto-grading, and verified badges
│   │   ├── taskController.js             # Task CRUD, categories, status filtering
│   │   ├── userController.js             # Profiles, hourly rates, and portfolios
│   │   └── workspaceController.js        # Contract workspaces, messages, deliverable files
│   ├── middleware/
│   │   ├── auth.js                       # JWT authentication (`protect`) & RBAC (`authorize`)
│   │   ├── errorHandler.js               # Centralized error handler
│   │   └── upload.js                     # Multer disk upload handler
│   ├── models/
│   │   ├── Application.js                # Task proposals and bids
│   │   ├── Dispute.js                    # Arbitration cases, evidence, and rulings
│   │   ├── Escrow.js                     # Task escrow balances and transaction audit log
│   │   ├── File.js                       # Deliverable files metadata
│   │   ├── Message.js                    # Real-time chat messages
│   │   ├── Milestone.js                  # Task deliverables, funding states, and revisions
│   │   ├── Notification.js               # User system and contract alerts
│   │   ├── Review.js                     # Ratings and feedback
│   │   ├── SkillTest.js                  # Skill quiz questions and passing thresholds
│   │   ├── Task.js                       # Core micro-task schema
│   │   ├── TestResult.js                 # Freelancer quiz attempts and badge grants
│   │   ├── User.js                       # User accounts, skills, ratings, and role
│   │   └── Workspace.js                  # Contract collaboration room
│   ├── routes/                           # 12 Express modular route handlers
│   └── socket/                           # Socket.io event handling for real-time chat
└── client/                               # Frontend React 19 Application (Vite)
    ├── index.html                        # HTML entry point with Google Fonts (Outfit & Inter)
    ├── vite.config.js                    # Vite dev proxy configuration
    ├── package.json                      # Frontend dependencies (Lucide, Axios, React Router)
    └── src/
        ├── api/axios.js                  # Centralized Axios client with JWT auto-injection
        ├── context/
        │   ├── AuthContext.jsx           # Global user authentication state
        │   └── ToastContext.jsx          # Toast notification provider
        ├── components/
        │   ├── Navbar.jsx                # Glassmorphic responsive navigation with mobile drawer
        │   ├── ProtectedRoute.jsx        # RBAC route guard
        │   ├── NotificationBell.jsx      # Live notification badge & dropdown
        │   ├── MilestoneTracker.jsx      # Interactive milestone creation, funding & release
        │   ├── FreelancerMatchPanel.jsx  # Smart candidate ranking widget
        │   └── common/
        │       ├── LoadingState.jsx      # Reusable loading spinner with custom label
        │       ├── EmptyState.jsx        # Glassmorphic empty state card with action CTA
        │       └── ErrorState.jsx        # Error alert card with retry button
        ├── pages/
        │   ├── LandingPage.jsx           # Conversion-focused landing page with live platform stats
        │   ├── Dashboard.jsx             # Role-aware automatic dashboard router
        │   ├── dashboards/
        │   │   ├── PosterDashboard.jsx   # Client workspace, escrow metrics & task tracking
        │   │   └── FreelancerDashboard.jsx# Active contracts, proposals & badge showcase
        │   ├── AdminDashboard.jsx        # Platform oversight, moderation & arbitration
        │   ├── Login.jsx                 # Login with 1-click test role logins
        │   ├── Register.jsx              # Registration with role toggle (Client / Freelancer)
        │   ├── TasksFeed.jsx             # Public task marketplace feed
        │   ├── TaskDetail.jsx            # Task view with milestones, bids, and actions
        │   ├── PostTask.jsx              # Create task with skills chips and validation
        │   ├── MyTasks.jsx               # Filterable task management console
        │   ├── TaskApplications.jsx      # Poster application review & acceptance
        │   ├── TaskWorkspace.jsx         # Real-time chat & deliverables workspace
        │   ├── SkillTests.jsx            # Skill assessment catalog & earned badge locker
        │   ├── TakeTest.jsx              # Live assessment timer & auto-grader
        │   ├── SearchPage.jsx            # Full-text discovery for tasks & freelancers
        │   ├── Profile.jsx               # Public/private freelancer portfolio & reviews
        │   ├── MyDisputes.jsx            # Dispute cases list
        │   └── DisputeDetail.jsx         # Dispute evidence viewer & resolution console
        └── styles/
            └── index.css                 # Glassmorphic dark design system & responsive queries
```

---

## ⚡ Quick Start & Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: v6.0 or higher running locally on `mongodb://127.0.0.1:27017` (or MongoDB Atlas URI)
- **npm** or **yarn**

### 2. Environment Setup
Check that `.env` in the root directory contains:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/freelance-micro-task
JWT_SECRET=super_secret_jwt_key_taskforge_platform_2026
CLIENT_URL=http://localhost:5173
```

### 3. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 4. Seed the Database
Populate the database with pre-configured admin, poster, freelancer accounts, tasks, milestones, escrows, and skill tests:
```bash
npm run seed
```

### 5. Run the Application

#### Option A: Run Full Stack Concurrently (Recommended)
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

#### Option B: Run Services Separately
```bash
# Terminal 1: Backend API
npm run server

# Terminal 2: Frontend Client
npm run client
```

---

## 👥 Seed Accounts & Demo Credentials

All test accounts share the password: **`password123`**

| Role | Name | Email | Password | Notable Attributes / Badges |
| :--- | :--- | :--- | :--- | :--- |
| **👑 Admin** | System Admin | `admin@taskforge.io` | `password123` | Full administrative, moderation & dispute resolution privileges |
| **🏢 Client / Poster** | Alex Vance | `alex.poster@techcorp.io` | `password123` | VP of Product; has 3 active tasks with funded escrows |
| **🏢 Client / Poster** | Sarah Chen | `sarah.client@designstudio.co` | `password123` | Creative Director; has tasks in UI/UX & open dispute |
| **🏢 Client / Poster** | David Miller | `david.founder@nextgen.ai` | `password123` | Startup Founder; posted mobile & backend contracts |
| **💻 Freelancer** | Elena Rostova | `elena.dev@freelancer.io` | `password123` | `Verified: React Frontend`, `Verified: Node.js Backend`, 4.95 ⭐ Rating |
| **💻 Freelancer** | Marcus Brody | `marcus.fullstack@freelancer.io` | `password123` | `Verified: Full-Stack Architecture`, 4.88 ⭐ Rating |
| **💻 Freelancer** | Priya Sharma | `priya.uiux@freelancer.io` | `password123` | `Verified: UI/UX & Design Systems`, 5.0 ⭐ Rating |
| **💻 Freelancer** | Liam Vance | `liam.python@freelancer.io` | `password123` | `Verified: Python & Machine Learning`, 4.8 ⭐ Rating |

> **Tip**: The login page (`/login`) includes **1-click Quick Login buttons** for Client, Freelancer, and Admin for rapid demonstration.

---

## 📋 Complete API Catalog (74 Endpoints)

TaskForge implements 74 RESTful API endpoints organized into 13 modules.

### 1. System Health
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Returns service uptime and operational status |

### 2. Authentication & Roles
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register client or freelancer account with hashed password |
| `POST` | `/api/auth/login` | Public | Authenticate user & return signed JWT token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile and role |
| `GET` | `/api/auth/admin-demo` | Admin | Guarded verification endpoint for admin privileges |
| `GET` | `/api/auth/freelancer-demo`| Freelancer/Admin | Guarded verification for verified freelancer talent |

### 3. Tasks Marketplace
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks/categories` | Public | Retrieve task categories with active task counts |
| `GET` | `/api/tasks` | Public | Browse tasks feed with status, category, and keyword filters |
| `POST` | `/api/tasks` | Client/Admin | Create new micro-task with budget, deadline & required skills |
| `GET` | `/api/tasks/my-tasks` | Authenticated | Fetch tasks posted by or assigned to current user |
| `GET` | `/api/tasks/:id` | Public | Fetch single task details with poster info and assigned freelancer |
| `PUT` | `/api/tasks/:id` | Poster Only | Update task specifications, budget, or skills |
| `DELETE` | `/api/tasks/:id` | Poster Only | Delete task |

### 4. Skill Assessments & Badges
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/skill-tests` | Public / Optional Auth | List available tests with pass/fail status for current user |
| `GET` | `/api/skill-tests/my-results` | Authenticated | Fetch user test attempts and list of earned verified badges |
| `GET` | `/api/skill-tests/:id` | Public | Get assessment questions (**correct answers hidden**) |
| `POST` | `/api/skill-tests/:id/submit`| Authenticated | Submit answers for auto-scoring & verified badge grant |
| `POST` | `/api/skill-tests` | Admin Only | Create new skill test assessment |
| `PUT` | `/api/skill-tests/:id` | Admin Only | Update questions, duration, or passing threshold |

### 5. Profiles & Portfolios
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/profile/:id` | Public | Public freelancer profile with badges, portfolio & reviews |
| `PUT` | `/api/users/profile` | Authenticated | Update user headline, bio, hourly rate, and skills |
| `POST` | `/api/users/portfolio` | Authenticated | Add showcase portfolio project |
| `DELETE` | `/api/users/portfolio/:itemId` | Authenticated | Remove portfolio project |

### 6. Reviews & Reputation
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reviews` | Authenticated | Submit review on completed task; recalculates average rating |
| `GET` | `/api/reviews/user/:userId`| Public | Fetch client reviews & star ratings for a user |

### 7. Search & Discovery Engine
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/search/tasks` | Public | Multi-field search by keyword, budget, skills, category |
| `GET` | `/api/search/freelancers` | Public | Search freelancers with min rating and verified badges filter |
| `GET` | `/api/search/skills` | Public | Real-time autocomplete suggestions for skills |
| `GET` | `/api/search/trending-categories` | Public | Category analytics: active task count, average budget |
| `GET` | `/api/search/recommended-tasks` | Authenticated | Algorithmic tasks matching user skills |

### 8. Matching & Applications
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/matching/tasks/:taskId/matches` | Poster/Admin | Smart ranking of top candidate freelancers for a task |
| `GET` | `/api/matching/recommended-tasks` | Freelancer | Algorithmic job recommendations tailored to freelancer skills |
| `POST` | `/api/matching/tasks/:taskId/apply` | Freelancer | Submit proposal bid with cover letter and delivery timeline |
| `POST` | `/api/matching/tasks/:taskId/invite/:freelancerId` | Poster | Directly invite top matched freelancer to apply |
| `PATCH` | `/api/matching/tasks/:taskId/accept/:applicationId` | Poster | Accept proposal; binds freelancer & moves task to assigned |
| `GET` | `/api/matching/tasks/:taskId/applications` | Poster | View all applications received on a task |
| `GET` | `/api/matching/my-applications` | Freelancer | View proposals submitted by logged-in freelancer |

### 9. Milestones & Escrow Payments
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/milestones/tasks/:taskId/define` | Poster | Define milestone stages and allocate contract budget |
| `POST` | `/api/milestones/:milestoneId/fund` | Poster | Deposit funds into simulated escrow for milestone |
| `POST` | `/api/milestones/:milestoneId/submit` | Freelancer | Submit deliverable notes & link for client approval |
| `POST` | `/api/milestones/:milestoneId/release` | Poster | Approve work and release escrow payment to freelancer |
| `POST` | `/api/milestones/:milestoneId/request-revision` | Poster | Request revisions on submitted deliverable |
| `POST` | `/api/milestones/:milestoneId/refund` | Admin/Poster | Refund deposited escrow funds |
| `GET` | `/api/milestones/tasks/:taskId/escrow` | Authenticated | View escrow balance and complete transaction audit log |
| `GET` | `/api/milestones/tasks/:taskId` | Authenticated | List all milestones and current states for a task |
| `GET` | `/api/milestones/:milestoneId` | Authenticated | Get detailed status of a specific milestone |

### 10. Workspaces, Real-Time Chat & Deliverables
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET`, `POST` | `/api/workspaces/task/:taskId` | Task poster, assigned freelancer, or admin | Get or automatically provision the task's workspace |
| `POST` | `/api/workspaces/:workspaceId/messages` | Workspace participants | Send a message or attach a workspace file (broadcasts via Socket.io) |
| `GET` | `/api/workspaces/:workspaceId/messages` | Contract Parties | Paginated chat transcript |
| `POST` | `/api/workspaces/:workspaceId/files` | Workspace participants | Upload a file via Multer to Cloudinary (local fallback when Cloudinary is not configured) |
| `GET` | `/api/workspaces/:workspaceId/files` | Contract Parties | List shared files and submitted assets |
| `GET` | `/api/workspaces/files/:fileId/download` | Workspace participants | Authenticated download of a workspace file |
| `DELETE` | `/api/workspaces/files/:fileId` | Workspace participant who uploaded the file, task poster, or admin | Remove a workspace file |
| `PATCH` | `/api/workspaces/:workspaceId/messages/read` | Contract Parties | Mark incoming workspace messages as read |

Workspace sockets authenticate with the same JWT, and `join-task` admits only the task poster or currently assigned freelancer. Joined participants receive `new-message` and `file-uploaded` broadcasts; `typing` updates are accepted only from sockets in that task's room.

### 11. Notifications
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Authenticated | List user notifications with pagination |
| `GET` | `/api/notifications/unread-count` | Authenticated | Get live unread notification count |
| `PATCH` | `/api/notifications/read-all` | Authenticated | Mark all notifications as read |
| `PATCH` | `/api/notifications/:id/read` | Authenticated | Mark single notification as read |
| `DELETE` | `/api/notifications/:id` | Authenticated | Remove notification |

Notifications are stored before they are emitted to the recipient's authenticated `user_<id>` Socket.io room. Live events cover new applicants, task assignments, milestone funding/submission/approval, workspace messages, and dispute updates; read and delete changes also synchronize across connected clients.

### 12. Disputes & Arbitration
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/disputes` | Contract Parties | File dispute & **freeze escrow milestone** |
| `POST` | `/api/disputes/:id/evidence` | Contract Parties | Upload evidence file or server log |
| `GET` | `/api/disputes/my` | Authenticated | List user disputes (or all disputes for admin) |
| `GET` | `/api/disputes/:id` | Contract Parties | Get dispute detail, timeline, and evidence history |
| `PATCH` | `/api/disputes/:id/resolve` | Admin Only | Arbitrate: release to freelancer, refund to client, or split |

### 13. Admin Governance & Moderation
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Admin Only | Platform statistics (users, tasks, cumulative escrow volume including refunds, disputes, completion rate) |
| `GET` | `/api/admin/users` | Admin Only | Search and filter platform users |
| `PATCH` | `/api/admin/users/:id/block` | Admin Only | Suspend or reactivate user account |
| `GET` | `/api/admin/tasks` | Admin Only | View all tasks for moderation |
| `PATCH` | `/api/admin/tasks/:id/moderate`| Admin Only | Edit task details or force status update |
| `DELETE` | `/api/admin/tasks/:id` | Admin Only | Delete an unlinked task; tasks with applications, milestones, workspace, disputes, or escrow/financial history must be cancelled instead |
| `GET` | `/api/admin/disputes` | Admin Only | View disputes pending review |

---

## 🚀 End-to-End Demonstration Flow

Follow these steps to demonstrate the full application lifecycle:

### Step 1: Sign In & Role Dashboard Routing
1. Navigate to `http://localhost:5173/login`.
2. Click **"Quick Client (Alex)"** to authenticate.
3. You are redirected to `/dashboard` which renders the **Client Workspace**:
   - Total posted tasks, active milestones, and funds in escrow.
   - Quick action shortcuts to post new tasks or browse freelancers.

### Step 2: Post a Task with Milestone Escrow
1. Click **"Post New Task"** (`/post-task`).
2. Fill in:
   - **Title**: *Build Interactive Financial Portfolio Dashboard*
   - **Category**: *Web Development*
   - **Required Skills**: *React, CSS, JavaScript*
   - **Budget**: *$350*
   - **Deadline**: Select a date 7 days in the future.
3. Submit the form. A success toast appears and you are redirected to the task page.
4. On the task page, configure two milestones:
   - Milestone 1: *UI Mockup & Component Kit* ($150)
   - Milestone 2: *Backend API Integration & Charts* ($200)
5. Click **"Fund Milestone 1"** ($150). The milestone transitions to `funded` and funds are held in escrow.

### Step 3: Freelancer Assessment & Verified Badge
1. Click your profile avatar -> **Sign Out**.
2. On `/login`, click **"Quick Freelancer (Elena)"**.
3. Notice your **Freelancer Console**:
   - Shows active contracts, proposal statuses, and earned **Verified Skill Badges**.
4. Go to **Skill Tests** (`/skill-tests`).
5. Choose **"React Frontend Development"** and click **"Take Assessment"**.
6. Complete the timed quiz (5 questions). Upon passing, the system awards a verified badge:
   - A success toast confirms: *"Congratulations! You earned the Verified: React Frontend Development badge!"*
   - The badge appears on your public profile (`/profile`).

### Step 4: Search, Application & Smart Matching
1. Go to **Browse Tasks** (`/tasks`) or **Search** (`/search`).
2. Search for `Financial Portfolio Dashboard`.
3. Click on the task to open its details. Notice your badge highlights your eligibility.
4. Click **"Apply to Task"**:
   - Bid Amount: `$350`
   - Estimated Delivery: `5 days`
   - Cover Letter: *"I have 7+ years of experience with React dashboards and can deliver pixel-perfect results."*
5. Submit proposal.

### Step 5: Poster Acceptance & Contract Workspace
1. Switch back to Client Alex Vance.
2. Go to **My Tasks** -> click the task -> **"Review Applicants"**.
3. Elena Rostova is ranked at the top due to skill matching and verified badges.
4. Click **"Accept Proposal"**.
5. Task status updates to `assigned`. The **Contract Workspace** is unlocked.
6. Click **"Open Task Workspace"** (`/tasks/:taskId/workspace`):
   - Send real-time chat messages via Socket.io.
   - Upload deliverables or design files using the file dropzone.

### Step 6: Work Submission, Escrow Release & Review
1. As the freelancer, go to the workspace or task page and click **"Submit Milestone Work"**:
   - Deliverable Note: *"Component kit completed and uploaded."*
2. Switch back to Client Alex Vance.
3. Click **"Approve & Release Payment"**.
4. $150 escrow funds are released to Elena.
5. Click **"Leave Review"** on the completed milestone:
   - Select 5 stars.
   - Leave a comment: *"Exceptional work, fast turnaround!"*
   - Elena's overall rating updates on her profile.

### Step 7: Dispute Arbitration (Admin Flow)
1. On a task with an issue, any party can click **"Raise Dispute"** on a funded milestone.
2. Escrow funds freeze immediately, preventing unilateral withdrawal.
3. Log in as **Admin** (`admin@taskforge.io`).
4. Navigate to `/admin` -> **Disputes** tab.
5. Review evidence files and arbitration arguments.
6. Select resolution: **Release to Freelancer**, **Refund to Client**, or **Split Escrow (e.g., 50/50)**.
7. Funds are distributed according to the admin verdict and both parties receive notifications.

---

## 📬 Postman Collection

The file [`TaskForge_Postman_Collection.json`](file:///c:/Users/YTC%20CHINTAPALLI/Desktop/Freelance%20micro-task/TaskForge_Postman_Collection.json) contains all **74 API requests**.

### How to Import:
1. Open **Postman**.
2. Click **Import** (top left).
3. Drag and drop `TaskForge_Postman_Collection.json`.
4. The collection uses the following collection variables:
   - `baseUrl`: `http://localhost:5000`
   - `token`: Automatically populated upon calling any Login or Register request!
   - `taskId`, `milestoneId`, `workspaceId`, `disputeId`, etc.

---

## 🎨 UI Design System & Component Highlights

- **Aesthetics**: Glassmorphism dark mode with vibrant indigo (`#6366f1`), pink (`#ec4899`), cyan (`#06b6d4`), and emerald (`#10b981`) accents.
- **Typography**: Google Fonts **Outfit** for headings and **Inter** for UI copy.
- **Toast Notifications**: Built into `ToastContext` supporting `toast.success()`, `toast.error()`, `toast.warning()`, and `toast.info()`.
- **States**:
  - `LoadingState`: Centered spinner with customizable status messages.
  - `EmptyState`: Contextual illustration icons, explanatory message, and call-to-action button.
  - `ErrorState`: Error card with "Try Again" retry callback.
- **Responsive Layout**: Fluid CSS grid & flexbox layouts with a collapsible hamburger navigation drawer for tablets and mobile devices.

---

## 🛡️ License

This project is licensed under the ISC License.
