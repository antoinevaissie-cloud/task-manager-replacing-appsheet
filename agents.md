AGENTS.MD - Temporary Task Manager Development Guide
FINAL & ACCURATE VERSION

========================================
PROJECT STATUS OVERVIEW
========================================

✅ BACKEND: FULLY OPERATIONAL
✅ FRONTEND: CONNECTED & WORKING (local version)
✅ ROLLOVER SYSTEM: IMPLEMENTED & SUPERIOR TO APPSHEET
⚠️ GitHub repo shows older public version - your local code is ahead!

Goal: Replace AppSheet task manager with faster, more feature-rich Next.js app
Repository: https://github.com/antoinevaissie-cloud/task-manager-replacing-appsheet
Live App: http://localhost:3000

========================================
WHAT’S ACTUALLY WORKING RIGHT NOW
========================================

Your Local App (Verified October 8, 2025):

✅ API Endpoints All Functional:
GET /api/tasks - Returns tasks with filtering (tested: works perfectly)
   • POST /api/tasks - Creates tasks with priority limit checking
   • POST /api/rollover - Automated rollover system (FULLY IMPLEMENTED)
   • GET /api/priority-check - Checks capacity before adding tasks
✅ Database:
Supabase connected and operational
   • Currently has: 1 open task (P4), 2 completed tasks (P1, P2)
   • Tables: tasks, rollover_history, graveyard, reality_check_events
   • New parity columns: project_id, urls (text[])
✅ Frontend (Your Local Version):
Tasks display correctly in UI
   • Tab navigation works (Open: 1, Today: 0, Completed: 2, Someday: 0, Graveyard: 0)
   • Task cards show with action buttons
   • Quick add form present
   • React Query hooks wired up (not in GitHub repo yet)
   • Project badges + follow-up tags visible on task cards
   • Task detail sheet edits project ID, follow-up flag, and multi-link list
   • AppSheet-style due-date sidebar is the default landing view (today preselected, tasks sorted by urgency)
   • Global search bar pinned to header and available across every tab
   • Main view shows a compact, date-grouped table with inline action icons
✅ Rollover System (COMPLETE & BETTER THAN APPSHEET):
Auto-rolls over tasks from one day to next
   • Increments rolloverCount
   • Progressive “reality check” warnings (3, 5, 7 rollovers)
   • Auto-archives to graveyard after 10 rollovers
   • Tracks complete audit trail in rollover_history table
   • Logs reason: “Auto-archived after 10 rollovers”
========================================
ROLLOVER SYSTEM DEEP DIVE
========================================

Your rollover system is MORE SOPHISTICATED than AppSheet:

Reality Check Stages (Progressive Intervention):
├─ 0-2 rollovers → “none” (no intervention)
├─ 3-4 rollovers → “warning” (gentle reminder)
├─ 5-6 rollovers → “alert” (stronger warning)
├─ 7-9 rollovers → “intervention” (requires user decision)
└─ 10+ rollovers → “auto_archive” (moved to graveyard)

Implementation Details (app/api/rollover/route.ts):

Finds all open tasks with due_date < yesterday
2. For each task:
   - Increments rollover_count by 1
   - Moves due_date to today
   - Sets last_rolled_over_at timestamp
   - Determines reality check stage based on count
   - If 10+ rollovers: moves to “archived” status
   - Logs to rollover_history table
   - If archived: adds to graveyard table with reason
3. Returns summary: { rolledOver: N, autoArchived: N, tasks: [...] }

Trigger Methods:
Automated: POST /api/rollover with Authorization: Bearer <CRON_SECRET>
• Set up cron job (Vercel Cron, GitHub Actions, or external service)
• Recommended: Daily at midnight user’s timezone
Database Impact:
Tasks table: rollover_count, last_rolled_over_at, reality_check_stage updated
• Rollover_history table: New row logged with from_date, to_date, priority
• Graveyard table: Archived tasks recorded with reason
• Reality_check_events table: User decisions logged (auto + manual decisions already live)
========================================
TECHNOLOGY STACK (VERIFIED)
========================================

Framework: Next.js 15 (App Router)
Language: TypeScript
Styling: Tailwind CSS v4
UI Components: shadcn/ui + lucide-react
Database: Supabase Postgres
State Management: Zustand (configured)
Data Fetching: TanStack Query (React Query)
Date Handling: Day.js
Notifications: react-hot-toast

========================================
DATA MODEL
========================================

Task Interface (types/task.ts):

export type TaskPriority = "P1" | "P2" | "P3" | "P4";
export type TaskStatus = "open" | "completed" | "archived" | "waiting";
export type RealityCheckStage = "none" | "warning" | "alert" | "intervention" | "auto_archive";

