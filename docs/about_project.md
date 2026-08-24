# EEC Transport Sector Planning & Monitoring System (PMS)
## Comprehensive Project Documentation

---

## 1. Project Overview
The **EEC Transport PMS** is a full-stack, enterprise-grade web application designed for the management, tracking, and reporting of large-scale transport infrastructure projects (such as architectural designs and construction supervision). It acts as a single source of truth for cross-functional teams—from project managers to finance officers and executives—to monitor project health, financial standing, milestones, and potential risks.

Because the user intends to embark on a **UI and UX redesign**, this document details every technical, functional, and structural aspect of the current application. Understanding the data models and how the current UI surfaces this data is critical for planning a more cohesive and visually stunning user experience.

---

## 2. Technology Stack & Architecture

### Frontend (Client-Side)
- **Framework:** React.js (via Vite)
- **Routing:** React Router DOM (v6)
- **UI Library:** Chakra UI (provides the current component system, grid layouts, modals, and theming)
- **State Management:** React Context API (specifically for AuthContext) and local component state.
- **Form Handling:** React Hook Form
- **Data Fetching:** Axios (configured with interceptors for JWT token injection and 401 unauthenticated error handling)
- **Styling:** Chakra UI's CSS-in-JS + standard CSS (`index.css` / `style.css`)

### Backend (Server-Side)
- **Framework:** Node.js with Express.js
- **Database:** PostgreSQL (for production on Supabase) / SQLite (for local development)
- **ORM:** Sequelize (Handles all relational modeling, associations, and synchronization)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs for password hashing
- **Security:** Helmet, CORS, and Express request sanitization

### Architecture Pattern
The backend follows a standard Controller-Service-Model architecture:
- **Routes:** Map HTTP endpoints to specific controllers and apply JWT Auth / Role-based access middleware.
- **Controllers:** Handle HTTP requests and responses, utilizing a `controllerFactory` to standardize JSON responses and wrap try/catch blocks.
- **Services:** Contain the core business logic, database queries, and metric calculations (e.g., Schedule Performance Index, Financial Progress).
- **Models:** Define the exact database schema and relationships.

---

## 3. User Roles & Permissions

The system operates on a strictly enforced Role-Based Access Control (RBAC) mechanism.

| Role | Description & Capabilities |
|------|----------------------------|
| **ADMIN** | Full system access. Can view, create, edit, and delete any record, including user accounts. |
| **TRANSPORT_MANAGER** | High-level management. Can read and write across all project registers and financials. |
| **PLANNING_MANAGER** | Focused on schedules, progress, and resources. Can write to most entities but restricted from some administrative deletions. |
| **PROJECT_MANAGER** | Manages specific day-to-day operations. Can update project statuses, risks, issues, and milestones. Restricted from system-wide configurations. |
| **FINANCE** | Focused purely on financial monitoring. Can view projects and has read/write access to Financial Records and Invoicing. |
| **VIEWER** | Read-only access to the platform. Cannot create, edit, or delete any records. |

*Note for Redesign:* The UI currently uses a utility `hasRole()` to conditionally render "Add", "Edit", and "Delete" buttons. The new UI must similarly respect these boundaries, perhaps replacing hidden buttons with disabled buttons + tooltips to improve UX transparency.

---

## 4. Core Domain Models & Database Schema

The database is heavily relational, centered around the **Project** entity. 

### 1. User
- **Fields:** `name`, `email`, `password_hash`, `role`, `is_active`
- **Relations:** A User can manage multiple Projects (`managed_projects`).

### 2. Project
- **Core Details:** `project_code` (unique), `project_name`, `client`, `employer`, `contract_no`, `consultant`, `responsible_team`
- **Timeline & Value:** `commencement_date`, `completion_date`, `duration_months`, `contract_value`, `currency`
- **Categorization:** 
  - `project_status`: ACTIVE, COMPLETED, SUSPENDED, CANCELLED, ON_HOLD
  - `project_type`: DESIGN, SUPERVISION
- **Relations:** One-to-Many with all subsequent registers (Progress, Milestones, Deliverables, etc.).

### 3. Registers (Project Sub-Entities)
Every project has multiple tracking registers attached to it. When redesigning the Project Detail page, these are the core data streams that must be visualized:

