# EEC Transport Sector Planning & Monitoring System (PMS)
## The Ultimate Master Documentation (Business Concepts + Exhaustive Technical Detail)

---

# SECTION A: BUSINESS DOMAIN & CORE CONCEPTS
*(The following section explains the real-world construction and transport management principles that drive this software.)*

# EEC Transport Sector Planning & Monitoring System (PMS)
## Exhaustive Conceptual, Functional, & Technical Documentation

This document serves as the absolute master blueprint for the EEC Transport PMS. It has been written to cover not only the **deep technical implementation** (code, databases, formulas) but also the **deep conceptual and business domain knowledge** behind the system. 

If you are redesigning the UI/UX, you must understand *why* the data exists, *what* it means in the real world of construction and transport management, and *how* users interact with it.

---

## PART I: THE BUSINESS DOMAIN & CORE CONCEPTS

Before writing code or designing a user interface, it is critical to understand the real-world problems this system solves. Transport infrastructure projects (like building highways, bridges, or rail lines) are massive, multi-year, multi-million dollar endeavors. 

Without a centralized PMS, managing these projects across dozens of contractors, government ministries, and financiers leads to data silos, hidden delays, and catastrophic cost overruns. This system centralizes the tracking of physical progress, financial disbursements, risks, and human resources.

### 1. Project Categories: Design vs. Supervision
The system separates projects into two primary types:
- **DESIGN Projects:** These occur before a shovel ever hits the dirt. They involve surveyors, architects, and engineers creating blueprints, environmental impact studies, and cost estimates. The "Deliverables" here are mostly reports and CAD files.
- **SUPERVISION Projects:** This is the actual construction phase. The government hires a contractor to build the road, and a "Consultant" (Supervision team) to watch the contractor and ensure they aren't cutting corners. The "Deliverables" here are physical (e.g., "10km of asphalt laid", "Bridge pillars poured").

### 2. Measuring Time: Planned vs. Actual & SPI
In large-scale construction, time is money. The system uses concepts derived from **Earned Value Management (EVM)** to track time:
- **Planned Progress (%):** Where the project *should* be today according to the original contract schedule.
- **Actual Progress (%):** Where the project *actually* is today based on physical work completed on the ground.
- **Schedule Performance Index (SPI):** A ratio of Actual / Planned. 
  - *Conceptual Example:* If Planned is 50% and Actual is 40%, the SPI is 0.8. This means for every 1 day of scheduled work, the team is only completing 0.8 days of actual work. The project is bleeding time.
  - *Health Status:* The system uses SPI to automatically color-code the project. SPI > 0.95 is **GREEN** (Healthy). 0.8 to 0.94 is **YELLOW** (Warning). Below 0.8 is **RED** (Critical).

### 3. Risks vs. Issues
In project management, these two are distinctly different, and the UI must treat them differently:
- **RISK (Potential):** Something bad that *might* happen in the future (e.g., "Upcoming monsoon season might flood the excavation site"). 
  - *How it's tracked:* Probability (Low/Med/High) × Impact (Low/Med/High) = Risk Rating. High-rated risks require a "Mitigation Action" to prevent them.
- **ISSUE (Current Reality):** Something bad that *has already happened* and is currently delaying the project (e.g., "The cement supplier went bankrupt").
  - *How it's tracked:* Requires an "Action Required" and an immediate "Severity" assignment.

### 4. Financial Tracking & Variations
Construction projects rarely finish at their original budget.
- **Original Contract Value:** The price agreed upon on Day 1.
- **Variation Value (Variation Orders):** When the client changes their mind (e.g., "Add an extra lane to this road") or unexpected conditions arise (e.g., hitting solid bedrock), the contractor issues a Variation Order, increasing the cost.
- **Amount Certified vs. Amount Received:** The contractor submits an invoice for work done. The supervising engineer inspects the road and "Certifies" that the work is acceptable. However, the government might take 90 days to actually pay the cash ("Amount Received"). The gap between these two is the **Outstanding Payment** (a critical metric for finance teams, as contractors will stop working if not paid).

### 5. Interventions & Escalations
When a project manager cannot solve an issue locally, they raise an **Intervention**. This is an SOS signal to the executive board (Transport Managers, Ministers). It demands high-level political or financial leverage to unblock the project (e.g., "We need the Minister to sign this land-acquisition permit so we can demolish these houses and build the road").

