# Design System: EcoMetric LCA & EPD Studio
**Project ID:** `projects/ecometric-lca-studio`
**Specification Version:** `2.0-eco`
**Reference Benchmark:** Nature-Led Landing Page & ISO 14025 / EN 15804+A2 Calculation Console

---

## 1. Visual Theme & Atmosphere

### 1.1 Aesthetic Philosophy
EcoMetric blends **botanical serenity** with **rigorous industrial LCA precision**. Rather than sterile corporate blue or cold technical gray, the interface embodies a **calm, nature-led palette**:
- Crisp sage parchment surfaces that evoke sustainable materials and environmental clarity.
- Rich forest-emerald primary actions that guide the eye with intentionality.
- Receded chrome and whisper-soft hairlines that allow complex Bill of Materials (BOM) trees, characterization matrices, and compliance audits to take center stage without visual exhaustion.

### 1.2 Atmosphere Attributes
* **Calm & Grounded:** Soft sage parchment backgrounds (`#f2f6f0`) and pearl surfaces (`#f8faf6`) eliminate harsh white glare during long engineering assessment sessions.
* **Precision-Driven:** Crisp 1px hairline dividers (`#dfe7dd`), monospaced tabular numerals (`tnum`, `zero`), and explicit standard pills (UL 10010-4, EN 15804+A2) project unshakeable scientific rigor.
* **Airy & Uncluttered:** Generous breathing room, minimal heavy drop shadows, and intentional whitespace replace cramped legacy spreadsheets.
* **Tactile & Responsive:** Smooth spring-like cubic bezier transitions (`cubic-bezier(0.16, 1, 0.3, 1)`) and micro-press scales (`scale(0.97)`) make dense data manipulation feel effortless.

---

## 2. Color Palette & Functional Roles

### 2.1 Core Palette Tokens

| Descriptive Name | Hex / Value | Semantic Role | Application in Studio Console |
| :--- | :--- | :--- | :--- |
| **Forest Emerald** | `#1f7a4c` | Primary Action & Focal Accent | Primary CTA buttons, active sidebar pill markers, selected database entries, prominent metric callouts |
| **Deep Forest Focus** | `#176640` | Hover & Active State | Button hover/active states, active tab hover, interactive link focus |
| **Forest Tint Soft** | `rgba(31, 122, 76, 0.08)` | Subtle Background Tint | Badge backgrounds, search highlight boxes, secondary action pill fills |
| **Forest Tint Medium** | `rgba(31, 122, 76, 0.14)` | Elevated Accent Surface | Active dropdown items, drag-over dropzones, badge borders |
| **Evergreen Ink** | `#16231b` | Primary High-Contrast Text | Page headlines, key numeric values, table row titles, primary buttons text on light |
| **Slate Pine** | `#2f3b33` | Secondary Body Text | Section descriptions, table header text, secondary labels, modal body copy |
| **Muted Sage** | `#5b6f62` | Subtle / Meta Text | Field hints, units of measure (`kg CO₂e`, `RT`), phase subtext, breadcrumbs |
| **Subtle Pine Hairline** | `#738077` | De-emphasized Elements | Inactive step numbers, table column dividers, disabled glyphs |
| **Hairline Divider** | `#dfe7dd` | Primary Hairline Border | Card borders, sidebar separation, table row dividers, topbar bottom border |
| **Soft Divider** | `#edf2ec` | Inner Separators | Nested group dividers, popover separators, segmented control borders |
| **Pure Crisp Canvas** | `#ffffff` | Primary Surface / Cards | Workspace cards, modal dialogs, active tabs, editable form inputs |
| **Sage Parchment** | `#f2f6f0` | App Canvas & Workspace Backdrop | Studio root background, main scroll area canvas, tab bar base |
| **Surface Pearl** | `#f8faf6` | Secondary Chrome / Drawers | Sidebar background, secondary drawer panels, table headers sticky base |
| **Soft Eco Tile** | `#eef7f1` | Highlighted Tile & Summary Box | Benchmark card active background, reference basis card, stage summary boxes |
| **Deep Evergreen Black** | `#12432d` | High-Contrast Contrast Surface | Dark modal headers, hero banner highlights, dark tag fills |
| **Translucent Sage Chip** | `rgba(200, 226, 209, 0.64)` | Frosted Chips & Badges | Version pills, standard badges, translucent equipment glyph backgrounds |

