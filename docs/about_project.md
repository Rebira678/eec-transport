# EEC Transport Sector Planning & Monitoring System (PMS)
## Exhaustive Conceptual, Functional, & Technical Documentation

This document serves as the absolute master blueprint for the EEC Transport PMS. It has been written to cover both the **deep conceptual and business domain knowledge** behind the system and the **deep technical implementation** (code, databases, formulas). 

If you are redesigning the UI/UX or taking over the codebase, you must understand *why* the data exists, *what* it means in the real world of construction and transport management, and *how* the underlying React and Node.js architecture handles it.

---

## PART I: THE BUSINESS DOMAIN & CORE CONCEPTS

Before writing code or designing a user interface, it is critical to understand the real-world problems this system solves. Transport infrastructure projects (like building highways, bridges, or rail lines) are massive, multi-year, multi-million dollar endeavors. Without a centralized PMS, managing these projects across dozens of contractors, government ministries, and financiers leads to data silos, hidden delays, and catastrophic cost overruns. 

### 1. Project Categories: Design vs. Supervision
The system separates projects into two primary types:
- **DESIGN Projects:** These occur before a shovel ever hits the dirt. They involve surveyors, architects, and engineers creating blueprints, environmental impact studies, and cost estimates. The "Deliverables" here are mostly reports and CAD files.
- **SUPERVISION Projects:** This is the actual construction phase. The government hires a contractor to build the road, and a "Consultant" (Supervision team) to watch the contractor and ensure they aren't cutting corners. The "Deliverables" here are physical (e.g., "10km of asphalt laid").

### 2. Measuring Time: Planned vs. Actual & SPI
In large-scale construction, time is money. The system uses concepts derived from **Earned Value Management (EVM)** to track time:
- **Planned Progress (%):** Where the project *should* be today according to the contract schedule.
- **Actual Progress (%):** Where the project *actually* is today based on physical work completed.
- **Schedule Performance Index (SPI):** A ratio of Actual / Planned. 
  - *Conceptual Example:* If Planned is 50% and Actual is 40%, the SPI is 0.8. For every 1 day of scheduled work, the team is only completing 0.8 days of actual work. The project is bleeding time.
  - *Health Status:* The system uses SPI to automatically color-code the project. SPI > 0.95 is **GREEN** (Healthy). 0.8 to 0.94 is **YELLOW** (Warning). Below 0.8 is **RED** (Critical).

### 3. Risks vs. Issues
The UI must treat these distinctly differently:
- **RISK (Potential):** Something bad that *might* happen in the future (e.g., "Upcoming monsoon season might flood the excavation site"). Tracked by Probability × Impact = Risk Rating. High-rated risks require a "Mitigation Action".
- **ISSUE (Current Reality):** Something bad that *has already happened* and is delaying the project (e.g., "The cement supplier went bankrupt"). Requires immediate "Action" and "Severity" assignment.

### 4. Financial Tracking & Variations
- **Original Contract Value:** The price agreed upon on Day 1.
- **Variation Value (Variation Orders):** When the client changes their mind or unexpected conditions arise, the contractor issues a Variation Order, increasing the cost.
- **Amount Certified vs. Amount Received:** The contractor submits an invoice. The engineer "Certifies" the work is acceptable. The government might take 90 days to actually pay ("Amount Received"). The gap between these is the **Outstanding Payment** (critical metric).

### 5. Interventions & Recovery Plans
- **Interventions:** An SOS signal to the executive board. Demands high-level political/financial leverage to unblock a project.
- **Recovery Plans:** When a project hits **RED** health, the project manager creates a plan dictating how they will catch up (e.g., "Run 24-hour shifts").

### 6. Forward Look (Lookahead)
A logistical planner tracking critical events in the next 30, 60, or 90 days (e.g., "In 60 days, we need 5,000 tons of steel").

---

## PART II: USER ROLES & ORGANIZATIONAL HIERARCHY

The UI and API strictly enforce Role-Based Access Control (RBAC).

