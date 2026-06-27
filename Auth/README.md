# Blood4U Frontend (Auth)

This is the React-based frontend for the Blood4U Blood Donation Management System. It provides a secure, interactive, and responsive user interface for donors, recipients, and administrators.

## 🛠️ Technical Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) with [Yup](https://github.com/jquense/yup) validation
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

## 📂 Project Structure

```text
src/
├── app/            # Redux store configuration
├── components/     # Reusable UI components (Layout, Dashboard elements)
├── features/       # Redux slices and async thunks (auth, theme, data)
├── lib/            # Shared utilities (API service, Axios config)
├── pages/          # Page components (Signin, Signup, Dashboard views)
├── routes/         # Route protection (ProtectedRoute, PublicRoute)
└── assets/         # Images and global styles
```

## 🔄 System Flow & User Journeys

The application follows a role-based architectural flow:

1.  **Onboarding**: Users sign up and verify via OTP. They can then choose to "Become a Donor" or "Register a Blood Bank."
2.  **The Request Loop**: A user creates a blood request (standard or emergency).
3.  **Real-time Matching**: The system captures the requester's geolocation and instantly notifies compatible donors within the proximity.
4.  **Instant Communication**: Donors or Bank Owners click "Chat" on a request to open a secure, WhatsApp-style direct thread.
5.  **Administrative Oversight**: Admins monitor all requests, approve/reject blood bank applications, and manage high-level analytics.

## 🚀 Key Modules

### 1. Authentication & Identity
- **Dynamic Login**: Intelligent detection of username, email, or phone.
- **OTP Security**: Email-based verification for registration and account recovery.
- **Role Evolution**: Users seamlessly transition to `donor` or `bankOwner` roles upon verification.

### 2. Proximity & Geolocation
- **GPS Capture**: Automated coordinate logging during registration.
- **Live Distance Engine**: Real-time Haversine distance calculation in the search dashboard.
- **"Near Me" Discovery**: One-click sorting to find the physically closest life-savers.

### 3. Smart Communication (WhatsApp Style)
- **Threaded Messaging**: Direct 1-to-1 secure chat for coordinating donations.
- **Conversation List**: Clean, history-based contact list that updates in real-time.
- **Verification Barriers**: Messaging is restricted to approved medical organizations for safety.

### 4. Advanced Analytics Dashboard
- **Live Counters**: Real-time updating stats using Socket.io synchronization.
- **City-Based Inventory**: Visual board showing aggregated blood stock levels across the network.
- **Donor Leaderboards**: Automatic badge tiering (Gold/Silver/Bronze) based on donation history.

### 5. State Management
- **Auth Slice**: Manages sessions, persistent roles, and security tokens.
- **Data Slice**: Centralized store for live requests, approved banks, and upcoming drives.
- **Real-time Middleware**: Listens for socket events to trigger background store refreshes.

### 6. Gemini AI Blood Advisor Chatbot
- **Interactive Conversational AI**: Embedded directly in the dashboard's "Smart Match" portal.
- **Dynamic Platform Context**: Pre-seeded with real-time donor lists, transfusion compatibility protocols, and user-location metadata.
- **Safety & Cooldown Insights**: Instantly advises users on medical donation guidelines, platform processes, and local donor availabilities.

## 💻 Development

### Setup Environment
Create a `.env` file in the root of the `Auth/` directory:
```env
VITE_API_URL=http://localhost:3000/api/v1
```


### Installation
```bash
npm install
```

### Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint checks
- `npm run preview`: Preview production build locally

## 🎨 Coding Standards
- Use **Functional Components** with Hooks.
- Follow **BEM** or Tailwind utility-first patterns for styling.
- Keep business logic in **Redux Thunks** (`src/features`) rather than inside components.
- Use **Lucide icons** for consistent iconography.

---
Part of the [Blood4U Project](../README.md).

## 🧑‍💻 Developer Guide

- **Prerequisites:** Node.js v18+, npm, Vite-compatible browser. Ensure the backend is running at `http://localhost:3000` (or set `VITE_API_URL` accordingly).

- **Environment:** Create `Auth/.env` with:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

- **Install & Run:**

```bash
cd Auth
npm ci
npm run dev      # Vite dev server (default: 5173)
```

- **Build & Preview:**

```bash
npm run build
npm run preview
```

- **Lint & Formatting:** Run `npm run lint` and follow the project's ESLint rules. Fix issues before PRs.

- **Testing:** If unit or integration tests exist, run them with `npm test` from `Auth/`.

- **Proxy & API versioning:** The app expects the Backend API under `/api/v1`. Adjust `VITE_API_URL` for alternate base paths or when running behind Nginx in Docker.

- **Docker:** The `Dockerfile` in `Auth/` builds a production-ready image served by Nginx. Use `docker-compose` from the project root to run the full stack.

- **Developer workflow:**
	- Feature branch naming: `feature/<short-desc>`; include issue refs in PRs.
	- Keep UI state small in components; put business logic in `src/features` slices.

- **Debugging tips:**
	- Inspect network calls in browser DevTools and verify `VITE_API_URL`.