### 2.2 Semantic & Audit Alert Palette

| Status | Text Color | Soft Background | Border / Accent | Meaning in LCA Context |
| :--- | :--- | :--- | :--- | :--- |
| **Compliant / Success** | `#1f7a4c` / `#2e9e5b` | `#eaf7ee` / `rgba(46, 158, 91, 0.12)` | `#c3e8cd` | PCR rules satisfied, SHA-256 lineage verified, calculations complete |
| **Warning / Gap** | `#b45309` | `#fef3c7` / `rgba(217, 119, 6, 0.10)` | `#fde68a` | Incomplete A4 transport, proxy dataset used, unmapped BOM material |
| **Critical / Discrepancy**| `#dc2626` | `#fee2e2` / `rgba(220, 38, 38, 0.10)` | `#fecaca` | Cut-off threshold exceeded (>1%), mass balance violation, missing electricity data |
| **Info / Reference** | `#0284c7` | `#e0f2fe` / `rgba(2, 132, 199, 0.10)` | `#bae6fd` | Ecoinvent v3.12 documentation, default standard guidelines, read-only parameters |

---

## 3. Typography Rules

### 3.1 Type Families
* **Display & Body:** `'Google Sans Flex', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
* **Numeric & Monospaced:** `'Google Sans Flex', -apple-system, monospace` with OpenType features enabled:
  ```css
  font-feature-settings: 'tnum' 1, 'zero' 1;
  ```
  *(Ensures perfectly aligned digits in LCIA impact matrices, BOM masses, and scientific exponents).*

### 3.2 Typographic Hierarchy

| Token / Role | Size | Weight | Line Height | Tracking | Application |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Hero** | `36px` - `44px` | 600 (Semibold) | 1.12 | `-0.025em` | View titles, top calculation summaries |
| **Section Title** | `20px` - `24px` | 600 (Semibold) | 1.25 | `-0.02em` | Workflow phase headings, modal titles |
| **Card Header** | `15px` - `17px` | 600 (Semibold) | 1.30 | `-0.015em` | Card titles, parameter group headers |
| **Body Primary** | `13px` - `14px` | 400 (Regular) | 1.45 | `-0.01em` | Table data, descriptions, forms, inputs |
| **Body Strong** | `13px` - `14px` | 600 (Semibold) | 1.45 | `-0.01em` | Active item labels, table headers |
| **Eyebrow / Subhead**| `11px` | 600 (Semibold) | 1.20 | `+0.05em` | All-caps stage indicators (`MODULE A1`, `UL 10010-4`) |
| **Caption / Meta** | `11px` - `12px` | 400 (Regular) | 1.35 | `0` | Sub-labels, help hints, timestamp stamps |
| **Scientific Num** | `12px` - `14px` | 600 (Semibold) | 1.00 | `-0.02em` | Numerical impact values (`4.82e-03`, `12,450 kg`) |

---

## 4. Geometry & Shape

* **Full Pill (`9999px` / `rounded-full`):**
  - Primary CTA buttons (`btn-apple-primary`, `btn-apple-action-blue`).
  - Workflow step indicators, compliance status badges, tag chips.
  - Interactive stage filter toggles (`All Stages`, `A1–A3`, `B6`).
* **Generously Curved (`14px` - `18px` / `rounded-lg`):**
  - Main workspace cards (`.apple-card`, `.studio-card`).
  - File upload drag-and-drop zones.
  - Modal dialogues (`ProcessFlowModal`, `ReportDetailsModal`).
* **Subtly Rounded (`8px` - `10px` / `rounded-sm` / `rounded-md`):**
  - Text input fields, database search bars, table containers.
  - Sidebar navigation items (`.sidebar-item`).
  - Benchmark item cards in preset drawers.

---

## 5. Elevation, Depth & Glassmorphism

### 5.1 Receded Chrome Principle
Chrome recedes to let engineering data breathe:
- Flat topbars with translucent frosted blur (`backdrop-filter: blur(16px)`).
- Hairline borders (`1px solid #dfe7dd`) provide crisp architectural structure instead of blurry dark drop shadows.