| Role | Conceptual Goal | Technical Access |
|------|-----------------|------------------|
| **ADMIN** | IT Support. Ensure the system is running. | Full Read/Write/Delete on everything. |
| **TRANSPORT_MANAGER** | Executive. Wants a bird's-eye view of RED projects. | Full Read across portfolio. Can intervene globally. |
| **PLANNING_MANAGER** | Scheduler. Cares deeply about SPI, delays, and recovery. | Read/Write on schedules, progress, and resources. |
| **PROJECT_MANAGER** | Boots on the Ground. Logging daily issues and risks. | Read/Write restricted to their assigned projects. |
| **FINANCE** | Accountant. Cares about Invoices, Variations, and Cash Flow. | Read/Write strictly on Financial Records. |

---

## PART III: TECHNICAL ARCHITECTURE & BACKEND SETUP

### `server.js` & `app.js`
1. Authenticates the Sequelize connection.
2. Runs `sequelize.sync()`. It dynamically checks if the database is PostgreSQL; if it is, it runs `{ alter: true }` to push schema changes without dropping tables. (SQLite runs a standard `sync()` to avoid foreign key crashes).
3. `app.js` handles Express middleware:
   - **Sanitization:** Converts empty strings (`""`) to `null` on `req.body` to prevent DB integrity errors on empty forms (skipped for `/api/auth`).
   - **Security:** Uses Helmet and CORS configured for the frontend URL.

### `config/database.js`
- Connects to SQLite locally, or PostgreSQL in production. Passes `ssl: { rejectUnauthorized: false }` which is mandatory for connecting to Supabase instances.

---

## PART IV: DATABASE MODELS & SCHEMA DEFINITIONS

There are 13 total entities. All sub-registers are linked to a Project via `project_id` (`hasMany` relationship, cascading delete).

**1. User Model (`User.js`)**
- `name`, `email` (Unique), `password_hash`, `role` (ENUM), `is_active`.

**2. Project Model (`Project.js`)**
- `project_code` (Unique), `project_name`, `client`, `employer`, `contract_no`, `consultant`, `responsible_team`.
- `commencement_date`, `completion_date`, `duration_months`, `contract_value`, `currency`.
- `project_status`: ACTIVE, COMPLETED, SUSPENDED, CANCELLED, ON_HOLD.
- `project_type`: DESIGN, SUPERVISION.

**3. Contract (`Contract.js`)**
- `contract_no`, `contract_title`, `original_contract_value`, `variation_value`, `revised_contract_value` (Calculated), `contract_status`.

**4. ProjectProgress (`ProjectProgress.js`)**
- `reporting_month`, `planned_progress`, `actual_progress`, `schedule_variance` (Calculated), `spi` (Calculated).

**5. FinancialRecord (`FinancialRecord.js`)**
- `reporting_month`, `planned_invoicing`, `actual_invoicing`, `amount_certified`, `amount_received`, `outstanding_payment` (Calculated).

**6. Milestone & 7. Deliverable**
- `name`, `planned_date`, `actual_date`, `is_critical`, `status`.

**8. Risk (`Risk.js`)**
- `probability` (LOW/MED/HIGH), `impact` (LOW/MED/HIGH), `rating` (Calculated), `mitigation_action`, `status`.

**9. Issue (`Issue.js`)**
- `severity` (LOW/MED/HIGH/CRITICAL), `impact`, `action_required`, `status`.

**10. Resource (`Resource.js`)**
- `resource_type`, `required_quantity`, `available_quantity`, `shortfall` (Calculated).

**11. RecoveryPlan (`RecoveryPlan.js`)**
- `original_gap`, `current_gap`, `recovery_action`, `recovery_status`.

**12. Intervention (`Intervention.js`)**
- `priority`, `problem`, `required_decision`, `deadline`.

**13. ForwardLook (`ForwardLook.js`)**
- `period` (30/60/90 days), `category`, `expected_date`.

---

## PART V: AUTOMATED CALCULATIONS & SERVICES