### 6. Recovery Plans
When a project hits **RED** health status, the project manager is forced to create a Recovery Plan. If the project is 15% behind schedule (the "Gap"), the recovery plan dictates how they will catch up (e.g., "The contractor will run 24-hour shifts and bring in 10 extra excavators"). The system tracks the "Original Gap" vs the "Current Gap" to see if the recovery is working.

### 7. Forward Look (Lookahead)
Construction requires massive logistical planning. A "Forward Look" tracks critical events coming in the next 30, 60, or 90 days (e.g., "In 60 days, we need 5,000 tons of steel delivered"). This prevents last-minute panics.

### 8. Deliverables vs. Milestones
- **Deliverables:** Tangible outputs (A 500-page Environmental Report, a completed bridge).
- **Milestones:** A point in time marking a major phase shift (e.g., "Phase 1 Complete", "Site Handover Date").

---

## PART II: USER ROLES & ORGANIZATIONAL HIERARCHY

The UI must adapt to who is logged in, as different roles care about fundamentally different data.

| Role | Conceptual Goal | Technical Access |
|------|-----------------|------------------|
| **ADMIN** | IT Support. Ensure the system is running. | Full Read/Write/Delete on everything. |
| **TRANSPORT_MANAGER** | The Executive. Wants a bird's-eye view. Cares about which projects are RED, and high-level Interventions. Doesn't care about daily milestones. | Full Read across portfolio. Can intervene globally. |
| **PLANNING_MANAGER** | The Scheduler. Cares deeply about SPI, Gantt charts, Delays, and Recovery Plans. | Read/Write on schedules, progress, and resources. |
| **PROJECT_MANAGER** | The Boots on the Ground. Only cares about *their specific* project. Logging daily issues, risks, and milestones. | Read/Write restricted to their assigned projects. |
| **FINANCE** | The Accountant. Cares exclusively about Invoices, Certified Amounts, Variations, and Cash Flow. | Read/Write strictly on Financial Records. |

*UX Note:* A Transport Manager logging in should see a high-level map/dashboard of red vs green projects. A Finance user logging in should see a dashboard of Outstanding Payments and upcoming invoice dates.

---



---

# SECTION B: EXHAUSTIVE TECHNICAL DOCUMENTATION
*(The following section provides a line-by-line, exhaustive breakdown of the entire EEC Transport PMS codebase. Every file, database field, API route, and React component is detailed here.)*

## 1. System Overview & Architecture

The application is an enterprise-grade Project Management System specific to the transport sector. It tracks infrastructure projects from inception to completion, tracking physical progress, financial disbursements, risks, and human resources. 

### Technology Stack
- **Database:** PostgreSQL (production on Supabase) and SQLite (for local development fallback).
- **ORM:** Sequelize (Node.js).
- **Backend:** Node.js, Express.js.
- **Frontend:** React 18, Vite, React Router v6, Chakra UI, React Hook Form, Axios.
- **Authentication:** JWT (JSON Web Tokens) with standard local storage and Bearer headers.

---

## 2. Backend Environment & Configuration

### `server.js` & `app.js`
The entry point of the backend is `server.js`. It performs the following sequence:
1. Imports the Sequelize instance and authenticates the connection.
2. Runs `sequelize.sync()`. It dynamically checks if the database dialect is PostgreSQL; if it is, it runs `{ alter: true }` so that new columns or ENUM changes are pushed to the database without dropping tables. If SQLite, it runs a standard `sync()` to avoid foreign key crash loops.
3. Binds the server to the configured port (default `5000`).

The `app.js` file handles the Express middleware:
- **Helmet:** Sets HTTP headers for security.
- **CORS:** Configured to allow requests from the frontend (`CLIENT_URL`), with `credentials: true`.
- **Sanitization:** A custom middleware iterates through `req.body` and converts empty strings (`""`) to `null`. This is critical for database integrity, ensuring numeric fields or optional dates don't throw errors when empty form fields are submitted. Note: This is skipped for `/api/auth` to prevent corrupting passwords.
- **Morgan:** Used for HTTP request logging in development.

### `config/database.js` & `config/env.js`
- Reads from a local `.env` file using `dotenv`.
- If the `DATABASE_URL` starts with `sqlite:`, it instantiates a local SQLite instance.
- Otherwise, it instantiates PostgreSQL. Critically, it passes `dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }` which is mandatory for connecting to Supabase instances. It also implements connection pooling (max: 5, min: 0, idle: 10000).

