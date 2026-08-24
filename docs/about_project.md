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

## PART III: TECHNICAL ARCHITECTURE & DATA MODELS

### 1. Database Schema Definitions
The system uses PostgreSQL (production) via Sequelize. There are 13 total entities. Every register is linked to a Project via `project_id` (`hasMany` relationship, cascading delete).

**1. Project Model**
- `project_code`, `project_name`, `client`, `employer`, `contract_no`, `consultant`, `responsible_team`
- `commencement_date`, `completion_date`, `duration_months`, `contract_value`, `currency`
- `project_status`: ACTIVE, COMPLETED, SUSPENDED, CANCELLED, ON_HOLD
- `project_type`: DESIGN, SUPERVISION

**2. ProjectProgress (Tracking time)**
- `reporting_month`
- `planned_progress`, `actual_progress` (Decimals representing %)

**3. Contract (Tracking scope changes)**
- `original_contract_value`, `variation_value`

**4. FinancialRecord (Tracking cash flow)**
- `reporting_month`
- `planned_invoicing`, `actual_invoicing`
- `amount_certified`, `amount_received`

**5. Risk (Future threats)**
- `probability` (LOW/MED/HIGH), `impact` (LOW/MED/HIGH)
- `mitigation_action`

**6. Issue (Current realities)**
- `severity` (LOW/MED/HIGH/CRITICAL), `action_required`

**7. Resource (Tracking shortfalls)**
- `required_quantity`, `available_quantity`

**8. RecoveryPlan (Fixing RED projects)**
- `original_gap`, `current_gap`, `recovery_action`

**9. ForwardLook (Logistics)**
- `period` (30/60/90 days), `expected_date`

**10. Intervention (Executive SOS)**
- `priority`, `problem`, `required_decision`

**11. Deliverable & 12. Milestone**
- `planned_date`, `actual_date`, `is_critical`

### 2. Automated Backend Calculations (The Math)
The backend (`src/utils/calculations.js`) does heavy lifting so users don't have to use calculators.

- **SPI Calculation:** `SPI = actual_progress / (planned_progress || 1)`. If planned is 0, we default to 1.0 to avoid division by zero.
- **Schedule Variance:** `actual_progress - planned_progress`. If variance is -15, the project is 15% behind schedule.
- **Risk Rating:** LOW=1, MED=2, HIGH=3. `Rating = Probability * Impact`. Max score is 9. Scores >= 6 are considered CRITICAL and should glow red in the UI.
- **Financial Outstanding:** `amount_certified - amount_received`.
- **Resource Shortfall:** `required_quantity - available_quantity`.

### 3. Backend Services (Auto-Baselining)
In `crudServices.js`, there is a critical feature: **Auto-Baselining**. 
If a project is created, the system automatically injects a "baseline" record (0% progress, 0 value) into every single sub-register. This ensures that when the UI loads, the tables are never fully empty, and calculations (like SPI) don't crash due to missing data arrays.

---

## PART IV: CURRENT FRONTEND & UX FLOWS

### 1. Global Navigation & Layout
- Users log in (`LoginPage.jsx`) and a JWT is stored in `localStorage`.
- `AuthContext.jsx` provides a `hasRole()` function. If a user lacks a role, action buttons (like "Delete" or "Add Project") are physically excluded from the React DOM.

### 2. Projects Portfolio (`ProjectsPage.jsx`)
- The main data grid. It sorts projects automatically by Health Status, forcing failing (RED) projects to the very top.
- Includes filters for Type, Status, and Search.

### 3. The Project Detail Behemoth (`ProjectDetailPage.jsx`)
This page is the nerve center of the application, but currently suffers from massive data density.
- **Data Loading:** It fires 12 parallel API requests (`Promise.all`) on load to fetch the project and all 11 of its registers simultaneously.
- **The 11 Tabs:** The UI uses Chakra `<Tabs>` to hide data. Overview, Schedule, Milestones, Deliverables, Financials, Risks, Issues, Interventions, Resources, Recovery, Forward Look.
- **The Global Modal Config:** Instead of writing 11 different forms, the system uses a `MODAL_CONFIGS` dictionary. Clicking "Add Risk" sets a state variable, and a generic `<Modal>` loops through a JSON array to render inputs, selects, and textareas dynamically.

---

## PART V: UX REDESIGN BLUEPRINT (Bridging Concept to Interface)

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