- **Contracts:** Tracks original values and variation values (`contract_title`, `original_contract_value`, `variation_value`, `revised_contract_value`, `contract_status`).
- **Project Progress:** Tracks monthly completion percentages (`reporting_month`, `planned_progress`, `actual_progress`, `schedule_variance`, `spi`, `time_elapsed_percent`). The system calculates SPI (Schedule Performance Index).
- **Milestones:** Critical timeline markers (`name`, `planned_date`, `actual_date`, `status`, `is_critical`).
- **Deliverables:** Tangible outputs (`name`, `category`, `planned_date`, `status`, `is_critical`).
- **Financial Records:** Month-by-month financial health (`reporting_month`, `planned_invoicing`, `actual_invoicing`, `amount_certified`, `amount_received`, `outstanding_payment`).
- **Risks:** Potential threats (`risk_code`, `description`, `probability`, `impact`, `rating`, `mitigation_action`). The system calculates a risk `rating` automatically.
- **Issues:** Realized problems currently impacting the project (`issue_code`, `severity`, `impact`, `action_required`).
- **Resources:** Staffing, vehicles, and equipment tracking (`resource_type`, `required_quantity`, `available_quantity`, `shortfall`).
- **Interventions:** Requests for management decisions/escalations (`priority`, `problem`, `required_decision`, `deadline`).
- **Recovery Plans:** Strategies to get delayed projects back on track (`original_gap`, `target_gap`, `current_gap`, `recovery_action`).
- **Forward Look:** 30/60/90 day lookahead for upcoming critical tasks (`period`, `category`, `description`).

---

## 5. Current Frontend UI/UX Structure & Flow

### A. Authentication
- **Login Page (`LoginPage.jsx`):** A standard form collecting email and password.
- **Context (`AuthContext.jsx`):** Manages the JWT in `localStorage` and provides global user state. Redirects unauthenticated users to `/login`.

### B. Global Layout
- **AppLayout (`Layout.jsx`):** A wrapper that likely includes a sidebar/navbar for navigating between the Dashboard, Projects, and Global Registers.

### C. Dashboard Page (`DashboardPage.jsx`)
- **Purpose:** Provide a high-level, executive summary of the entire portfolio.
- **Current UI:** Uses Chakra UI `SimpleGrid` for KPI cards (Total Projects, Financial Health, Overall SPI, Open Risks). 
- **Data Dependency:** Relies heavily on the backend computing averages and aggregations across all projects.

### D. Projects Portfolio Register (`ProjectsPage.jsx`)
- **Purpose:** A master list of all projects in the system.
- **Current UI:** 
  - A top filter bar (Search by name/code, filter by Status, Health, Type).
  - A massive HTML `Table` showing: Code, Type, Name, Client, Dates, Value, Planned %, Actual %, SPI, Status, Health.
  - Clicking a row routes to the Project Detail page.
- **UX Bottleneck:** Tables with 14+ columns are hard to read on smaller screens. 

### E. Project Detail Page (`ProjectDetailPage.jsx`)
- **Purpose:** The nerve center for a single project.
- **Current UI:**
  - **Header:** Project Name, Health Badge, Edit Project button.
  - **KPI Strip:** 8 cards showing Planned/Actual progress, SPI, Financials, Open Risks/Issues, and Contract Value.
  - **Tabs System:** Uses Chakra UI `<Tabs>` to divide the massive amount of sub-entity data.
    - *Overview:* Shows standard project metadata and a progress bar.
    - *Schedule / Milestones / Deliverables / Financials / Risks / Issues / etc.:* Each tab renders a data table mapping over the specific register.
  - **Modals:** To add a new Risk, Issue, or Milestone, the user clicks "Add [Entity]" which triggers a global `Modal` with a dynamically generated form based on a `MODAL_CONFIGS` object.

### F. Generic Register Page (`GenericRegisterPage.jsx`)
- **Purpose:** Allows executives or transport managers to view ALL Risks, ALL Financials, or ALL Milestones across *every* project simultaneously.
- **Current UI:** A highly dynamic table that changes its columns based on the `registerType` prop passed from the router. It includes a project dropdown filter to narrow the view.