---

## 3. Database Models & Schema Definitions

The data layer is the most complex part of the system. Located in `src/models/`, there are 13 total entities. Every single one is detailed below.

### 1. User Model (`User.js`)
- `id` (INTEGER, PK, Auto-increment)
- `name` (STRING, Not Null)
- `email` (STRING, Not Null, Unique, validated as email)
- `password_hash` (STRING, Not Null)
- `role` (ENUM):
  - `ADMIN`: Superuser.
  - `TRANSPORT_MANAGER`: Executive view.
  - `PLANNING_MANAGER`: Schedule and progress controller.
  - `PROJECT_MANAGER`: Manages specific projects.
  - `FINANCE`: Financial data controller.
  - `VIEWER`: Read-only access.
- `is_active` (BOOLEAN, defaults true)

### 2. Project Model (`Project.js`)
The root entity for all tracking.
- `id` (INTEGER, PK, Auto-increment)
- `project_code` (STRING, Not Null, Unique) - e.g., "TSP-015"
- `project_name` (STRING, Not Null)
- `client` (STRING)
- `employer` (STRING)
- `contract_no` (STRING)
- `consultant` (STRING)
- `responsible_team` (STRING)
- `project_manager_id` (INTEGER, FK to users table)
- `commencement_date` (DATEONLY)
- `completion_date` (DATEONLY)
- `duration_months` (DECIMAL)
- `contract_value` (DECIMAL)
- `currency` (STRING)
- `project_status` (ENUM): `ACTIVE`, `COMPLETED`, `SUSPENDED`, `CANCELLED`, `ON_HOLD` (Default `ACTIVE`)
- `project_type` (ENUM): `DESIGN`, `SUPERVISION`

### 3. Sub-Registers (Related to Project via `project_id`)
All of the following models have an `id` (PK) and a `project_id` (FK to projects). In `index.js`, they are all connected to the Project model using a `hasMany` relationship with `onDelete: 'CASCADE'`.

#### A. Contract (`Contract.js`)
- `contract_no` (STRING, Not Null)
- `contract_title` (STRING, Not Null)
- `client` / `contractor_or_consultant` (STRING)
- `original_contract_value` (DECIMAL, default 0)
- `variation_value` (DECIMAL, default 0)
- `revised_contract_value` (DECIMAL) — *Calculated automatically*
- `contract_start_date` / `contract_end_date` (DATEONLY)
- `contract_status` (ENUM): `ACTIVE`, `COMPLETED`, `EXPIRED`, `SUSPENDED`, `TERMINATED` (Default `ACTIVE`)

#### B. ProjectProgress (`ProjectProgress.js`)
- `reporting_month` (DATEONLY, Not Null)
- `planned_progress` (DECIMAL, Not Null, default 0)
- `actual_progress` (DECIMAL, Not Null, default 0)
- `schedule_variance` (DECIMAL) — *Calculated: actual - planned*
- `spi` (DECIMAL) — *Schedule Performance Index*
- `time_elapsed_percent` / `time_remaining_percent` (DECIMAL)
- `notes` (TEXT)

#### C. Milestone (`Milestone.js`)
- `name` (STRING, Not Null)
- `planned_date` (DATEONLY, Not Null)
- `actual_date` (DATEONLY)
- `responsible_person` (STRING)
- `is_critical` (BOOLEAN, default false)
- `status` (ENUM): `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `DELAYED`, `AT_RISK`, `CANCELLED` (Default `NOT_STARTED`)
- `notes` (TEXT)

#### D. Deliverable (`Deliverable.js`)
- `name` (STRING, Not Null)
- `category` (ENUM): `REPORT`, `SURVEY`, `DESIGN`, `TRAINING`, `SOFTWARE`, `DOCUMENTATION`, `OTHER`
- `planned_date` (DATEONLY, Not Null)
- `actual_date` (DATEONLY)
- `responsible_person` (STRING)
- `is_critical` (BOOLEAN, default false)
- `status` (ENUM): `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `DELAYED`, `AT_RISK`, `CANCELLED` (Default `PLANNED`)
- `description` (TEXT)

