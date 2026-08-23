# TaskPulse

TaskPulse is a full-stack task management app with support for personal tasks and shared team workspaces — subtasks, file attachments, member invites, and password reset, all built on the MERN stack.

🔗 **Live App:** [note-down-1-8smd.onrender.com](https://note-down-1-8smd.onrender.com/)

> Note: hosted on Render's free tier — the backend may take up to a minute to spin up on first load if it's been idle.

## Features

- **Authentication** — signup/login with JWT, OTP-based password reset via email
- **Personal & Workspace tasks** — switch between your personal task list and shared team workspaces
- **Workspaces** — create workspaces, invite members by email, manage roles (admin/member), remove members, delete workspaces
- **Email invitations** — secure token-based invite links sent via transactional email
- **Tasks** — title, description, category, priority, due date, completion status
- **Subtasks** — add, toggle, and delete subtasks within a task, with optimistic UI updates
- **Attachments** — upload and delete image attachments per task
- **Filtering & search** — filter by status, category, "assigned to me", and search by keyword
- **Comments** — per-task discussion thread

## Tech Stack

**Frontend**
- React + Vite
- Redux Toolkit for state management
- Tailwind CSS
- React Hot Toast for notifications
- Axios

**Backend**
- Node.js + Express
- MongoDB with Mongoose
- JWT authentication
- Brevo (transactional email API) for OTPs and invites

**Deployment**
- Render (both frontend and backend)

## Project Structure

```
taskpulse/
├── client/                 # React frontend
│   ├── src/
│   │   ├── features/       # Redux slices (tasks, workspaces, auth, categories)
│   │   ├── components/     # UI components
│   │   ├── api/            # Axios instance & config
│   │   └── ...
│   └── ...
├── server/                 # Express backend
│   ├── controllers/
│   ├── models/             # Mongoose schemas (Task, Workspace, User, Invitation)
│   ├── routes/
│   ├── utils/               # Email sending, helpers
│   └── ...
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- A [Brevo](https://www.brevo.com/) account with a verified sender for transactional email

### 1. Clone the repo
```bash
git clone https://github.com/sachindataninja123/Note_down.git
cd Note_down
```

### 2. Backend setup
```bash
cd server
npm install
```

Create a `.env` file in `server/`:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RESET_TOKEN_SECRET=your_reset_token_secret
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM=TaskPulse <your-verified-sender@example.com>
CLIENT_URL=http://localhost:5173
OTP_EXPIRY_MINUTES=10
```

```bash
npm run dev
```

### 3. Frontend setup
```bash
cd client
npm install
```

Create a `.env` file in `client/`:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

```bash
npm run dev
```

The app should now be running at `http://localhost:5173`, connected to the API at `http://localhost:5000`.

## Deployment Notes

- If deploying the frontend as a **static site** (e.g. on Render), add a rewrite rule (`/*` → `/index.html`) so client-side routes like `/invite/:token` don't 404 on direct load.
- Brevo may block API calls from unrecognized IPs by default — either authorize your deployment's outbound IP or disable IP authorization for API keys in Brevo's Security settings, since Render's IP may change across deploys.

## Roadmap

- [ ] Real-time updates via WebSockets
- [ ] Task activity log
- [ ] Custom domain email sending (SPF/DKIM) for improved deliverability
- [ ] Mobile-responsive polish

## License

MIT