### 5.2 Elevation Levels
* **Level 0 (Flat Canvas):** `#f2f6f0` background with `box-shadow: none`.
* **Level 1 (Surface Cards):** `#ffffff` background with `border: 1px solid #dfe7dd` and `box-shadow: 0 1px 3px rgba(16, 52, 33, 0.04)`.
* **Level 2 (Hover / Elevated Card):** `box-shadow: 0 4px 14px -2px rgba(16, 52, 33, 0.08), 0 1px 4px rgba(16, 52, 33, 0.03)` with `transform: translateY(-1.5px)`.
* **Level 3 (Modal / Floating Popover):** `box-shadow: 0 24px 60px -12px rgba(16, 52, 33, 0.22), 0 2px 8px rgba(16, 52, 33, 0.06)`.
* **Frosted Glass (Topbar & Floating Bars):**
  ```css
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid #dfe7dd;
  ```

---

## 6. Component Specifications in EPD Calculation Console

### 6.1 Studio Header & Topbar
* **Height:** `52px` fixed, sticky at top.
* **Background:** Frosted translucent white `rgba(255, 255, 255, 0.92)` with `backdrop-filter: blur(16px)`.
* **Brand Logo:** Green `LeafIcon` (`#1f7a4c`) paired with `EcoMetric` in Google Sans Flex Semibold.
* **Benchmark Preset Picker:** Pill-shaped capsule (`#fafafc`, border `#dfe7dd`) with equipment glyph, dynamic model title, and smooth dropdown popover.
* **Compliance Badge:** Pill capsule with green pulsing beacon (`.compliance-dot-pulse`) and text `UL 10010-4 Part B v2.0 • EN 15804+A2`.
* **Export CTA:** Forest-emerald pill button (`#1f7a4c`, hover `#176640`) with `ExportIcon`.

### 6.2 Studio Sidebar Workflow
* **Background:** Surface pearl (`#f8faf6`) with right hairline divider (`#dfe7dd`).
* **Width:** `280px` expanded, `68px` collapsed (toggle via Ctrl+B or button).
* **Workflow Steps (1 to 8):**
  - Inactive item: Muted slate text (`#5b6f62`), transparent background.
  - Hover item: Soft sage tint (`#eef7f1`), subtle 2px translateX translation.
  - Active item: Pure white card background (`#ffffff`), border `#dfe7dd`, forest green text (`#1f7a4c`), active vertical pill indicator (`#1f7a4c`).
  - Completed item: Green checkmark badge (`#2e9e5b`), soft green fill (`#eaf7ee`).
* **Sidebar Footer (Reference Basis Card):**
  - Background: Soft Eco Tile (`#eef7f1`), border `#dfe7dd`.
  - Specs: Functional Unit, Capacity RT, Lifespan (RSL), Database (ecoinvent 3.12), SHA-256 Lineage valid.

### 6.3 Data Cards & Stat Widgets
* **Structure:** Pure white card (`#ffffff`), `1px solid #dfe7dd`, `14px` border-radius.
* **Top Metric Rows:**
  - Label: All-caps muted sage (`#5b6f62`, `11px`, tracking `+0.04em`).
  - Value: Large semibold evergreen ink (`#16231b`, `22px` - `24px`), tabular numeric font.
  - Subtitle: Subtle clarification (`BOM supply chain extraction`, `kg CO₂e / ton`).
* **Special Highlight Cards (e.g. Total Lifecycle GWP):**
  - Background: Soft Eco Tile (`#eef7f1`) with border `#c8e2d1`.
  - Eyebrow: Forest Emerald (`#1f7a4c`).

