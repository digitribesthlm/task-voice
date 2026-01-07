# Task Voice - Project Summary

## Project Overview

Task Voice is a modern task management and agency workflow dashboard built with Next.js. It provides a comprehensive view of daily tasks, weekly focus areas, monthly milestones, and automation status. The application features voice assistant integration, drag-and-drop task management, and real-time updates with MongoDB as the backend.

## Tech Stack

- **Framework**: Next.js 14.2.3 (React 18)
- **Database**: MongoDB 6.5.0
- **Styling**: Tailwind CSS 3.4.1
- **Language**: TypeScript 5.9.3
- **AI Integration**: Google Gemini API (@google/genai)
- **Authentication**: Cookie-based authentication
- **Deployment**: Server-side rendering (SSR) with getServerSideProps

## MongoDB Collections

The application uses 7 MongoDB collections (all prefixed with `app_`):

| Collection | Purpose |
|------------|---------|
| `app_clients` | Client information (id, name, color) |
| `app_phases` | Project phases (id, name, color) |
| `app_todayTasks` | Daily tasks with completion status |
| `app_weekTasks` | Weekly task assignments by day |
| `app_monthMilestones` | Monthly milestones with dates |
| `app_weeklyTarget` | Single weekly target with progress |
| `app_automations` | Automation systems with status (active/idle) |

## Key Files and Structure

### Core Pages
- **`/pages/index.jsx`** - Main dashboard with all components
- **`/pages/completed.jsx`** - Dedicated completed tasks view (NEW)
- **`/pages/login.jsx`** - Authentication page

### Key Components
- **`/components/Header.tsx`** - Navigation header with completed tasks link
- **`/components/TodayTasks.tsx`** - Active daily tasks with drag-drop
- **`/components/CompletedTasks.tsx`** - Completed tasks display (NEW)
- **`/components/WeeklyFocus.tsx`** - Week-at-a-glance task view
- **`/components/MonthGlance.tsx`** - Monthly milestones
- **`/components/AgencyTarget.tsx`** - Weekly target progress
- **`/components/SystemStatus.tsx`** - Active automations count
- **`/components/VoiceAssistant.tsx`** - Voice control interface

### Backend
- **`/pages/api/data.js`** - REST API for CRUD operations
  - GET: Fetch all data
  - POST: Create tasks/milestones
  - PUT: Update task completion status
  - DELETE: Remove tasks/milestones
- **`/pages/api/login.js`** - Authentication endpoint
- **`/pages/api/logout.js`** - Session termination
- **`/lib/mongodb.js`** - Database connection with caching
- **`/lib/auth.js`** - Authentication utilities

### Configuration
- **`/types.ts`** - TypeScript interfaces for all data models
- **`/.env.local`** - Environment variables (MongoDB, Gemini API key)

## Recent Changes: Completed Tasks Feature

### What Was Added

A complete "Completed Tasks" feature allowing users to view and manage all completed tasks separately from the main dashboard.

### Files Created/Modified

**Created:**
- `/pages/completed.jsx` - New page for completed tasks view
- `/components/CompletedTasks.tsx` - Completed tasks component

**Modified:**
- `/components/Header.tsx` - Added "Completed Tasks" navigation link
- `/pages/index.jsx` - Filters out completed tasks from main view

### How It Works

1. **Task Completion Flow**:
   - User completes task on main dashboard
   - Task marked as `completed: true` in MongoDB
   - Task filtered out from main dashboard view
   - Task appears on `/completed` page

2. **Completed Page Features**:
   - View all completed tasks with client/phase labels
   - **Restore** button - marks task incomplete, returns to main dashboard
   - **Delete** button - permanently removes task from database
   - Green highlight with strikethrough text styling
   - Real-time optimistic updates with error rollback

3. **Data Filtering**:
   - Main dashboard: Shows only `completed: false` tasks
   - Completed page: Shows only `completed: true` tasks
   - Server-side filtering via `getServerSideProps`

4. **API Integration**:
   - PUT `/api/data` - Toggle completion status
   - DELETE `/api/data` - Permanently delete tasks

### Visual Design

- Green background highlight (`bg-green-900/40`) for completed items
- Strikethrough text styling
- Trophy icon header
- Restore and trash can action buttons
- Consistent with existing dark theme (`bg-[#10172A]`)

## Development Commands

```bash
npm run dev    # Start development server (localhost:3000)
npm run build  # Build for production
npm start      # Run production server
npm run lint   # Run ESLint
```

## Environment Variables Required

```env
MONGODB_URL=mongodb+srv://...
DATABASE_NAME=your_database_name
GEMINI_API_KEY=your_gemini_api_key
```

## Authentication

- Cookie-based session management
- Redirects to `/login` if not authenticated
- `isRequestAuthenticated()` utility checks auth status
- Logout clears session and redirects

## Notes

- All MongoDB ObjectIDs serialized to strings for Next.js compatibility
- Uses optimistic UI updates with rollback on errors
- Cached database connections for performance
- Server-side rendering for initial data load
- Client-side state management with React hooks