### G. Project Form Page (`ProjectFormPage.jsx`)
- **Purpose:** Creating or Editing the root Project entity.
- **Current UI:** A large, two-column form utilizing React Hook Form. The first major choice is `Project Category` (Design vs. Supervision), visually represented by two large clickable cards, followed by standard input fields.

---

## 6. Logic & Automated Calculations (Critical for UI display)

When redesigning, note that the backend computes several metrics that the frontend merely displays. You must maintain space for these metrics:

1. **Schedule Variance & SPI:** 
   - `schedule_variance = actual_progress - planned_progress`
   - `SPI = actual_progress / (planned_progress || 1)`
   - The UI colors these: SPI < 0.8 is RED, 0.8-0.95 is YELLOW, >0.95 is GREEN.
2. **Project Health Status:**
   - Automatically derived from SPI.
3. **Risk Rating:**
   - `Probability (1-3) * Impact (1-3) = Score (1-9)`. Scores >= 6 are RED.
4. **Financial Outstanding Payment:**
   - `amount_certified - amount_received`
5. **Resource Shortfall:**
   - `required_quantity - available_quantity`

---

## 7. Shortcomings of the Current UI & Redesign Recommendations

As you approach the UI/UX redesign, consider resolving the following friction points present in the current Chakra UI implementation:

### 1. Data Density & Table Overload
**Current State:** The system relies exclusively on raw, dense data tables. For instance, the `ProjectDetailPage` has 11 separate tabs containing 11 different tables.
**UX Redesign Opportunity:** 
- Implement **Data Visualization (Charts/Graphs)**. Convert the Financial Register into a Line/Bar chart comparing "Planned Invoicing", "Actual Invoicing", and "Amount Received" over time.
- Convert the Progress tab into a Gantt chart or a burndown chart.
- Replace dense tables with **Card-based layouts** or **Kanban boards** for Risks and Issues (e.g., Open, Mitigating, Closed columns).

### 2. Form Fatigue & Modals
**Current State:** Adding a new record (like a Deliverable) opens a dense, centered modal overlay covering the screen. Editing a project opens a massive full-page form.
**UX Redesign Opportunity:**
- Use **Slide-overs (Drawers)** for adding/editing register items. This keeps the user anchored to the context of the project behind the drawer.
- Implement **Wizard-style step forms** for creating new projects, breaking down the 15+ fields into logical steps (e.g., Step 1: Core Details, Step 2: Financials, Step 3: Team Assignment).

### 3. Lack of Visual Hierarchy
**Current State:** Everything is presented with similar weight. A critical issue looks structurally identical to a low-priority issue, save for a small colored badge.
**UX Redesign Opportunity:**
- Introduce a **Design System** with distinct typography scales and purposeful whitespace.
- Use **Glassmorphism** or sleek dark-mode panels (as requested in premium app parameters) to elevate KPIs.
- Surface "Critical Actions Required" prominently at the top of the Project Overview, pulling urgent Interventions and High-severity Issues out of their respective tabs and into the user's immediate line of sight.

### 4. Navigation & Breadcrumbs
**Current State:** The application utilizes a simple back button (`← Back`).
**UX Redesign Opportunity:**
- Implement robust **Breadcrumb navigation** (e.g., `Dashboard / Projects / E2E-TEST-001 / Risks`).
- Use sticky headers on detail pages so that project context (Name, Status) isn't lost when scrolling through long lists of deliverables.

### 5. Interaction & Micro-animations
**Current State:** Status transitions and row interactions are instantaneous and lack feedback.
**UX Redesign Opportunity:**
- Add smooth, animated transitions when switching between the 11 project tabs.
- Incorporate hover elevation on project rows and KPI cards to make the interface feel alive and responsive.
- Animate progress bars and SPI gauges on initial load.

---

## 8. Summary for the Redesign Team
The EEC Transport PMS is structurally sound on the backend with a robust relational database and well-architected REST API. Your goal for the redesign is to take this heavily administrative, data-dense layout and transform it into a **premium, dashboard-driven experience**. Focus on replacing grids of text with visual storytelling (charts, kanban boards, color-coded urgency queues) while ensuring that the deep relational data (from Forward Looks to Recovery Plans) remains easily accessible.
