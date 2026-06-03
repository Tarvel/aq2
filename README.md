# AquaMirror | Digital Twin Smart Water Network Dashboard

Welcome to the **AquaMirror Digital Twin Smart Water Network Dashboard** codebase. This platform is a real-time virtual replica of a campus water distribution network (based on the UNILAG Phase 1 pilot). It is designed to monitor hydraulic pressure, detect and isolate leakages, predict system stress, and optimize water pumping schedules using linear programming.

This project was built for the **FETICON 2026 Innovation Challenge** under the theme:  
*"Innovating for a Sustainable and Resilient Future: Technology as a Catalyst for Economic Development."*

---

## 🚀 Quick Start: How to Run the Dashboard

Since AquaMirror is built as a lightweight, premium, zero-dependency frontend application (HTML, CSS, and pure Vanilla JavaScript), it runs entirely in the browser and requires only a basic static file server to run.

### Step 1: Start the Web Server
Open your terminal, navigate to this project directory, and start a local Python HTTP server on port `8009`:

```bash
python3 -m http.server 8009
```
*(Note: If port `8009` is occupied on your system, you can use any other port like `8080`, `8000`, etc.)*

### Step 2: Open in Your Browser
Open your web browser of choice (Chrome, Firefox, Safari, or Edge) and navigate to:

```url
http://localhost:8009
```

---

## 🛠️ Dashboard Features Tour & Interactions

AquaMirror provides an intuitive, professional, high-contrast light-mode interface with zero gradients, ensuring complete legibility under high-glare field environments. Below is a tour of the key functional modules:

### 1. Interactive Hydraulic Schematic (SVG Map)
- **Visual Mapping:** Displays the physical pipeline connections from water sources (Borehole Wells `BH-1` & `BH-2`), isolation valves (`V-1`, `V-2`, `V-3`, `V-12`), the Pumping Station, storage facilities (`GST-1` ground tank and `OST-1` overhead tank), down to the District Metered Area (DMA) consumption zones (Hostels, Academic Area, Staff Quarters, and Critical Medical Bay).
- **Click-to-Inspect:** Click on any node on the map (such as `GST-1` or `V-12`) to pull up its live operational telemetry in the **Node Inspector** card on the right-hand panel. All terminology is written out in plain English to be understood by non-technical operators.

### 2. Fault Simulator Panel (Left Sidebar)
To demonstrate the Digital Twin's real-time diagnostic capability, you can manually inject infrastructure faults:
- **Pipe Burst (Hostel Zone DMA-1):** Simulates a major pressure drop and high acoustic leak signals.
- **Pump Overheat (Borehole Well BH-1):** Triggers a high-temperature alarm (78°C) and shows automated failover routines.
- **Tank Overflow (Overhead Tank OST-1):** Simulates a float sensor malfunction where the tank overfills to 99%.
- **Low Chlorine Level:** Triggers a water quality alert in the Staff Quarters (Zone DMA-3).
- **Illegal Water Tapping:** Simulates mass flow divergence in the Academic Blocks (Zone DMA-2).

### 3. Dual-Tab Diagnostics & Translated Solutions
- **Tab 1: Action Recommendations (Yoruba / English):** When a fault is activated, this panel displays a localized step-by-step mitigation guide. Toggle between **English** and **Yoruba** to test operator accessibility options.
- **Tab 2: Active Problems & Alarms:** Lists all current system alerts, color-coded by severity (Danger, Warning, Info) with timestamps, specific metric readings, and raw sensor triggers.

### 4. WhatsApp Dispatch Simulator (Bottom-Right Panel)
- Simulates the automated edge-to-cloud SMS/WhatsApp dispatch routine. 
- When you toggle a fault, an instant alert is pushed to this log showing the exact message sent to field technicians (spelling out abbreviations like DMA, BH, OST so off-duty crew can act instantly).

### 5. Demand Forecast & LP Optimization Grid
- **72-Hour Demand Chart:** A canvas-based chart predicting future campus demand curves, pre-calibrated for peak adjustments during UNILAG examination week.
- **Optimized Pumping Allocation Grid:** Click the **"Recalculate (Google OR-Tools)"** button to run the Linear Programming optimization model, which dynamically computes the most cost-efficient pumping intervals based on solar yield and off-peak electricity tariffs.

---

## 📁 File Structure

- **`index.html`** - Contains the dashboard structure, sidebar inputs, responsive layout frames, and the fully interactive inline SVG vector map.
- **`app.js`** - Contains the telemetry database, simulation engine state, translated solutions, Prophet-style forecast curves, and live waveform telemetry canvas rendering.
- **`styles.css`** - Implements the premium, flat, high-contrast light mode design system using slate-gray palette variables and grid layout metrics.