### 6.4 LCIA Results Matrix Table
* **Container:** Rounded table wrapper with overflow horizontal scrolling and sticky headers.
* **Headers:** Surface pearl (`#f8faf6`), bottom border `#dfe7dd`, uppercase `11px` typography.
* **Sticky Columns:** Indicator Name and Unit freeze on left during scroll.
* **Row Formatting:**
  - Alternating rows: Pure white (`#ffffff`) and faint pearl (`#fafafc`).
  - Hover row: Soft eco green tint (`#eef7f1`).
  - Primary totals column (`A1–C4 Total`): Forest green semibold (`#1f7a4c`).
  - Module D column: Distinct green column indicating net benefits/loads beyond system boundary.
* **Numerical Formatting:** Right-aligned, tabular monospaced digits with scientific notation toggle.

### 6.5 Form Controls & Search Filters
* **Input Fields:** Pure white background, `1px solid #dfe7dd` border, `8px` border radius.
* **Focus State:** `border-color: #1f7a4c`, `outline: 2px solid rgba(31, 122, 76, 0.15)`.
* **Search Filters:** Integrated magnifying glass, pill tags for active categories, clear button (`×`).
* **Select Pickers:** Custom chevron, clean dropdown options with group dividers.

### 6.6 Modals & Dialogues (Process Flow & Report Details)
* **Backdrop:** Semi-transparent frosted slate `rgba(22, 35, 27, 0.45)` with `backdrop-filter: blur(8px)`.
* **Window Surface:** Pure white (`#ffffff`), border `1px solid #dfe7dd`, `18px` border radius, signature soft shadow.
* **Header:** Frosted top bar with stage pills, close button (`×`), and compliance sub-tag.
* **Stage Flow Columns:** 3-column structured layout (1. Source Documents → 2. Extracted Parameters → 3. EN 15804 Modules) with subtle green connectors.

---

## 7. Motion & Micro-Interactions

* **Transition Timing:** `cubic-bezier(0.16, 1, 0.3, 1)` (Apple/Nature fluid easing).
* **Button Press Feedback:**
  ```css
  .btn:active {
    transform: scale(0.97);
  }
  ```
* **Step Transition:** Smooth fade-and-slide when switching workflow phases:
  ```css
  @keyframes studioFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  ```
* **Status Beacon Pulse:** Continuous gentle opacity pulse on verified compliance pills:
  ```css
  @keyframes ecoPulse {
    0% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.15); opacity: 0.5; }
    100% { transform: scale(1); opacity: 0.9; }
  }
  ```

---

## 8. Implementation Checklist for EPD Console

- [x] **Design System Specification (`DESIGN.md`):** Complete nature-led tokens, typography, component rules, and audit guidelines.
- [x] **CSS Tokens (`frontend/src/index.css`):**
  - Replace legacy Action Blue `#0066CC` with Forest Emerald `#1f7a4c` and Focus `#176640`.
  - Replace canvas backgrounds with Sage Parchment `#f2f6f0` and Surface Pearl `#f8faf6`.
  - Update all `.btn-apple-action-blue`, `.btn-primary`, `.btn-accent`, `.btn-ghost` to nature-led tokens.
  - Update topbar, sidebar, benchmark cards, tables, dropzone, and status chips.
- [x] **Studio Components:**
  - `StudioHeader.jsx`: Add leaf brand mark, nature-led equipment icon colors, export CTA.
  - `ResultsView.jsx`: Replace hardcoded `#0066cc` with `var(--accent, #1f7a4c)`, green stat cards.
  - `ReviewView.jsx` & `UserReviewView.jsx`: Replace `#e8f2ff` / `#0066cc` with eco chips.
  - `ValidateView.jsx`: Replace blue compliance badges with forest green tags.
  - `ExportView.jsx`: Replace `#0071E3` with forest green publish action.
  - `ProcessFlowModal.jsx` & `ReportDetailsModal.jsx`: Adopt nature-led tokens and green focus rings.
- [x] **Visual Verification:** Check dev server, inspect views in browser, verify zero regressions.