#### E. FinancialRecord (`FinancialRecord.js`)
- `reporting_month` (DATEONLY, Not Null)
- `original_contract_value` / `variation_value` / `revised_contract_value` (DECIMAL)
- `planned_invoicing` / `actual_invoicing` (DECIMAL)
- `amount_certified` / `amount_received` / `outstanding_payment` (DECIMAL)
- `planned_cost` / `actual_cost` / `forecast_cost` (DECIMAL)

#### F. Risk (`Risk.js`)
- `risk_code` (STRING, Not Null)
- `description` (TEXT, Not Null)
- `category` (STRING)
- `probability` (ENUM): `LOW`, `MEDIUM`, `HIGH` (Default `LOW`)
- `impact` (ENUM): `LOW`, `MEDIUM`, `HIGH` (Default `LOW`)
- `rating` (INTEGER) — *Calculated based on prob * impact*
- `mitigation_action` (TEXT)
- `responsible_person` (STRING)
- `target_date` (DATEONLY)
- `status` (ENUM): `OPEN`, `MITIGATING`, `CLOSED`, `ESCALATED` (Default `OPEN`)

#### G. Issue (`Issue.js`)
- `issue_code` (STRING, Not Null)
- `description` (TEXT, Not Null)
- `category` (STRING)
- `severity` (ENUM): `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` (Default `LOW`)
- `impact` / `action_required` (TEXT)
- `responsible_person` (STRING)
- `target_date` (DATEONLY)
- `status` (ENUM): `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `ESCALATED` (Default `OPEN`)

#### H. Resource (`Resource.js`)
- `resource_type` (ENUM): `HUMAN_RESOURCE`, `VEHICLE`, `EQUIPMENT`, `SUBCONSULTANT`, `OTHER`
- `resource_name` (STRING, Not Null)
- `required_quantity` / `available_quantity` / `operational_quantity` (INTEGER, defaults 0)
- `shortfall` (INTEGER) — *Calculated: required - available*
- `notes` (TEXT)

#### I. Intervention (`Intervention.js`)
- `priority` (ENUM): `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`
- `problem` (TEXT, Not Null)
- `impact` / `required_decision` (TEXT)
- `responsible_person` (STRING)
- `deadline` (DATEONLY)
- `status` (ENUM): `PENDING`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`, `CANCELLED`
- *Relations:* Optionally links to a `Risk` or `Issue` via `risk_id` or `issue_id`.

#### J. RecoveryPlan (`RecoveryPlan.js`)
- `original_gap` / `recovery_target_gap` / `current_gap` (DECIMAL, default 0)
- `recovery_status` (ENUM): `NOT_STARTED`, `IMPROVING`, `ON_TRACK`, `AT_RISK`, `FAILED`, `COMPLETED`
- `recovery_action` (TEXT, Not Null)
- `responsible_person` (STRING)
- `target_date` (DATEONLY)
- `notes` (TEXT)

#### K. ForwardLook (`ForwardLook.js`)
- `period` (ENUM): `NEXT_30_DAYS`, `NEXT_60_DAYS`, `NEXT_90_DAYS`
- `category` (ENUM): `MILESTONE`, `DELIVERABLE`, `INVOICE`, `PROCUREMENT`, `RESOURCE`, `DECISION`, `CONTRACTUAL_DEADLINE`, `RISK`, `OTHER`
- `description` (TEXT, Not Null)
- `expected_date` (DATEONLY)
- `responsible_person` (STRING)
- `impact` (TEXT)

---

## 4. Automated Calculations & Business Logic
Located in `src/utils/calculations.js`, the backend performs automated calculations so the user never has to manually compute status indicators.

1. **Schedule Metrics:**
   - `schedule_variance` = `actual_progress` - `planned_progress`
   - `spi` (Schedule Performance Index) = `actual_progress` / `planned_progress` (If planned is 0, SPI defaults to 1.0)
2. **Project Health Derivation:**
   - Based solely on SPI: 
     - SPI >= 0.95 ➔ `GREEN`
     - SPI between 0.80 and 0.94 ➔ `YELLOW`
     - SPI < 0.80 ➔ `RED`
     - Null SPI ➔ `GRAY`
3. **Risk Rating Mapping:**
   - Maps `LOW = 1`, `MEDIUM = 2`, `HIGH = 3`.
   - `Score = Probability * Impact`. 
   - A score of 9 is the highest possible threat.
4. **Financial Metrics:**
   - `revised_contract_value` = `original_contract_value` + `variation_value`
   - `outstanding_payment` = `amount_certified` - `amount_received`