### 1. The Math (`src/utils/calculations.js`)
- **SPI:** `actual_progress / (planned_progress || 1)`. Defaults to 1.0 if planned is 0.
- **Schedule Variance:** `actual_progress - planned_progress`.
- **Project Health:** SPI >= 0.95 (GREEN), 0.8-0.94 (YELLOW), < 0.8 (RED).
- **Risk Rating:** LOW=1, MED=2, HIGH=3. `Rating = Probability * Impact`. Max score 9.
- **Financial Outstanding:** `amount_certified - amount_received`.
- **Resource Shortfall:** `required_quantity - available_quantity`.

### 2. Auto-Baselining (`crudServices.js`)
If a project is created, the system **automatically injects a baseline record** (0% progress, 0 value) into every single sub-register. This ensures UI tables are never completely barren and math formulas don't crash due to missing arrays.

### 3. Controller Factory & Routes
- `controllerFactory.js` wraps all functions in `try/catch` and standardizes `{ success: true, data: result }` responses.
- `projectRoutes.js` and `index.js` enforce RBAC using the `authorize(...roles)` middleware, physically blocking unauthorized writes.

---

## PART VI: FRONTEND ARCHITECTURE & COMPONENTS

### 1. React Router & AuthContext
- `AuthContext.jsx` manages `localStorage` JWTs. It provides the crucial `hasRole(...roles)` function. If a user lacks a role, action buttons (like "Edit Project") are physically excluded from the React DOM.
- `api.js` (Axios) intercepts 401 errors and forces a hard redirect to `/login` if a token expires.

### 2. Projects Register (`ProjectsPage.jsx`)
- Fetches all projects, implementing 4 simultaneous filters.
- **Custom Sort:** Automatically sorts by Health status, forcing `RED` projects to the very top, `YELLOW` next, then `GREEN`.

### 3. The Project Detail Behemoth (`ProjectDetailPage.jsx`)
- **Data Loading:** Fires 12 parallel `Promise.all` API requests on load to fetch the project and all 11 registers simultaneously.
- **The 11 Tabs:** Uses Chakra `<Tabs>` to render 11 different tables.
- **Global Modal Config:** Uses a massive `MODAL_CONFIGS` dictionary. Clicking "Add Risk" sets a state variable, and a generic `<Modal>` loops through a JSON array to render inputs and selects dynamically based on the register type.

---

## PART VII: UX REDESIGN BLUEPRINT (Bridging Concept to Interface)

The current UI is highly functional but looks like an administrative database. To make it a **Premium, Dashboard-Driven Experience**, the redesign must translate the conceptual business rules into visual storytelling.

### 1. Kill the Tabs; Build a "Command Center"
- 11 tabs hide critical information. A project manager shouldn't have to click "Recovery" to know a plan is failing. 
- **Action:** Design a scrolling dashboard for `ProjectDetailPage`. Show the SPI gauge prominently. Below it, show a "Critical Warnings" panel that automatically pulls in any `CRITICAL` issues or `OVERDUE` interventions. Only show full tables if the user clicks "Expand".

### 2. Visualizing Time & Money (Charts)
- Tables of progress percentages are hard to read.
- **Action:** Implement Line Charts (e.g., Recharts). Plot a gray line for "Planned Progress" and a red/green line for "Actual Progress" across 12 months. Plot a Bar Chart for Financials showing "Certified Amount" (Blue) vs "Received Amount" (Green) to instantly show the cash flow gap.

### 3. Drawers over Modals
- Dynamic modals cover the screen context.
- **Action:** Redesign all data-entry forms to use **Right-Hand Slide-Over Drawers**, keeping the user anchored to the context of the project.

### 4. Color Psychology & Urgency Queues
- In transport management, safety and schedule are everything. 
- **Action:** Use glowing borders or pulsing notification dots. If `SPI < 0.8`, the whole project header should have a subtle red gradient. If a Risk Rating is a 9, the text should be bold red. Move away from generic Chakra UI tags and use visually striking custom badges.

### 5. Role-Based Dashboards
- **Action:** Redesign `DashboardPage.jsx` to be role-aware. If `user.role === 'FINANCE'`, the top KPIs should be "Total Portfolio Value" and "Outstanding Payments". If `user.role === 'PLANNING_MANAGER'`, it should show "Average SPI" and "Open Recovery Plans".

---
*(End of Document)*