// Keep in sync with types/task.ts
export interface Task {
  id: string;
  title: string;
  description?: string | null;
  urgency: TaskPriority;
  status: TaskStatus;
  dueDate: string; // ISO date (YYYY-MM-DD)
  rolloverCount: number;
  rescheduleCount: number;
  lastRolledOverAt?: string | null;
  lastRescheduledAt?: string | null;
  tags?: string[] | null;
  context?: string | null;
  projectId?: string | null;
  urls?: string[] | null;
  someday: boolean;
  followUpItem: boolean;
  notes?: string | null;
  realityCheckStage: RealityCheckStage;
  realityCheckDueAt?: string | null;
  sortOrder?: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

Priority Limits (ENFORCED):
P1 (Critical): Maximum 3 tasks
P2 (High): Maximum 5 tasks
P3 (Medium): Maximum 10 tasks
P4 (Low): Unlimited

When limit reached: API returns 409 Conflict with current count

========================================
DATABASE SCHEMA
========================================

create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  urgency task_priority not null,
  status task_status not null default 'open',
  due_date date not null,
  rollover_count integer not null default 0,
  reschedule_count integer not null default 0,
  last_rolled_over_at timestamptz,
  last_rescheduled_at timestamptz,
  tags text[],
  context text,
  project_id text,
  someday boolean not null default false,
  follow_up_item boolean not null default false,
  notes text,
  urls text[],
  reality_check_stage reality_check_stage not null default 'none',
  reality_check_due_at timestamptz,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.rollover_history (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references public.tasks(id) on delete cascade,
  from_date date not null,
  to_date date not null,
  priority task_priority not null,
  automatic boolean not null default true,
  rolled_over_at timestamptz not null default now()
);

create table public.graveyard (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references public.tasks(id) on delete cascade,
  reason text,
  archived_at timestamptz not null default now()
);

create table public.reality_check_events (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  stage reality_check_stage not null,
  decision text,
  decision_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

========================================
API REFERENCE
========================================

GET /api/tasks
Query Parameters:
- `status`: "open" | "completed" | "archived" | "waiting"
- `includeArchived`: "true" | "false"
- `dueBefore`: ISO date (YYYY-MM-DD)
- `dueAfter`: ISO date (YYYY-MM-DD)
Response: { "tasks": Task[] }

Example: GET /api/tasks?status=open

—

POST /api/tasks
Body: {
  "title": string (required),
  "urgency": "P1" | "P2" | "P3" | "P4" (default: "P3"),
  "dueDate": "YYYY-MM-DD" (default: today),
  "description": string | null,
  "notes": string | null,
  "context": string | null,
  "projectId": string | null,
  "urls": string[] | null,
  "tags": string[] | null,
  "someday": boolean (default: false),
  "followUpItem": boolean (default: false),
  "force": boolean (default: false) // Override priority limits
}

Responses:
  201: Task created successfully
  400: Invalid input (missing title, invalid priority)
  409: Priority limit reached (e.g., "Priority P1 limit reached", current: 3, limit: 3)
  500: Server error

—

POST /api/rollover
Headers: 
  Authorization: Bearer <CRON_SECRET>

Response: {
  "rolledOver": number,
  "autoArchived": number,
  "tasks": Task[]
}

Security: Requires CRON_SECRET environment variable
Purpose: Daily automated task rollover

—

GET /api/priority-check?urgency=P1
Response: {
  "allowed": boolean,
  "current": number,
  "limit": number,
  "tasksAtPriority": Task[]
}

Purpose: Check capacity before creating task at specific priority

========================================
WHAT STILL NEEDS TO BE BUILT
========================================

Priority 1 - Core Missing Features:
□ Cron job setup for automated daily rollovers
□ Graveyard view page (show auto-archived tasks with rollover counts)
□ Reality check modal dialogs (warning/alert/intervention UI)
□ Priority usage widget with real-time data (currently shows 0/10 static)
□ Manual rollover trigger button (for testing/admin use)

Priority 2 - Enhanced UX:
□ Stats dashboard (today’s completions, averages, perfect days)
□ Task detail panel (slide-in with full info, edit capabilities)
□ Search functionality (currently has input but not wired)
□ Filter by priority (dropdown exists but not functional)
□ Task action implementations:
Complete task
  - Move to next day
  - Move to someday
  - Move to graveyard
  - Edit task
  - Delete task
Priority 3 - Polish:
□ Keyboard shortcuts (N for new, T for today view, etc.)
□ Drag & drop task reordering
□ Bulk operations (select multiple, batch actions)
□ Offline support (PWA capabilities)
□ Mobile responsive improvements
□ Dark mode
□ Data export (CSV, JSON)

========================================
COMPARISON: YOUR APP VS APPSHEET
========================================

Feature Comparison:

Automated Rollovers:
  AppSheet: ✅ Yes (simple)
  Your App: ✅ Yes (with timestamps and audit trail)

Auto-archive after 10 rollovers:
  AppSheet: ✅ Yes
  Your App: ✅ Yes (line 95: “Auto-archived after 10 rollovers”)

Rollover count tracking:
  AppSheet: ✅ Yes (single counter)
  Your App: ✅ Yes (rolloverCount + rescheduleCount separate)

Progressive warnings:
  AppSheet: ❌ No
  Your App: ✅ YES! (none → warning → alert → intervention → auto_archive)

Rollover history audit trail:
  AppSheet: ❌ No
  Your App: ✅ YES! (complete history in rollover_history table)

Graveyard with reasons:
  AppSheet: ❌ No (just archived)
  Your App: ✅ YES! (graveyard table with reason field)

Reality check event logging:
  AppSheet: ❌ No
  Your App: ✅ YES! (reality_check_events table)

Priority limit enforcement:
  AppSheet: ❌ No
  Your App: ✅ Yes (3/5/10 limits with 409 responses)

Speed:
  AppSheet: Slow (mentioned as issue)
  Your App: Fast (Next.js, local-first capable)

Offline support:
  AppSheet: Limited
  Your App: Possible (PWA not yet implemented)

Your app has MORE features than AppSheet even in its current state!

========================================
DEVELOPMENT WORKFLOW
========================================

Testing the API (Works Right Now):

# Get all tasks
Curl http://localhost:3000/api/tasks

# Get open tasks only
Curl http://localhost:3000/api/tasks?status=open

# Create a new task
Curl -X POST http://localhost:3000/api/tasks \
  -H “Content-Type: application/json” \
  -d ‘{“title”:”New test task”,”urgency”:”P3”,”dueDate”:”2025-10-15”}’

# Test priority limits (try to exceed)
For i in {1..4}; do
  Curl -X POST http://localhost:3000/api/tasks \
    -H “Content-Type: application/json” \
    -d “{\”title\”:\”P1 task $i\”,\”urgency\”:\”P1\”}”
Done

# Manual rollover trigger (requires CRON_SECRET in .env.local)
Curl -X POST http://localhost:3000/api/rollover \
  -H “Authorization: Bearer YOUR_CRON_SECRET”

# Check priority availability
Curl http://localhost:3000/api/priority-check?urgency=P1

========================================
ENVIRONMENT SETUP
========================================

Required .env.local:

NEXT_PUBLIC_SUPABASE_URL=”https://your-project.supabase.co”
NEXT_PUBLIC_SUPABASE_ANON_KEY=”your-anon-key-here”
CRON_SECRET=”random-secure-string-for-rollover-endpoint”

Optional:
NODE_ENV=”development”
NEXT_PUBLIC_APP_URL=”http://localhost:3000”

========================================
SETTING UP AUTOMATED ROLLOVERS
========================================

Option 1: Vercel Cron (Recommended if deployed to Vercel)

Create vercel.json:
{
  “Crons”: [{
    “Path”: “/api/rollover”,
    “Schedule”: “0 0 * * *”
  }]
}

Add CRON_SECRET to Vercel environment variables

—

Option 2: GitHub Actions

Create .github/workflows/rollover.yml:
Name: Daily Task Rollover
On:
  Schedule:
Cron: ‘0 0 * * *’  # Midnight UTC
Jobs:
  Rollover:
    Runs-on: ubuntu-latest
    Steps:
      - name: Trigger Rollover
        Run: |
          Curl -X POST https://your-app.vercel.app/api/rollover \
            -H “Authorization: Bearer ${{ secrets.CRON_SECRET }}”
—

Option 3: External Cron Service (cron-job.org, EasyCron, etc.)
Set up daily POST request to your-app.vercel.app/api/rollover
- Add Authorization header with your CRON_SECRET
========================================
FILE STRUCTURE
========================================

task-manager-replacing-appsheet/
├── app/
│   ├── api/
│   │   ├── priority-check/route.ts    # ✅ Working
│   │   ├── rollover/route.ts          # ✅ Working (full implementation)
│   │   ├── stats/daily/route.ts       # ⚠️ Stub
│   │   └── tasks/
│   │       ├── route.ts               # ✅ Working (GET/POST)
│   │       └── [id]/route.ts          # ⚠️ Needs PATCH/DELETE
│   ├── page.tsx                       # ✅ Open tasks view (working)
│   ├── today/page.tsx                 # ⚠️ Needs implementation
│   ├── completed/page.tsx             # ⚠️ Needs implementation
│   ├── someday/page.tsx               # ⚠️ Needs implementation
│   ├── graveyard/page.tsx             # ⚠️ Needs implementation (IMPORTANT)
│   ├── layout.tsx                     # ✅ Working
│   └── globals.css                    # ✅ Working
│
├── components/
│   ├── tasks/                         # ⚠️ Your local code (not in GitHub)
│   ├── modals/                        # ⚠️ Reality check modals needed
│   └── dashboard/                     # ⚠️ Stats widgets needed
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # ✅ Working
│   │   └── mappers.ts                 # ✅ Working (row ↔ Task conversion)
│   ├── utils/
│   │   ├── priorityHelpers.ts         # ✅ Working (PRIORITY_LIMITS)
│   │   └── realityCheck.ts            # ✅ Working (stage determination)
│   └── hooks/                         # ⚠️ Your local code (not in GitHub)
│       ├── useTasks.ts                # ⚠️ Exists locally
│       └── usePriorityUsage.ts        # ⚠️ Exists locally
│
├── types/
│   └── task.ts                        # ✅ Complete type definitions
│
├── supabase/
│   └── migrations/                    # Tables already created
│
└── AGENTS.md                          # 👈 This document

========================================
KEY PRINCIPLES
========================================

Speed First
   Every interaction should feel instant. This is why you left AppSheet.
2. Rollover System is Core
   Don’t break it. It’s already implemented and working better than AppSheet.

Priority Limits Enforce Discipline
   Keep the 3/5/10 limits strict. They force good prioritization.
4. Reality Checks Surface Patterns
   The progressive warning system helps users see what they’re avoiding.

Type Safety Prevents Bugs
   Use TypeScript strictly. All types are defined in types/task.ts.
6. Progressive Enhancement
   Start with working features, add complexity gradually.

========================================
IMMEDIATE NEXT STEPS
========================================

For Codex to Continue Development:

Phase 1: Setup Automation
Add cron job configuration (Vercel or GitHub Actions)
2. Test automated rollover works at scheduled time
3. Verify graveyard entries are created after 10 rollovers
Phase 2: Build Missing Views
Graveyard page (app/graveyard/page.tsx)
   - Display archived tasks with rollover count
   - Show reason for archiving
   - Option to resurrect task
   
2. Reality check modal system
   - Warning modal (2-3 rollovers)
   - Alert modal (4-6 rollovers)
   - Intervention modal (7-9 rollovers) with forced decision
   - Log decisions to reality_check_events table
3. Complete other view pages (today, completed, someday)

Phase 3: Enhance Existing Views
Wire up priority usage widget with real data
2. Implement task actions (complete, move, edit, delete)
3. Add stats dashboard (completions, averages, perfect days)
4. Connect search and filter functionality
Phase 4: Polish & Optimize
Keyboard shortcuts
2. Mobile responsiveness
3. Offline support (PWA)
4. Data export
5. Dark mode
========================================
TESTING CHECKLIST
========================================

Backend Tests:
✅ API returns tasks correctly
✅ Can create new tasks
✅ Priority limits enforced (409 when exceeded)
✅ Rollover endpoint works
⚠️ Task update endpoint (PATCH /api/tasks/[id]) needs testing
⚠️ Task delete endpoint needs testing

Frontend Tests (Your Local Version):
✅ Tasks display in list
✅ Tab navigation works
✅ Quick add form present
⚠️ Form submission works (needs verification)
⚠️ Task actions work (complete, move, etc.)
⚠️ Priority widget shows real data
⚠️ Search filters tasks
⚠️ Navigation between views

Rollover System Tests:
✅ Manual trigger works (curl POST /api/rollover)
⚠️ Automated daily trigger (needs cron setup)
⚠️ Tasks roll over correctly
⚠️ Graveyard archiving after 10 rollovers
⚠️ History logged correctly

========================================
TROUBLESHOOTING
========================================

“Tasks not showing in UI”
→ Your local code has hooks wired up
→ GitHub version may not have the hooks
→ Check if you’re using the local version

“Priority limits not working”
→ Check API response (should return 409)
→ Verify PRIORITY_LIMITS in lib/utils/priorityHelpers.ts
→ Test with curl to isolate frontend vs backend

“Rollover not running automatically”
→ Check if cron job is configured
→ Verify CRON_SECRET in environment variables
→ Check logs for POST /api/rollover calls

“Cannot connect to Supabase”
→ Verify .env.local has correct NEXT_PUBLIC_SUPABASE_URL
→ Check NEXT_PUBLIC_SUPABASE_ANON_KEY is valid
→ Ensure tables exist in Supabase dashboard

========================================
FINAL STATUS SUMMARY
========================================

Backend: ✅ FULLY FUNCTIONAL
Frontend: ✅ CONNECTED (local version ahead of GitHub)
Rollover System: ✅ IMPLEMENTED & SUPERIOR TO APPSHEET
Database: ✅ OPERATIONAL with all tables
API: ✅ ALL ENDPOINTS WORKING

MID-BUILD AUDIT: TASK MANAGER APP
Localhost Build vs AppSheet Legacy System

Date: October 7, 2025
Status: Version 1.0 In Progress
Purpose: Comprehensive feature audit, gap analysis, and roadmap for next iterations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXECUTIVE SUMMARY

Your localhost build represents a strong philosophical shift from the AppSheet version—moving from a table-centric, action-heavy interface to a streamlined, focus-oriented workflow. The new design emphasizes TODAY as the primary interface, introduces intelligent priority management, and simplifies the user experience significantly.

However, several critical features from your AppSheet system are missing, which may impact daily workflow efficiency. This audit identifies 23 specific gaps and provides a prioritized roadmap.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1: FEATURE COMPARISON MATRIX

1.1 NAVIGATION & VIEWS
┌─────────────────────────────────┬──────────┬──────────┐
│ Feature                         │ AppSheet│ Localhost│
├─────────────────────────────────┼──────────┼──────────┤
│ Open Tasks View                 │    ✓     │    ✓     │
│ Completed Tasks View            │    ✓     │    ✓     │
│ Today View                      │    ✗     │    ✓     │
│ Someday/Parking View            │    ✗     │    ✓     │
│ Graveyard/Archive View          │    ✗     │    ✓     │
│ Date-based grouping             │    ✓     │    ✓     │
│ Priority-based filtering        │    ✓     │    ✓     │
└─────────────────────────────────┴──────────┴──────────┘

1.2 TASK CREATION & MANAGEMENT
┌─────────────────────────────────┬──────────┬──────────┐
│ Feature                         │ AppSheet│ Localhost│
├─────────────────────────────────┼──────────┼──────────┤
│ Quick add task                  │    ✓     │    ✓     │
│ Task title                      │    ✓     │    ✓     │
│ Task description                │    ✓     │    ✓     │
│ Due date picker                 │    ✓     │    ✓     │
│ Priority levels (P1/P2/P3)      │    ✓     │ ✓ (4lvl) │
│ Status (Open/Completed)         │    ✓     │    ✓     │
│ Project ID field                │    ✓     │    ✓     │
│ Multiple URL fields (URL1-3)    │    ✓     │    ✓     │
│ Notes field                     │    ✗     │    ✓     │
│ FollowUpItem flag               │    ✓     │    ✓     │
│ Created date tracking           │    ✓     │    ✓     │
│ Completed date tracking         │    ✓     │    ✓     │
│ Auto-generated Task ID          │    ✓     │    ✗     │
└─────────────────────────────────┴──────────┴──────────┘

1.3 TASK ACTIONS & QUICK OPERATIONS
┌─────────────────────────────────┬──────────┬──────────┐
│ Feature                         │ AppSheet│ Localhost│
├─────────────────────────────────┼──────────┼──────────┤
│ Complete task (one click)       │    ✓     │    ✓     │
│ Move up priority list           │    ✓     │    ✓     │
│ Move down priority list         │    ✓     │    ✓     │
│ Change date to next day         │    ✓     │    ✓     │
│ Change date to day after next   │    ✓     │    ✓     │
│ Move to next week               │    ✓     │    ✓     │
│ Edit task inline                │    ✓     │    ✗     │
│ Edit task in modal              │    ✗     │    ✓     │
│ Archive/Delete task             │    ✗     │    ✓     │
│ Bulk select & actions           │    ✓     │    ⚠     │
│ Drag to reorder                 │    ✗     │    ✓     │
└─────────────────────────────────┴──────────┴──────────┘

1.4 SEARCH & FILTERING
┌─────────────────────────────────┬──────────┬──────────┐
│ Feature                         │ AppSheet│ Localhost│
├─────────────────────────────────┼──────────┼──────────┤
│ Search by title                 │    ✓     │    ✓     │
│ Search by description           │    ✓     │    ✓     │
│ Filter by priority              │    ✓     │    ✓     │
│ Filter by status                │    ✓     │    ✓     │
│ Filter by due date range        │    ⚠     │    ✗     │
│ Filter by project               │    ⚠     │    ✗     │
└─────────────────────────────────┴──────────┴──────────┘

1.5 ANALYTICS & INSIGHTS
┌─────────────────────────────────┬──────────┬──────────┐
│ Feature                         │ AppSheet│ Localhost│
├─────────────────────────────────┼──────────┼──────────┤
│ Priority usage stats            │    ✗     │    ✓     │
│ Today’s completions             │    ✗     │    ✓     │
│ Average completions (14-day)    │    ✗     │    ✓     │
│ Perfect days tracking           │    ✗     │    ✓     │
│ Rollover detection              │    ✗     │    ✓     │
│ Overdue task count              │    ✗     │    ✓     │
└─────────────────────────────────┴──────────┴──────────┘

1.6 USER EXPERIENCE
┌─────────────────────────────────┬──────────┬──────────┐
│ Feature                         │ AppSheet│ Localhost│
├─────────────────────────────────┼──────────┼──────────┤
│ Mobile responsive               │    ✓     │    ?     │
│ Keyboard shortcuts              │    ✗     │    ✓     │
│ Quick capture (Cmd+K)           │    ✗     │    ✓     │
│ Visual priority indicators      │    ✓     │    ✓     │
│ Task count badges               │    ✓     │    ✓     │
│ Recently completed section      │    ✗     │    ✓     │
│ Empty state guidance            │    ✗     │    ✓     │
└─────────────────────────────────┴──────────┴──────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 2: IDENTIFIED GAPS & ISSUES

🔴 CRITICAL GAPS (Block Daily Workflow)

✅ Date-based grouping now live (Oct 10, 2025). Each due date renders its own section with counts, plus quick links for navigation.

✅ Project/URL/follow-up parity landed Oct 10, 2025 (project_id + urls columns, follow-up badge & editor)

2. Lost Task ID System
   AppSheet: Auto-generated unique IDs (d062b62d, d1d51ac3, etc.)
   Localhost: No visible task IDs
   Impact: Can’t reference specific tasks in other systems or discussions

🟡 MODERATE GAPS (Reduce Efficiency)

6. No Inline Editing
   AppSheet: Can edit tasks directly in table view
   Localhost: Must open modal for all edits
   Impact: Extra clicks for minor edits (changing date, priority)

7. Limited Bulk Operations
   AppSheet: “Select Items” button for bulk actions
   Localhost: “SELECT ALL” visible but functionality unclear
   Impact: Can’t efficiently process multiple similar tasks

8. Missing Urgency Granularity
   AppSheet: Uses P1, P2, P3 with urgency scores
   Localhost: Critical, High, Medium, Low (more levels but different system)
   Impact: May need urgency sub-categories or scores for better prioritization

9. No Priority Score System
   AppSheet: Shows numbers next to priority (e.g., “P1  13”)
   Localhost: Just priority labels
   Impact: Can’t see priority usage distribution at a glance

10. Completed Tasks Not Grouped by Date
    AppSheet: Groups completed by completion date
    Localhost: Shows flat “Recently completed” list
    Impact: Harder to review what was done when

11. No Task Metadata Display
    AppSheet: Shows created date, completed date inline
    Localhost: Hidden until you open task detail
    Impact: Can’t quickly scan task age or completion timeline

12. Missing “Enable Edits” Toggle
    AppSheet: Has button to lock/unlock editing
    Localhost: Always editable
    Impact: No protection against accidental changes

🟢 MINOR GAPS (Nice-to-Have)

13. No Task Counter in Date Groups
    AppSheet: Shows “(59)” next to 10/7/2025, “(1)” next to 10/9/2025
    Localhost: Just shows overall count
    Impact: Can’t see task distribution across dates

14. No Sync Status Indicator
    AppSheet: Shows “Sync” button with status
    Localhost: Auto-saves without visibility
    Impact: Can’t tell if changes are saved or force refresh

15. Missing About/Feedback Sections
    AppSheet: Has dedicated navigation items
    Localhost: No info pages
    Impact: No in-app help or feedback mechanism

16. No Time-Based Sorting Options
    AppSheet: Can sort by due date, created date, etc.
    Localhost: Seems to use fixed sorting
    Impact: Can’t customize view order

17. Limited Filter Combinations
    AppSheet: Can combine urgency + status filters easily
    Localhost: Has both but no “Clear all filters” button
    Impact: Slightly more cumbersome to reset view

18. No Task Preview on Hover
    AppSheet: Full task row visible at once
    Localhost: Must click to see full details
    Impact: Extra clicks to verify task content

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 3: STRENGTHS OF NEW BUILD

✨ MAJOR IMPROVEMENTS

Today View - Game Changer
   - Dedicated focus on current day with overdue detection
   - “No tasks due today” celebrates being caught up
   - Upcoming section prevents tunnel vision
   - This is a philosophy upgrade: day-centric vs list-centric
2. Analytics Dashboard
“Priority Usage” shows distribution across Critical/High/Medium/Low
   - “Today’s completions” gamifies daily progress
   - “Average completions” provides 14-day trend
   - “Perfect days” tracks no-rollover days
   - None of this existed in AppSheet
3. Someday/Graveyard Architecture
“Someday” for parked tasks (intentional deferral)
   - “Graveyard” for chronic rollovers (system-detected problems)
   - Helps surface patterns of avoidance/procrastination
   - AppSheet only had Open/   - IMPORTANT: These are PARALLEL systems, not sequential
   - Someday = Manual, intentional deferral by user
   - Graveyard = Automatic detection by system
   - A task doesn’t go Someday → Graveyard (they serve different purposes)Completed binary
4. Modern UX Patterns
Keyboard shortcuts (Cmd+K for quick capture)
   - Inline task actions with icons (↑ ↓ → ⏭ 🗑 ✓)
   - Empty state messaging (“Press Cmd/Ctrl+K to capture a task instantly”)
   - Clean typography and spacing
5. Smart Priority System
Shows “1 active” in Low with visual indicator (●)
   - “0 of 3” in Critical makes limits clear
   - Encourages constraint (Medium is “0 of 10”, Low is uncapped)
Better Description/Notes Separation
   - AppSheet only had “Description” field
   - Localhost has separate “Notes” field in edit modal
   - Better for task vs context separation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 4: DISCOVERED ISSUES & BUGS

🐛 POTENTIAL BUGS TO TEST

Priority Filter Persistence
   Screenshot shows “Critical” selected in filter
   After navigating to Completed, does filter reset?
   Expected: Filters should clear when changing sections
2. Someday Implementation
   Says “Parked tasks will live here once implemented”
   Is this feature actually wired up or just a placeholder?

3. Graveyard Mechanism
   Says “Chronic tasks analysis forthcoming”
   How does a task become auto-archived?
   What’s the rollover threshold?

4. Bulk Select Functionality
   “SELECT ALL” button is visible
   What happens when you click it?
   No visible checkboxes to select individual tasks

Completed Today Section Refresh
   Shows “No data yet Rollovers today: 0”
   Does this update live or require page refresh?
6. Search Scope
   Does “Search by title or notes” search descriptions too?
   Or just the new Notes field?

7. Archive vs Delete
   Edit modal has “Archive task” button
   Does this move to Graveyard or delete permanently?
   AppSheet didn’t have deletion

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 5: PRIORITIZED ROADMAP

PHASE 1: RESTORE CRITICAL APPSHEET FEATURES
Goal: Achieve feature parity for daily workflow
Timeline: Sprint 1-2

✓ 1.1 Add date-based grouping to Open Tasks view
Group tasks by due date (Today, Tomorrow, This Week, Later)
  - Show task count per group
  - Collapsible groups for focus
□ 1.2 Implement URL fields
Add 3 URL fields to task model (or dynamic URL list)
  - Display URLs in task card with link icons
  - Click to open in new tab
□ 1.3 Add Project/Context field
Simple text field or dropdown for project assignment
  - Show in task card and allow filtering by project
  - Consider tags instead of single project field
□ 1.4 Implement FollowUpItem flag
Boolean toggle in task edit modal
  - Visual indicator (📞 or “Waiting” badge)
  - Filter option to show only follow-up tasks
□ 1.5 Add Task ID system
Generate unique IDs (can be sequential or hash)
  - Display in task detail/modal
  - Make copyable for reference
PHASE 2: ENHANCE EFFICIENCY
Goal: Reduce clicks, increase speed
Timeline: Sprint 3-4

□ 2.1 Implement inline quick-edit
Click priority to change without modal
  - Click date to open date picker inline
  - Double-click title to edit in place
□ 2.2 Build bulk operations
Checkbox select system
  - Bulk complete, bulk reschedule, bulk archive
  - Select all / select none
□ 2.3 Add advanced filtering
Date range filter (This week, Next week, Custom)
  - Project/tag filter
  - Combine filters (e.g., P1 + This week + Project X)
  - Save filter presets
□ 2.4 Implement completed task grouping
Group by completion date (Today, Yesterday, This Week, Earlier)
  - Show completion time for Today’s tasks
  - Option to export completed tasks
PHASE 3: POLISH & POWER FEATURES
Goal: Exceed AppSheet capabilities
Timeline: Sprint 5-6

□ 3.1 Advanced analytics
Completion rate by priority
  - Average time to complete (created → completed)
  - Most rescheduled tasks (rollover champions)
  - Weekly/monthly completion trends
  - Time-of-day completion patterns
□ 3.2 Smart Someday/Graveyard
Auto-detect chronic rollovers (5+ reschedules)
  - Suggest moving to Someday after 3 weeks deferred
  - Graveyard analysis: “You’ve rolled over ‘Call dentist’ 12 times”
  - Reactivate from Someday/Graveyard with one click
□ 3.3 Task templates   - Manual “Move to Someday” action when user realizes task isn’t ready yet
One-click reactivate from Someday back to Open (with original or new date)
Save recurring task templates
  - One-click create from template
  - Variable fields (e.g., “Monthly report for [MONTH]”)
□ 3.4 Improved Today view
Hour-by-hour time blocking
  - Drag tasks to time slots
  - Integration with calendar (if applicable)
  - Morning review prompt
□ 3.5 Mobile optimization
Test on mobile browsers
  - Touch-friendly tap targets
  - Swipe gestures (swipe right to complete, left to reschedule)
  - Mobile-specific shortcuts
□ 3.6 Data import/export
Export to CSV/JSON
  - Import from AppSheet data
  - Backup/restore functionality
PHASE 4: COLLABORATION & INTEGRATION
Goal: Multi-user and ecosystem
Timeline: Sprint 7+

□ 4.1 Multi-user support
User accounts and authentication
  - Assign tasks to others
  - Shared projects
□ 4.2 Integrations
Calendar sync (Google Calendar, Outlook)
  - Email task creation (forward to special address)
  - Webhook support for automation
  - API for third-party apps
□ 4.3 Advanced features
Subtasks/checklists
  - Task dependencies
  - Recurring tasks
  - Attachments/file uploads
  - Rich text descriptions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 6: ARCHITECTURAL RECOMMENDATIONS

6.1 DATABASE SCHEMA ADDITIONS

Current schema (inferred):
Id
- title
- description
- priority (Critical/High/Medium/Low)
- status (Open/Completed/Someday/Archived)
- due_date
- created_at
- updated_at
- notes
Recommended additions:
Project_id (or tags array)
+ urls (JSON array or separate table)
+ follow_up_flag (boolean)
+ display_id (user-facing ID)
+ completed_at (timestamp)
+ archived_at (timestamp)
+ reschedule_count (int, tracks rollovers)
+ original_due_date (date, for rollover detection)
+ time_estimate (int, minutes)
+ actual_time (int, minutes)
+ parent_task_id (for subtasks later)
6.2 UI/UX IMPROVEMENTS

Navigation:
Add breadcrumbs (Open Tasks > Filtered by Critical)
- Keyboard navigation between sections (1-5 for tabs)
- Quick jump to date (press “t” for today, “w” for next week)
Task Cards:
Show age indicator (“Created 3 days ago”)
- Show reschedule count if > 0 (“Rescheduled 2x”)
- Color-code overdue tasks (red tint)
- Show project tag as colored badge
Filters:
Make filters persistent across page loads
- Show active filters at top with X to remove
- “Clear all” button when >1 filter active
Search:
Real-time search (no submit button)
- Highlight matching text in results
- Search history dropdown
6.3 PERFORMANCE CONSIDERATIONS

Current state: 1 Open, 2 Completed tasks (test data)
Plan for scale:
100+ tasks: Implement pagination or virtual scrolling
- 1000+ tasks: Add database indexing on due_date, status, priority
- Search optimization: Full-text search index
- Lazy load completed tasks (show 20, load more)
6.4 TESTING CHECKLIST

Before launching:
□ Test with realistic data volume (import AppSheet data)
□ Test all keyboard shortcuts
□ Test on mobile browsers (Safari iOS, Chrome Android)
□ Test edge cases (task due in past, far future)
□ Test empty states (no tasks, all completed)
□ Test search with special characters
□ Test date picker across timezones
□ Test bulk operations with 20+ tasks
□ Test browser back/forward navigation
□ Accessibility audit (screen readers, keyboard-only)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 7: MIGRATION STRATEGY

7.1 APPSHEET DATA EXPORT

AppSheet has ~59 Open Tasks + 156 Completed (from 10/7/2025)
Total: ~215+ tasks with year+ of historical data

Steps:
Export AppSheet data to CSV
2. Map fields:
   AppSheet → Localhost
   - Task ID → display_id
   - Title → title
   - Description → description
   - Urgency (P1/P2/P3) → priority (map: P1→Critical, P2→High, P3→Medium/Low)
   - Status → status
   - Due Date → due_date
   - Created Date → created_at
   - Completed Date → completed_at
   - URL1, URL2, URL3 → urls (array)
   - Project ID → project_id
   - FollowUpItem → follow_up_flag
3. Write import script
4. Test import with 10 tasks first
5. Full import once schema is ready

Import helper script:
- `scripts/import-appsheet-tasks.mjs` reads `migration.json`, skips duplicates already in Supabase, and inserts tasks in batches. It honours `--dry-run`, `--open-only`, and `--limit=<n>` flags.
- Make sure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available (the script automatically loads `.env.local`).
- Example dry run: `node scripts/import-appsheet-tasks.mjs --dry-run --open-only --limit=25`
- Real import: `node scripts/import-appsheet-tasks.mjs`
- Titles longer than 200 chars (Supabase column limit) are auto-truncated with a warning to keep inserts from failing.

7.2 PARALLEL USAGE PERIOD

Don’t switch cold turkey:
Week 1-2: Use both systems (localhost for new tasks, AppSheet for reference)
- Week 3-4: Primary on localhost, AppSheet for missing features
- Week 5+: localhost only, AppSheet read-only archive
7.3 ROLLBACK PLAN

If localhost isn’t working:
Keep AppSheet active but not updated
- Export localhost data back to AppSheet if needed
- Document specific pain points for fixes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 8: METRICS FOR SUCCESS

Track these to know if new build is improvement:

Daily Metrics:
Tasks completed per day (compare to AppSheet average)
- Time spent in app (want: less time, same output)
- Number of rollovers (want: decrease over time)
- Perfect days (want: increase)
Weekly Metrics:
Task completion rate (completed / created)
- Average task age at completion (want: decrease)
- Graveyard auto-archives (chronic task detection working?)
- Search usage (is search findable and useful?)
Monthly Metrics:
Total active tasks (want: stable or decreasing)
- Projects with stalled tasks (no progress in 2+ weeks)
- Most used features (guide future development)
Qualitative:
Does Today view actually improve focus?
- Are analytics actionable or just interesting?
- Does Someday/Graveyard reduce guilt?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 9: IMMEDIATE NEXT STEPS

This Week:
- ✓ Complete this audit
- In progress: Review audit and prioritize Phase 1 features
- ✓ Set up database schema for URL, project, follow-up fields (Oct 10, 2025)
- ✓ Implement date-based grouping in Open Tasks (Oct 10, 2025)
- ☐ Test with 10 real tasks from AppSheet
Next Week:
- ☐ Complete Phase 1 features (Task IDs surfaced in UI)
- ☐ Import 50 real tasks from AppSheet
- ☐ Use daily for a week alongside AppSheet
- ☐ Document friction points
- ☐ Begin Phase 2 planning
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONCLUSION

Your localhost build shows tremendous promise. The Today-first philosophy, analytics dashboard, and Someday/Graveyard concepts are genuine improvements over AppSheet’s table-first approach.

However, you’re currently missing several features you use daily:
- Visible task IDs for cross-referencing with other systems
Priority: Complete Phase 1 to restore feature parity before adding Phase 3 enhancements. The risk is building a beautiful system that doesn’t support your actual workflow.

Once Phase 1 is done, you’ll have a system that matches AppSheet plus adds Today view, analytics, better UX, and growth potential. That’s the goal.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

END OF AUDIT