5. **Resource Shortfall:**
   - `shortfall` = `required_quantity` - `available_quantity` (Returns 0 if available is greater than required).

---

## 5. Backend Services & Data Fetching

### `projectService.js`
This is the heaviest lifting service.
- **`getAll(query, userRole)`:** 
  - Builds a dynamic SQL WHERE clause checking `project_status`, `project_type`, `client`, and a generic `search` parameter that checks names and codes using `Op.iLike`.
  - **Role enforcement:** If the user is a `DESIGN_DIRECTOR`, they only see `DESIGN` projects. If `CONTRACT_ADMIN_DIRECTOR`, they see `SUPERVISION`.
  - **Enrichment:** It maps through every project and makes parallel calls (`Promise.all`) to fetch the single most recent `ProjectProgress` and `FinancialRecord`. It dynamically calculates the `SPI`, `Health Status`, and `financial_progress` percentage (`amount_received` / `revised_contract_value`) in memory before sending the JSON payload to the frontend.
- **`create(data)`:** When a new project is created, the system **automatically injects a baseline**. It creates a `ProjectProgress` record at 0% and a kickoff `Milestone`.

### `crudServices.js`
This file contains 11 distinct service objects (one for each sub-register).
- **Auto-Baselining Magic:** Every `getAll()` method in this file has a defensive mechanism. Before fetching records for a project, it checks if that project has *any* records in that table. If `count === 0`, it secretly generates a baseline placeholder record (e.g., "Baseline project execution risk" or "Initial Project Report"). This ensures tables in the UI are never entirely barren on day 1.
- **Auto-Calculations on Update/Create:** Whenever a user hits `create` or `update` on a record, the service intercepts it, runs the values through `calculations.js`, and injects the updated metrics (like `outstanding_payment` or `spi`) into the database commit.

---

## 6. Controllers & Routing Setup

### Controller Factory (`controllerFactory.js`)
To prevent endless `try/catch` blocks in controllers, the system uses a higher-order function:
```javascript
const makeController = (fn) => async (req, res, next) => {
  try {
    const result = await fn(req, res);
    if (result !== undefined) {
      res.json({ success: true, data: result });
    }
  } catch (err) {
    next(err);
  }
};
```
If a service throws an error (like `{ status: 404, message: 'Not found' }`), it gets caught and sent to the global error handler in `app.js`.

### Authentication Middleware (`auth.js`)
- `authenticate`: Grabs the Bearer token from headers, verifies it using `config.jwtSecret`, and attaches the decoded payload to `req.user`.
- `authorize(...roles)`: Checks if `req.user.role` exists in the passed array of allowed roles. If not, it throws a 403 Forbidden.

### Routes Organization
- **`projectRoutes.js`:** 
  - `GET /` and `GET /:id` are open to `ALL_ROLES`.
  - `POST /` and `PUT /:id` are restricted to `WRITE_ROLES` (`ADMIN`, `TRANSPORT_MANAGER`, `PLANNING_MANAGER`, `PROJECT_MANAGER`).
  - `DELETE /:id` is restricted to `ADMIN`.
- **`index.js` (Sub-routes):**
  - Iterates through a helper function `crudRoutes` to quickly generate `GET`, `POST`, `PUT`, `DELETE` endpoints for `/progress`, `/contracts`, `/milestones`, etc., attaching the exact same `ALL` and `WRITE` role restrictions, ensuring security across the board.

---

## 7. Frontend Architecture & Context

### React Router & Layout
Located in `App.jsx`, routing is handled by `react-router-dom`.
- `/login`: Public route.
- An `<AppLayout>` wrapper wraps all internal pages, meaning the top navigation/sidebar persists. Unauthenticated users are kicked out automatically by Axios interceptors, not just React Router.

### AuthContext (`context/AuthContext.jsx`)
- Parses `localStorage.getItem('eec_user')` on initial boot.
- Provides a `login` method that hits the API and saves the token.
- Provides a crucial utility function: `hasRole(...roles)`. This is used extensively throughout the application to conditionally render buttons. *If the user does not have the specified role, the button is physically removed from the DOM.*

---

## 8. Frontend API Layer

### Axios Instance (`services/api.js`)
- `API_BASE_URL` points to `import.meta.env.VITE_API_URL`.
- An interceptor attaches `Authorization: Bearer <token>` to every outbound request.
- A response interceptor checks for `401` errors. If a token is expired, it wipes local storage and forces a hard redirect to `window.location.href = '/login'`.

### Service Mappers (`services/services.js`)
- To avoid boilerplate, a `makeCrudService` factory creates standard methods (`getAll`, `getById`, `create`, `update`, `remove`) for a given path string (e.g., `/risks`).

---

## 9. Frontend Components & Pages

### A. Shared UI Components (`components/`)
- **`States.jsx`:** Provides `LoadingState`, `ErrorState`, and `EmptyState`. These keep the UI clean when data is fetching or missing.
- **`Layout.jsx`:** Provides `PageHeader` (Title, Subtitle, and right-aligned action buttons) and `SectionCard` (a simple wrapper with a dark border).
- **`StatusBadge.jsx`:** Includes `HealthBadge` (Green/Yellow/Red dots) and `StatusBadge` (Chakra UI `Badge` components colored specifically based on text values, e.g., mapping `ACTIVE` to blue, `CRITICAL` to red).
- **`ProgressBar.jsx`:** A dual-layer progress bar rendering Planned Progress (gray) and Actual Progress (green/red) overlapping visually.

### B. Dashboard Page (`pages/DashboardPage.jsx`)
*(Currently functionally simple, visually dense)*
- Designed to be an executive summary. In an ideal state, this page would fetch global aggregates. Currently, it serves as a placeholder layout ready to be wired up with visual charts.

### C. Projects Register (`pages/ProjectsPage.jsx`)
- Fetches all projects using `projectService.getAll()`.
- Implements 4 simultaneous filters: Search Text, Status Dropdown, Health Dropdown, Type Dropdown.
- Renders a Chakra UI `<Table>`.
- **Custom Sort:** The list is sorted by Health status, forcing `RED` projects to the very top, `YELLOW` next, then `GREEN`, then `GRAY`. This ensures executives see failing projects immediately.

### D. Project Form Page (`pages/ProjectFormPage.jsx`)
- Handles both Create and Edit states based on whether an `:id` parameter exists in the URL.
- Uses `react-hook-form` for massive form state management.
- The most notable UI element is the "Project Category" selector at the top. Instead of a dropdown, it uses large clickable tiles (Design vs Supervision) setting the internal form state.

### E. Project Detail Page (`pages/ProjectDetailPage.jsx`) - THE BEHEMOTH
This is the most complex file in the application (almost 700 lines).
- **Data Loading:** On mount, it fires 12 parallel `Promise.all` requests, fetching the core Project details AND all 11 sub-registers simultaneously.
- **KPI Strip:** Shows 8 dynamic data points at the very top (Variance, SPI, Contract Value, Open Risks, Open Issues). 
- **Tab Routing:** Uses Chakra `<Tabs>` to render 11 different views. 
  - The *Overview* tab maps out key/value pairs using a tiny `InfoRow` component.
  - Every other tab maps an array into a raw `<Table>`.
- **Global Modal System (`MODAL_CONFIGS`):**
  - Instead of building 11 different modal components for adding Risks, Issues, etc., there is a massive `MODAL_CONFIGS` dictionary at the top of the file.
  - When the user clicks "Add Risk", it sets the `modalType` state to `'risks'`, opens a single global `<Modal>`, and dynamically renders inputs (`<Input>`, `<Select>`, `<Textarea>`) based on the array defined in `MODAL_CONFIGS.risks.fields`.
  - Form submission triggers `MODAL_CONFIGS[modalType].service.create(values)`, cleanly abstracting the data entry.

### F. Generic Register Page (`pages/GenericRegisterPage.jsx`)
- Built for executives who want to see ALL Risks across ALL projects without clicking into specific projects.
- Like the detail page, it uses a massive `CONFIGS` dictionary. 
- It reads the `registerType` prop passed from `App.jsx` (e.g., `<Route path="/risks" element={<GenericRegisterPage registerType="risks" />} />`).
- It maps the columns dynamically based on `config.columns`, heavily utilizing custom formatter functions (`format`, `isBadge`, `isStatus`, `isCriticalBadge`) stored in the dictionary to style raw data into visually appealing badges and colored text.

---

## 10. Redesign Blueprint: Deep UX Analysis

For the UI/UX redesign team, the primary challenge of this application is **Data Density**. The backend provides incredible levels of granularity, but the frontend currently presents it as raw data tables.

### Key Redesign Directives:
1. **Ditch the Tabs for a "Command Center" Approach**
   - 11 tabs hide critical information. A project manager shouldn't have to click "Recovery" to know a recovery plan is failing. 
   - **Solution:** Design a scrolling dashboard for the `ProjectDetailPage`. Use widget cards. If there are 3 Open Risks, show a small "Risks" widget listing just those 3, with a "View All" link that expands a panel.
2. **Visualize the Schedule (Gantt & Burndown)**
   - The "Monthly Progress" table is just rows of numbers. 
   - **Solution:** Use a charting library (like Recharts or Chart.js) to plot "Planned" vs "Actual" lines on a graph. Visualizing the SPI gap over a 12-month period immediately tells a story that a table cannot.
3. **Overhaul the Modals to Slide-Overs (Drawers)**
   - The dynamic modals cover the screen context. When adding an intervention, the user might need to reference the financial numbers behind the modal. 
   - **Solution:** Move all forms into a Right-hand Drawer (Slide-over).
4. **Elevate Typography & Whitespace**
   - Currently, Chakra UI `size="sm"` tables are used everywhere to cram data in.
   - **Solution:** Embrace whitespace. Use distinct typography (e.g., large bold Inter/Roboto fonts) for KPIs. Use sleek dark-mode glassmorphism panels to separate sections.
5. **Color Psychology**
   - The system calculates statuses correctly, but everything is a bit "flat".
   - **Solution:** Use glowing border effects or subtle pulsing animations on `CRITICAL` issues or `RED` health statuses to draw the eye immediately.

### Conclusion
You now have a complete, line-by-line understanding of how data flows from the PostgreSQL database, through the Sequelize ORM, is processed by Express controllers, and routed into React context and dynamic component mapping. Use this document as your absolute source of truth when sketching new wireframes and routing maps.


---

# SECTION C: CONCEPTUAL UX REDESIGN BLUEPRINT



The current UI is highly functional but looks like an administrative database. To make it a **Premium, Dashboard-Driven Experience**, the redesign must translate the conceptual business rules into visual storytelling.

### 1. Kill the Tabs; Build a "Command Center"
A Project Manager shouldn't have to click 5 different tabs to realize their project is failing. 
- **Concept:** Transform `ProjectDetailPage` into a scrolling layout of widgets.
- **Action:** Show the SPI gauge prominently. Below it, show a "Critical Warnings" panel that automatically pulls in any `CRITICAL` issues, `HIGH` risks, or `OVERDUE` interventions. Only show the full tables if the user clicks "Expand".

### 2. Visualizing Time & Money (Charts)
Construction managers are visual people.
- **Concept:** Tables of progress percentages are hard to read.
- **Action:** Implement Line Charts (e.g., using Recharts). Plot a gray line for "Planned Progress" and a green/red line for "Actual Progress" across 12 months. Plot a Bar Chart for Financials showing "Certified Amount" (Blue) vs "Received Amount" (Green), instantly showing the cash flow gap.

### 3. Drawers over Modals
- **Concept:** When a user is adding a Recovery Plan, they need to look at the SPI and the current issues. A center-screen modal covers that data.
- **Action:** Redesign all data-entry forms to use **Right-Hand Slide-Over Drawers**. This keeps the user anchored to the context of the project.

### 4. Color Psychology & Urgency Queues
- **Concept:** In transport management, safety and schedule are everything. The UI must aggressively highlight danger.
- **Action:** Use glowing borders or pulsing notification dots. If `SPI < 0.8`, the whole project header should have a subtle red gradient. If a Risk Rating is a 9, the text should be bold red. Move away from generic Chakra UI tags and use custom, visually striking badges.

### 5. Role-Based Dashboards
- **Concept:** A Finance user does not care about how many excavators are on site.
- **Action:** Redesign `DashboardPage.jsx` to be role-aware. If `user.role === 'FINANCE'`, the top KPI cards should be "Total Portfolio Value", "Total Outstanding Payments", and "Invoices Due". If `user.role === 'PLANNING_MANAGER'`, it should show "Average SPI", "Projects Behind Schedule", and "Open Recovery Plans".

### Conclusion
By deeply understanding the difference between an Issue and a Risk, the importance of SPI, and the political weight of an Intervention, you can design a UI that doesn't just display database rows, but actively helps executives and managers build infrastructure faster and safer.
