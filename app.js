// AquaMirror Digital Twin Core Script

// App State
let activeFaults = {
    burst_dma1: false,
    pump_overheat: false,
    tank_overflow: false,
    low_chlorine: false,
    illegal_tap: false
};

let activeLanguage = 'en';
let selectedNodeId = null;

// Solver & simulation states for forecast canvas chart
let hasRecalculated = false;
let isSolving = false;

// Node database (Default / Nominal parameters)
const nodeData = {
    bh1: {
        name: "Borehole Well 1 (BH-1)",
        type: "Water Source (Borehole Well)",
        metrics: {
            "Status": "RUNNING",
            "Flow Rate": "90 L/min",
            "Pump Temperature": "42°C",
            "Energy Draw": "2.2 kW",
            "Aquifer Depth": "84 m",
            "Vibration Level": "1.2 mm/s"
        }
    },
    bh2: {
        name: "Borehole Well 2 (BH-2)",
        type: "Water Source (Borehole Well)",
        metrics: {
            "Status": "RUNNING",
            "Flow Rate": "90 L/min",
            "Pump Temperature": "39°C",
            "Energy Draw": "2.1 kW",
            "Aquifer Depth": "92 m",
            "Vibration Level": "0.9 mm/s"
        }
    },
    pump1: {
        name: "Main Pumping Station (PUMP-1)",
        type: "Pump Station",
        metrics: {
            "Status": "RUNNING",
            "Inlet Pressure": "1.2 bar",
            "Discharge Pressure": "3.8 bar",
            "Total Inflow": "180 L/min",
            "Control Mode": "Auto (Demand-Aligned)",
            "Edge Gateway Link": "Connected (LoRaWAN)"
        }
    },
    gst1: {
        name: "Ground Storage Tank (GST-1)",
        type: "Storage Facility (Ground Storage Tank)",
        metrics: {
            "Capacity": "500,000 Litres",
            "Current Level": "82% (410,000 L)",
            "Inlet Valve": "Open (100%)",
            "Outlet Pressure": "1.4 bar",
            "Water Quality pH": "7.2",
            "Turbidity": "0.8 NTU"
        }
    },
    ost1: {
        name: "Overhead Storage Tank (OST-1)",
        type: "Distribution Storage (Overhead Storage Tank)",
        metrics: {
            "Capacity": "150,000 Litres",
            "Current Level": "68% (102,000 L)",
            "Head Pressure": "2.2 bar",
            "Inlet Valve (V-3)": "Modulating",
            "Overflow Sensor": "Dry",
            "Structural Load": "Nominal"
        }
    },
    v1: {
        name: "BH-1 Isolation Valve (V-1)",
        type: "Flow Control Valve (Borehole-1 Isolation)",
        metrics: {
            "Status": "OPEN",
            "Valve Position": "100%",
            "Actuator Volt": "24V DC",
            "Command Status": "Nominal"
        }
    },
    v2: {
        name: "BH-2 Isolation Valve (V-2)",
        type: "Flow Control Valve (Borehole-2 Isolation)",
        metrics: {
            "Status": "OPEN",
            "Valve Position": "100%",
            "Actuator Volt": "24V DC",
            "Command Status": "Nominal"
        }
    },
    v3: {
        name: "OST-1 Inlet Valve (V-3)",
        type: "Solenoid Gate Valve (Overhead Tank Inlet Control)",
        metrics: {
            "Status": "OPEN (Modulating)",
            "Valve Position": "72%",
            "Pilot Pressure": "1.8 bar",
            "Command Link": "Edge Direct"
        }
    },
    v12: {
        name: "Hostel Zone Isolation Valve (V-12)",
        type: "Zone Gate Valve (DMA-1 Isolation)",
        metrics: {
            "Status": "OPEN",
            "Valve Position": "100%",
            "Manual Override": "Inactive",
            "Serves Zone": "Hostel Zone A & B"
        }
    },
    dma1a: {
        name: "Hostel Block A (DMA-1)",
        type: "District Metered Area Consumption Zone (DMA)",
        metrics: {
            "Average Demand": "50 L/min",
            "Zone Pressure": "1.8 bar",
            "Active Students": "1,200",
            "Minimum Pressure": "0.7 bar (Met)",
            "Acoustic Noise (Leak Band)": "14 dB"
        }
    },
    dma1b: {
        name: "Hostel Block B (DMA-1)",
        type: "District Metered Area Consumption Zone (DMA)",
        metrics: {
            "Average Demand": "30 L/min",
            "Zone Pressure": "1.7 bar",
            "Active Students": "800",
            "Pressure Status": "Nominal"
        }
    },
    dma2: {
        name: "Academic Blocks (DMA-2)",
        type: "District Metered Area Consumption Zone (DMA)",
        metrics: {
            "Average Demand": "30 L/min",
            "Zone Pressure": "1.5 bar",
            "Inflow Meter": "30 L/min",
            "Outflow Sum": "30 L/min",
            "Divergence Rate": "0.0% (Ok)"
        }
    },
    dma3: {
        name: "Staff Quarters (DMA-3)",
        type: "District Metered Area Consumption Zone (DMA)",
        metrics: {
            "Average Demand": "10 L/min",
            "Zone Pressure": "1.7 bar",
            "Residual Chlorine": "0.22 mg/L",
            "pH Reading": "7.1",
            "Turbidity": "0.6 NTU"
        }
    },
    med: {
        name: "Campus Medical Bay",
        type: "Critical Service Consumer Zone",
        metrics: {
            "Priority Tier": "1 (Critical)",
            "Demand": "5 L/min",
            "Pressure": "1.6 bar",
            "Supply Source": "GST-1 direct bypass",
            "Secondary Link": "OST-1 ring line"
        }
    }
};

// Mitigation translation database (Yoruba, Hausa, Igbo, English)
const solutionTranslations = {
    en: {
        burst_dma1: {
            title: "Incident: Pipe Burst at Hostel Zone (DMA-1 Main Gate)",
            steps: [
                "Isolate Zone Gate Valve 12 (V-12) immediately (located 15m North of Main Gate) to stop uncontrolled loss.",
                "Dispatch maintenance crew (Team Alpha) with standard 6-inch pipe repair clamps.",
                "Open Overhead Storage Tank (OST-1) bypass valve V-4 if needed to divert flow and maintain minimum pressure to Hostels A & B.",
                "WhatsApp notification triggered to plumbing supervisor (Chief Kola) for progress updates."
            ]
        },
        pump_overheat: {
            title: "Incident: Borehole Well Pump 1 (BH-1) Thermal Shutdown",
            steps: [
                "Verify automated shutdown of Borehole Pump 1 to prevent motor winding burnout.",
                "Verify automatic failover and start backup Borehole Pump 2 (Borehole Well BH-2) to maintain inlet flow.",
                "Schedule a field technician to inspect BH-1 cooling fan shroud and check electrical windings for sand ingress.",
                "Instruct operator to limit run times on BH-2 to 4-hour cycles to prevent dual overheating during peak heat."
            ]
        },
        tank_overflow: {
            title: "Incident: Overhead Storage Tank (OST-1) Level High-High",
            steps: [
                "Manually override the telemetry system and close Overhead Storage Tank Inlet Control Valve 3 (V-3).",
                "Open pressure relief valve V-4 to redirect excess head pressure back to the Ground Storage Tank (GST-1).",
                "Inspect the float sensor probe on Overhead Tank OST-1 for calcium scaling or calibration drift causing false readings."
            ]
        },
        low_chlorine: {
            title: "Incident: Low Residual Chlorine in Staff Quarters Zone (DMA-3)",
            steps: [
                "Increase chlorine dosing pump stroke rate at the Water Treatment Unit by 15%.",
                "Execute physical water sampling check at the Staff Quarters Zone (DMA-3) sampling tap to confirm dosing levels.",
                "Flush the dead-end pipe segment PE-42 near Staff Quarters to clear stagnant water and restore residual levels."
            ]
        },
        illegal_tap: {
            title: "Incident: Mass Flow Balance Divergence (Academic Area Zone DMA-2)",
            steps: [
                "Dispatch Security & Works inspection unit to Academic Area Zone (DMA-2) corridor.",
                "Perform physical audit of bypass connections behind the Engineering Laboratories and Faculty of Arts building.",
                "Verify status of the Academic Area Zone (DMA-2) electromagnetic flow meter F-8 battery to ensure no reading signal drift."
            ]
        }
    },
    yo: {
        burst_dma1: {
            title: "Ìṣẹ̀lẹ̀: Búbú Paipu ní DMA 1 (Òpópónà Ẹnubodè Akọkọ)",
            steps: [
                "Pa valvu iṣakoso agbegbe V-12 lẹsẹkẹsẹ (eyi ti o wa ni 15m si Ariwa ti Ẹnubode Akọkọ) lati da adanu omi duro.",
                "Firanṣẹ awọn oṣiṣẹ atunṣe (Ẹgbẹ Alpha) pẹlu agekuru paipu 6-inch lati ṣe atunṣe.",
                "Ṣii valvu bypass OST-1 V-4 ti o ba nilo lati yi sisan omi pada si Hostel A & B fun titẹ to kere.",
                "A ti fi ifiranṣẹ ranṣẹ lori WhatsApp si oludari plumbing (Chief Kola) fun iṣẹ ṣiṣe."
            ]
        },
        pump_overheat: {
            title: "Ìṣẹ̀lẹ̀: Pipa Mọto Kanga BH-1 Nitori Gbigbona Pọju",
            steps: [
                "Rii daju pe eto ti pa Mọto kanga BH-1 lati daabobo okun inu rẹ.",
                "Yipada sisan omi si kanga keji BH-2 ti o wa fun atilẹyin lati tọju sisan omi wọle.",
                "Ṣeto oṣiṣẹ imọ-ẹrọ lati ṣayẹwo afẹfẹ itutu ti BH-1 ati lati rii daju pe iyanrin ko wọnu rẹ.",
                "Sọ fun oluṣakoso lati fi opin si iṣẹ BH-2 si wakati mẹrin nikan lati yago fun gbigbona paapaa."
            ]
        },
        tank_overflow: {
            title: "Ìṣẹ̀lẹ̀: Omi Tuntun ti n Ṣàn Jade ní Overhead Tank (OST-1)",
            steps: [
                "Duro lẹnu iṣẹ aifọwọyi ki o pa valvu V-3 pẹlu ọwọ rẹ.",
                "Ṣii valvu bypass V-4 lati dari omi to pọ ju pada si kanga ilẹ (GST-1).",
                "Ṣayẹwo ohun elo sensọ fun idọti kalisiomu ti o le fa aṣiṣe iṣiro rẹ."
            ]
        },
        low_chlorine: {
            title: "Ìṣẹ̀lẹ̀: Àìtó Kòkòrò-Pa (Chlorine) ní DMA 3 (Ibugbe Awọn Oṣiṣẹ)",
            steps: [
                "Mu iwọn sisan dosing pump pọ si ni Wọta Tritimẹnti pẹlu 15%.",
                "Ṣe idanwo omi pẹlu ọwọ ni aaye itọwo omi ti DMA 3 lati rii daju ipele chlorine.",
                "Kọ paipu PE-42 nitosi ibugbe awọn oṣiṣẹ lati yọ omi ti o duro pẹ lẹnu kuro."
            ]
        },
        illegal_tap: {
            title: "Ìṣẹ̀lẹ̀: Ìyàtọ̀ Sísàn Omi ní DMA 2 (Agbegbe Ẹkọ)",
            steps: [
                "Firanṣẹ awọn oṣiṣẹ aabo ati ti Works si agbegbe DMA 2 fun ayẹwo.",
                "Ṣayẹwo gbogbo asopọ paipu lẹhin Engineering Labs ati Faculty of Arts.",
                "Ṣayẹwo batiri ti mita omi F-8 lati rii daju pe ko ba aṣiṣe iṣiro rẹ lọ."
            ]
        }
    },
    ha: {
        burst_dma1: {
            title: "Matsala: Bututu Ya Fashe a DMA 1 (Hanyar Babban Kofa)",
            steps: [
                "Rufe tiyon iko na V-12 nan da nan (yana 15m Arewa da Babban Kofa) domin tsaida asarar ruwa.",
                "Tura ma'aikatan gyara (Tawagar Alpha) tare da matse bututu mai inci 6.",
                "Bude tiyon kewaye na OST-1 V-4 idan bukata ta taso domin karkatar da ruwa zuwa Hostels A & B.",
                "An tura sanarwar WhatsApp zuwa ga mai kula da aikin bututu (Malam Kola) domin duba aiki."
            ]
        },
        pump_overheat: {
            title: "Matsala: Injin Famfo na Well 1 (BH-1) Ya Dena Aiki Saboda Zafi",
            steps: [
                "Tabbatar an kashe injin famfo BH-1 don hana lalacewar mota.",
                "Kunna famfon ajiya na Well 2 (BH-2) domin dawo da ruwa cikin tsari.",
                "Tura masani domin duba iskar sanyaya famfo na BH-1 ko yashi ya shiga ciki.",
                "Umarci mai kula da aikin da ya rage lokacin aiki na BH-2 zuwa awa 4 kawai don hana zafi."
            ]
        },
        tank_overflow: {
            title: "Matsala: Ruwa Ya Cika Ya Kwarara a Babban Tanki (OST-1)",
            steps: [
                "Kashe ikon atomatik sannan a rufe tiyo na V-3 da hannu.",
                "Bude tiyon kewaye na V-4 domin karkatar da ruwa zuwa tankin kasa (GST-1).",
                "Duba na'urar auna ruwa ko gishiri ko kalshiyum ya toshe ta yana kawo matsala."
            ]
        },
        low_chlorine: {
            title: "Matsala: Karancin Sinadarin Chlorine a DMA 3 (Gidan Ma'aikata)",
            steps: [
                "Kara karfin injin zuba sinadarin chlorine da kashi 15% a Sashin Kula da Ruwa.",
                "Duba sinadarin chlorine da hannu a tiyon gwaji na DMA 3 domin tabbatar da inganci.",
                "Wanke karshen bututu PE-42 kusa da gidajen ma'aikata domin zubar da gurbataccen ruwa."
            ]
        },
        illegal_tap: {
            title: "Matsala: Bambancin Auna Ruwa a DMA 2 (Bangaren Karatu)",
            steps: [
                "Tura ma'aikatan tsaro da na Works zuwa sashin DMA 2 don bincike.",
                "Duba wuraren hada bututu a bayan Labs na Engineering da Faculty of Arts.",
                "Duba batirin na'urar auna ruwa F-8 domin tabbatar da daidaiton aiki."
            ]
        }
    },
    ig: {
        burst_dma1: {
            title: "Nsogbu: Pipe Gbawara na DMA 1 (Okporo Ụzọ Ọnụ Ụzọ Ámá)",
            steps: [
                "Mechie valvu V-12 ozugbo (nke dị mita 15 n'akụkụ ugwu nke Ọnụ Ụzọ Ámá) iji kwụsị mfu mmiri.",
                "Ziga ndị ọrụ nlekọta (Otu Alpha) nwere ihe nkedo bututu inch isii maka ndozi.",
                "Meghee valvu V-4 nke OST-1 ma ọ bụrụ na ọ dị mkpa ka mmiri gaa na Hostel A & B.",
                "Ezigara onye nlekọta paipu (Chief Kola) ozi WhatsApp ka ọ mara ka a na-arụ ọrụ ahụ."
            ]
        },
        pump_overheat: {
            title: "Nsogbu: Pọmpụ Well 1 (BH-1) Mechiri N'ihi Oke Ọkụ",
            steps: [
                "Nyochaa na pọmpụ BH-1 mechiri ka ọ ghara imebi mọto ya.",
                "Gbanwee gaa na pọmpụ nke abụọ (Well BH-2) ozugbo maka inye mmiri.",
                "Gwa onye na-arụ ọrụ ka ọ bịa lelee mọto BH-1 maka ájá ma ọ bụ unyi.",
                "Gwa onye na-elekọta ya ka ọ ghara ịgbanye BH-2 karịa awa 4 ka ọ ghara ikpo oke ọkụ."
            ]
        },
        tank_overflow: {
            title: "Nsogbu: Mmiri Na-ejupụta na Tanki (OST-1)",
            steps: [
                "Jiri aka gị mechie valvu V-3 ozugbo.",
                "Meghee valvu bypass V-4 iji wepụ nrụgide mmiri gaa na tanki GST-1.",
                "Lelee ihe nchọpụta sensọ maka unyi kalsiọm nke na-emebi awo sensọ ahụ."
            ]
        },
        low_chlorine: {
            title: "Nsogbu: Chlorine Dị Ala na DMA 3 (Ebe Obibi Ndị Ọrụ)",
            steps: [
                "Kwe ka dosing pọmpụ chlorine rigo site na 15% na ngalaba nchịkwa mmiri.",
                "Gaa na DMA 3 iji nwalee chlorine dị na mmiri ahụ na aka gị.",
                "Saaku paipu PE-42 dị nso na Staff Quarters ka mmiri na-adịghị agba ọsọ pụọ."
            ]
        },
        illegal_tap: {
            title: "Nsogbu: Mfu Mmiri Dị Iche na DMA 2 (Ebe Ọmụmụ Ihe)",
            steps: [
                "Ziga ndị nche na ndị ọrụ nyocha na DMA 2 ozugbo.",
                "Nyochaa ebe njikọ paipu dị n'azụ Engineering Labs na Faculty of Arts.",
                "Lelee batiri flow meter F-8 ka ọ ghara inwe mfu telemetry ọ bụla."
            ]
        }
    }
};

// Initial setup
document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    setInterval(updateClock, 1000);
    
    // Initialize charts
    initWaveformChart();
    initForecastChart();
    
    // Draw initial state
    updateTelemetryStats();
    renderProblemsTab();
    renderSolutionsTab();
});

// Update the system clock
function updateClock() {
    const clock = document.getElementById("live-clock");
    if (clock) {
        const now = new Date();
        const formatted = now.toISOString().slice(0, 19).replace('T', ' ');
        clock.textContent = formatted;
    }
}

// Switching Dashboard Tabs
function switchTab(tabId) {
    // Buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
        if (btn.getAttribute("data-tab") === tabId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Content cards
    document.querySelectorAll(".tab-content").forEach(content => {
        if (content.id === tabId) {
            content.classList.add("active");
        } else {
            content.classList.remove("active");
        }
    });
}

// Node Inspector Trigger
function inspectNode(nodeId) {
    selectedNodeId = nodeId;
    
    // Remove active inspect style from all
    document.querySelectorAll(".node").forEach(n => {
        n.classList.remove("active-inspect");
    });
    
    // Add active style to selected
    const svgNode = document.getElementById(`node-${nodeId}`);
    if (svgNode) {
        svgNode.classList.add("active-inspect");
    }
    
    renderNodeInspector();
}

// Render the details of the selected node
function renderNodeInspector() {
    const container = document.getElementById("inspector-content");
    if (!container) return;
    
    if (!selectedNodeId) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <p>Select any node, valve, or storage tank on the schematic layout to inspect its real-time physical telemetry.</p>
            </div>`;
        return;
    }
    
    const node = JSON.parse(JSON.stringify(nodeData[selectedNodeId]));
    
    // Inject dynamic variations based on active faults
    if (selectedNodeId === 'bh1' && activeFaults.pump_overheat) {
        node.metrics["Status"] = "SHUTDOWN (Safety Lock)";
        node.metrics["Flow Rate"] = "0 L/min";
        node.metrics["Pump Temperature"] = "78°C";
        node.metrics["Energy Draw"] = "0.0 kW";
        node.metrics["Vibration Level"] = "0.0 mm/s";
    }
    if (selectedNodeId === 'bh2' && activeFaults.pump_overheat) {
        // Backup pump runs higher load
        node.metrics["Flow Rate"] = "170 L/min";
        node.metrics["Pump Temperature"] = "51°C";
        node.metrics["Energy Draw"] = "3.8 kW";
    }
    if (selectedNodeId === 'pump1' && activeFaults.pump_overheat) {
        node.metrics["Total Inflow"] = "170 L/min";
        node.metrics["Discharge Pressure"] = "3.4 bar";
        node.metrics["Status"] = "RESTRICTED (Single Well Run)";
    }
    if (selectedNodeId === 'pump1' && activeFaults.burst_dma1) {
        node.metrics["Total Inflow"] = "310 L/min (High)";
        node.metrics["Discharge Pressure"] = "1.8 bar (Low Head)";
    }
    if (selectedNodeId === 'ost1' && activeFaults.tank_overflow) {
        node.metrics["Current Level"] = "99% (148,500 L)";
        node.metrics["Overflow Sensor"] = "WET (Alarm)";
    }
    if (selectedNodeId === 'dma1a' && activeFaults.burst_dma1) {
        node.metrics["Average Demand"] = "10 L/min";
        node.metrics["Zone Pressure"] = "0.4 bar (Air Locked)";
        node.metrics["Acoustic Noise (Leak Band)"] = "82 dB (Critical Burst Sound)";
    }
    if (selectedNodeId === 'dma2' && activeFaults.illegal_tap) {
        node.metrics["Inflow Meter"] = "45 L/min";
        node.metrics["Outflow Sum"] = "30 L/min";
        node.metrics["Divergence Rate"] = "33.3% (High Anomaly)";
    }
    if (selectedNodeId === 'dma3' && activeFaults.low_chlorine) {
        node.metrics["Residual Chlorine"] = "0.05 mg/L (WHO Deficient)";
    }
    
    let rowsHtml = '';
    for (const [lbl, val] of Object.entries(node.metrics)) {
        let textClass = '';
        if (val.includes("SHUTDOWN") || val.includes("Alarm") || val.includes("Critical") || val.includes("Deficient") || val.includes("High Anomaly")) {
            textClass = 'text-danger';
        } else if (val.includes("RESTRICTED") || val.includes("78°C") || val.includes("51°C")) {
            textClass = 'text-warning';
        } else if (val.includes("RUNNING") || val.includes("Nominal") || val.includes("Ok")) {
            textClass = 'text-success';
        }
        
        rowsHtml += `
            <div class="inspect-row">
                <span class="inspect-lbl">${lbl}</span>
                <span class="inspect-val ${textClass}">${val}</span>
            </div>`;
    }
    
    container.innerHTML = `
        <div class="inspector-data-list">
            <div class="inspect-header">
                <span class="inspect-type">${node.type}</span>
                <h4 class="inspect-title">${node.name}</h4>
            </div>
            <div class="inspect-grid">
                ${rowsHtml}
            </div>
        </div>`;
}

// Fault Toggle Event Handler
function toggleFault(faultId) {
    activeFaults[faultId] = document.getElementById(`fault-${faultId.replace('_', '-')}`).checked;
    
    // Update SVG states
    updateSvgStates();
    
    // Recalculate stats
    updateTelemetryStats();
    
    // Update inspector panel if current inspected node is affected
    renderNodeInspector();
    
    // Update alerts counts and tabs
    renderProblemsTab();
    renderSolutionsTab();
    
    // Redraw forecast chart to reflect any leaks
    initForecastChart();
    
    // Inject WhatsApp simulation message if fault active
    triggerWhatsAppAlert(faultId);
}

// Clean and reset all simulation switches
function resetAllFaults() {
    for (const key in activeFaults) {
        activeFaults[key] = false;
        const toggle = document.getElementById(`fault-${key.replace('_', '-')}`);
        if (toggle) toggle.checked = false;
    }
    
    // Reset optimized schedule state too
    hasRecalculated = false;
    isSolving = false;
    
    // Reset schedule back to default rows in HTML
    const tableBody = document.getElementById("optimization-schedule-body");
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td>05:30 - 07:15</td>
                <td>Borehole 1 (BH-1)</td>
                <td>Aquifer Node 1</td>
                <td>Ground Tank (GST-1)</td>
                <td><span class="prio prio-high">High</span></td>
                <td>Run pump (Hostel morning wake-up prep)</td>
            </tr>
            <tr>
                <td>12:00 - 13:00</td>
                <td>Borehole 2 (BH-2)</td>
                <td>Aquifer Node 2</td>
                <td>Ground Tank (GST-1)</td>
                <td><span class="prio prio-low">Low</span></td>
                <td>Run pump (Solar peak capture period)</td>
            </tr>
            <tr>
                <td>18:00 - 20:00</td>
                <td>Borehole 1 (BH-1)</td>
                <td>Aquifer Node 1</td>
                <td>Overhead Tank (OST-1)</td>
                <td><span class="prio prio-med">Medium</span></td>
                <td>Run pump (Evening reserve tank charge)</td>
            </tr>
        `;
    }
    
    updateSvgStates();
    updateTelemetryStats();
    renderNodeInspector();
    renderProblemsTab();
    renderSolutionsTab();
    
    // Redraw chart to clear leak lines and optimized lines
    initForecastChart();
    
    // Clear WhatsApp except first message
    const chat = document.getElementById("whatsapp-chat");
    if (chat) {
        chat.innerHTML = `
            <div class="wa-date">TODAY</div>
            <div class="wa-msg system">
                <span class="wa-text">AquaMirror Edge node connected to primary gateway. Active telemetry synched.</span>
                <span class="wa-time">13:58</span>
            </div>`;
    }
}

// Update the CSS classes of the SVG diagram to animate or highlight issues
function updateSvgStates() {
    // OST-1 Level indicators
    const ostText = document.getElementById("ost1-level-text");
    const ostInd = document.getElementById("ost1-level-indicator");
    if (activeFaults.tank_overflow) {
        if (ostText) ostText.textContent = "99%";
        if (ostText) ostText.style.fill = "#dc2626";
        if (ostInd) ostInd.setAttribute("y1", "202");
        if (ostInd) ostInd.setAttribute("y2", "202");
        if (ostInd) ostInd.style.stroke = "#dc2626";
    } else {
        if (ostText) ostText.textContent = "68%";
        if (ostText) ostText.style.fill = "#0284c7";
        if (ostInd) ostInd.setAttribute("y1", "212");
        if (ostInd) ostInd.setAttribute("y2", "212");
        if (ostInd) ostInd.style.stroke = "#0284c7";
    }
    
    // Flow Lines
    const flowBh1 = document.getElementById("flow-bh1-pump1");
    const flowDma1 = document.getElementById("flow-dist-dma1");
    const linkDma1 = document.getElementById("flow-dma1a-dma1b");
    const flowDma2 = document.getElementById("flow-dist-dma2");
    
    // Pump overheat dry path
    if (activeFaults.pump_overheat) {
        if (flowBh1) flowBh1.classList.add("dry");
    } else {
        if (flowBh1) flowBh1.classList.remove("dry");
    }
    
    // Pipe Burst DMA 1 path
    const markerDma1 = document.getElementById("leak-marker-dma1");
    if (activeFaults.burst_dma1) {
        if (flowDma1) flowDma1.classList.add("burst");
        if (linkDma1) linkDma1.classList.add("dry");
        if (markerDma1) markerDma1.style.display = "block";
    } else {
        if (flowDma1) flowDma1.classList.remove("burst");
        if (linkDma1) linkDma1.classList.remove("dry");
        if (markerDma1) markerDma1.style.display = "none";
    }
    
    // Illegal tapping DMA 2 path
    const markerDma2 = document.getElementById("leak-marker-dma2");
    if (activeFaults.illegal_tap) {
        if (flowDma2) flowDma2.classList.add("leak");
        if (markerDma2) markerDma2.style.display = "block";
    } else {
        if (flowDma2) flowDma2.classList.remove("leak");
        if (markerDma2) markerDma2.style.display = "none";
    }
}

// Calculate statistical numbers dynamically for "LIVE METRICS"
function updateTelemetryStats() {
    let nrw = 14.2;
    let loss = 284000;
    let flow = 180;
    let savings = 23550;
    
    if (activeFaults.burst_dma1) {
        nrw += 15.5;
        loss += 310000;
        flow += 130;
        savings -= 15500;
    }
    
    if (activeFaults.illegal_tap) {
        nrw += 4.5;
        loss += 90000;
        flow += 15;
        savings -= 4500;
    }
    
    if (activeFaults.pump_overheat) {
        // Lower input flow (restricted)
        flow -= 10;
        // Pumping costs higher due to diesel/well 2 usage
        savings -= 3200;
    }
    
    if (activeFaults.tank_overflow) {
        nrw += 8.2;
        loss += 164000;
        flow += 20;
        savings -= 8200;
    }
    
    // Update HTML
    const nrwEl = document.getElementById("stat-nrw");
    const lossEl = document.getElementById("stat-loss");
    const flowEl = document.getElementById("stat-flow");
    const savingsEl = document.getElementById("stat-savings");
    const flowStatusEl = document.getElementById("stat-flow-status");
    const nrwChangeEl = document.getElementById("stat-nrw-change");
    const savingsSub = document.getElementById("stat-savings-sub");
    
    if (nrwEl) nrwEl.textContent = nrw.toFixed(1) + "%";
    if (lossEl) lossEl.textContent = loss.toLocaleString() + " L";
    if (flowEl) flowEl.textContent = flow + " L/min";
    
    if (savingsEl) {
        if (savings >= 0) {
            savingsEl.textContent = "₦" + savings.toLocaleString() + " / day";
            savingsEl.className = "stat-val text-accent";
            if (savingsSub) savingsSub.textContent = "₦" + (savings * 30).toLocaleString() + " monthly rate";
        } else {
            savingsEl.textContent = "-₦" + Math.abs(savings).toLocaleString() + " / day";
            savingsEl.className = "stat-val text-danger";
            if (savingsSub) savingsSub.textContent = "Deficit: Waste exceeds savings";
        }
    }
    
    // Status text updates
    if (flowStatusEl) {
        if (activeFaults.burst_dma1) {
            flowStatusEl.textContent = "Leak Overload";
            flowStatusEl.className = "stat-sub text-danger";
        } else if (activeFaults.pump_overheat) {
            flowStatusEl.textContent = "Restricted Run";
            flowStatusEl.className = "stat-sub text-warning";
        } else {
            flowStatusEl.textContent = "Normal Load";
            flowStatusEl.className = "stat-sub text-success";
        }
    }
    
    if (nrwChangeEl) {
        const baselineDiff = 30.0 - nrw;
        if (baselineDiff > 0) {
            nrwChangeEl.textContent = `↓ ${baselineDiff.toFixed(1)}% vs Baseline`;
            nrwChangeEl.className = "stat-sub text-success";
        } else {
            nrwChangeEl.textContent = `↑ ${Math.abs(baselineDiff).toFixed(1)}% vs Baseline`;
            nrwChangeEl.className = "stat-sub text-danger";
        }
    }
}

// Generate the Problem Alarm list inside Tab 2
function renderProblemsTab() {
    const list = document.getElementById("active-problems-list");
    const tabBadge = document.getElementById("problem-count");
    const summaryBadge = document.getElementById("problem-summary-badge");
    
    if (!list) return;
    
    let activeList = [];
    
    if (activeFaults.burst_dma1) {
        activeList.push({
            id: "FLT-001",
            title: "Pipe Burst: Hostel Zone (DMA-1 Main Gate Ring)",
            severity: "danger",
            desc: "Sudden pressure drop (>1.2 bar in 4 seconds) detected at Hostel Block A ingress node, combined with acoustic peak (82 dB) in Hostel Zone DMA-1 quadrant.",
            metricLabel: "Est. Leakage Ingress:",
            metricValue: "230 L/min",
            time: "13:58:12"
        });
    }
    if (activeFaults.pump_overheat) {
        activeList.push({
            id: "FLT-002",
            title: "Pump Overheat: Borehole Well 1 (BH-1)",
            severity: "warning",
            desc: "Sub-surface motor winding temp reached 78°C (threshold 70°C). Automation gateway shut down power to protect stator core integrity.",
            metricLabel: "Temp / State:",
            metricValue: "78°C / Locked",
            time: "13:57:45"
        });
    }
    if (activeFaults.tank_overflow) {
        activeList.push({
            id: "FLT-003",
            title: "Tank Overflow Alert: Overhead Storage Tank (OST-1)",
            severity: "warning",
            desc: "High level float trigger saturated (99%). Control valve Valve-3 (V-3) reports open state despite command loop close signals.",
            metricLabel: "Saturated Level:",
            metricValue: "99% High-High",
            time: "13:56:04"
        });
    }
    if (activeFaults.low_chlorine) {
        activeList.push({
            id: "FLT-004",
            title: "Water Quality: Low Chlorine at Staff Quarters (DMA-3)",
            severity: "info",
            desc: "Residual chlorine concentrations dropped to 0.05 mg/L in the Staff Quarters (DMA-3) distribution header. Increased risk of bio-film buildup.",
            metricLabel: "Residual Chlorine:",
            metricValue: "0.05 mg/L",
            time: "13:54:19"
        });
    }
    if (activeFaults.illegal_tap) {
        activeList.push({
            id: "FLT-005",
            title: "Water Loss: Mass Divergence in Academic Area (DMA-2)",
            severity: "warning",
            desc: "Digital Twin mass-balance calculates inflow divergence of 33.3% at Academic Blocks Zone (DMA-2). Non-metered flow bypass suspected.",
            metricLabel: "Divergence Rate:",
            metricValue: "15 L/min",
            time: "13:50:52"
        });
    }
    
    // Update Badge Counts
    if (tabBadge) {
        tabBadge.textContent = activeList.length;
        tabBadge.style.display = activeList.length > 0 ? "inline-block" : "none";
    }
    
    const sysBadge = document.getElementById("system-status-badge");
    const sysText = document.getElementById("system-status-text");
    
    if (activeList.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <p>All network parameters are within standard thresholds. No anomalies detected.</p>
            </div>`;
        if (summaryBadge) {
            summaryBadge.textContent = "No Active Faults";
            summaryBadge.className = "badge text-success";
        }
        if (sysBadge && sysText) {
            sysBadge.className = "status-summary normal";
            sysText.textContent = "SYSTEM STATUS: NOMINAL";
        }
    } else {
        if (summaryBadge) {
            summaryBadge.textContent = `${activeList.length} Active Incident(s)`;
            summaryBadge.className = "badge text-danger";
        }
        
        let highestSev = "warning";
        if (activeList.some(item => item.severity === 'danger')) {
            highestSev = "danger";
        }
        
        if (sysBadge && sysText) {
            sysBadge.className = `status-summary ${highestSev}`;
            sysText.textContent = `SYSTEM STATUS: ${highestSev.toUpperCase()} ALERTS`;
        }
        
        let html = '';
        activeList.forEach(item => {
            html += `
                <div class="problem-item ${item.severity}">
                    <div class="problem-top">
                        <div class="prob-title-group">
                            <span class="prob-severity">${item.severity}</span>
                            <h4 class="prob-title">${item.title}</h4>
                        </div>
                        <span class="prob-time">${item.time}</span>
                    </div>
                    <p class="prob-body">${item.desc}</p>
                    <div class="prob-footer">
                        <span>Incident: ${item.id}</span>
                        <div class="prob-metric">${item.metricLabel} <span>${item.metricValue}</span></div>
                    </div>
                </div>`;
        });
        list.innerHTML = html;
    }
}

// Generate the actionable Solution steps inside Tab 3 based on language selection
function renderSolutionsTab() {
    const container = document.getElementById("solutions-content");
    if (!container) return;
    
    let activeFaultKeys = Object.keys(activeFaults).filter(k => activeFaults[k]);
    
    if (activeFaultKeys.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                </svg>
                <p>No active incidents require engineering intervention. Standard automatic balancing loops active.</p>
            </div>`;
        return;
    }
    
    let html = '<div class="solutions-container">';
    
    activeFaultKeys.forEach(key => {
        const trans = solutionTranslations[activeLanguage][key];
        
        let stepsHtml = '';
        trans.steps.forEach((step, idx) => {
            stepsHtml += `
                <div class="step-item">
                    <span class="step-num">${idx + 1}</span>
                    <span class="step-txt">${step}</span>
                </div>`;
        });
        
        html += `
            <div class="solution-incident-block">
                <div class="solution-title-bar">
                    <h4>${trans.title}</h4>
                    <span class="prio prio-high">Mitigation Protocol</span>
                </div>
                <div class="steps-list">
                    ${stepsHtml}
                </div>
            </div>`;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Changing Localisation Language selector
function changeLanguage() {
    const sel = document.getElementById("lang-select");
    if (sel) {
        activeLanguage = sel.value;
        renderSolutionsTab();
    }
}

// Simulates WhatsApp message transmission when a fault is activated
function triggerWhatsAppAlert(faultId) {
    if (!activeFaults[faultId]) return;
    
    const chat = document.getElementById("whatsapp-chat");
    if (!chat) return;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let messageText = "";
    switch(faultId) {
        case 'burst_dma1':
            messageText = "🚨 *AquaMirror Digital Twin Alert*\n\n*Incident:* Pipe Burst Detected\n*Location:* Hostel Zone (DMA-1 Main Gate)\n*Est. flow loss:* 230 L/min\n*Required Valve Isolation:* Zone Valve 12 (V-12)\n\n_Please confirm manual override step once valve is isolated._";
            break;
        case 'pump_overheat':
            messageText = "⚠️ *AquaMirror Digital Twin Alert*\n\n*Incident:* Borehole Pump 1 (BH-1) Thermal Alarm\n*Action:* Automatic shutdown triggered (78°C).\n*Bypass:* Shift load to Borehole Well 2 (BH-2).\n\n_Team dispatched to inspect fan._";
            break;
        case 'tank_overflow':
            messageText = "⚠️ *AquaMirror Digital Twin Alert*\n\n*Incident:* Overhead Tank OST-1 Level High-High (99%)\n*Action:* Control valve Valve-3 (V-3) malfunctioned. Please override manually at valve box.";
            break;
        case 'low_chlorine':
            messageText = "ℹ️ *AquaMirror Quality Check*\n\n*Incident:* Low Chlorine at Staff Quarters (DMA-3) (0.05 mg/L)\n*Action:* Check chemical tank dosing level in the utility station.";
            break;
        case 'illegal_tap':
            messageText = "⚠️ *AquaMirror Balance Alert*\n\n*Incident:* Mass Flow Divergence in Academic Zone (DMA-2) (15 L/min)\n*Action:* Inspect line near Engineering laboratory blocks.";
            break;
    }
    
    const msgDiv = document.createElement("div");
    msgDiv.className = "wa-msg alert";
    msgDiv.innerHTML = `
        <span class="wa-text">${messageText}</span>
        <span class="wa-time">${timeStr} ✓✓</span>
    `;
    
    chat.appendChild(msgDiv);
    // Scroll chat area to bottom
    chat.scrollTop = chat.scrollHeight;
}

// Canvas Waveform Generator (Telemetry graph animation)
let waveCanvas, waveCtx, animationFrameId;
const signalBufferFlow = [];
const signalBufferAcoustic = [];

function initWaveformChart() {
    waveCanvas = document.getElementById("waveform-canvas");
    if (!waveCanvas) return;
    
    waveCtx = waveCanvas.getContext("2d");
    
    // Fill buffers
    for(let i=0; i<100; i++) {
        signalBufferFlow.push(100);
        signalBufferAcoustic.push(20);
    }
    
    animateWaveform();
}

function animateWaveform() {
    if (!waveCtx || !waveCanvas) return;
    
    // Shift data
    signalBufferFlow.shift();
    signalBufferAcoustic.shift();
    
    // Generate new values based on state
    let targetFlow = 100;
    let targetAcoustic = 20;
    
    if (activeFaults.burst_dma1) {
        targetFlow = 180; // High inflow demand due to leak
        targetAcoustic = 140; // High burst sound
    } else if (activeFaults.pump_overheat) {
        targetFlow = 50; // Dropped flow
        targetAcoustic = 15;
    }
    
    if (activeFaults.illegal_tap) {
        targetFlow += 20;
        targetAcoustic += 10;
    }
    
    const noiseFlow = (Math.random() - 0.5) * 8;
    const noiseAcoustic = (Math.random() - 0.5) * 4 + (activeFaults.burst_dma1 ? (Math.random() - 0.5) * 20 : 0);
    
    const currentFlow = signalBufferFlow[signalBufferFlow.length - 1] + (targetFlow - signalBufferFlow[signalBufferFlow.length - 1]) * 0.15 + noiseFlow;
    const currentAcoustic = signalBufferAcoustic[signalBufferAcoustic.length - 1] + (targetAcoustic - signalBufferAcoustic[signalBufferAcoustic.length - 1]) * 0.15 + noiseAcoustic;
    
    signalBufferFlow.push(Math.max(10, currentFlow));
    signalBufferAcoustic.push(Math.max(5, currentAcoustic));
    
    // Update text labels
    const divLabel = document.getElementById("readout-divergence");
    const acousLabel = document.getElementById("readout-acoustic");
    
    if (divLabel) {
        if (activeFaults.illegal_tap) {
            divLabel.textContent = "33.3% (High)";
            divLabel.className = "r-val text-danger";
        } else if (activeFaults.burst_dma1) {
            divLabel.textContent = "54.2% (Critical)";
            divLabel.className = "r-val text-danger";
        } else {
            divLabel.textContent = "0.0% (Ok)";
            divLabel.className = "r-val text-success";
        }
    }
    
    if (acousLabel) {
        const dbValue = Math.round(currentAcoustic / 2);
        acousLabel.textContent = dbValue + " dB";
        if (dbValue > 60) {
            acousLabel.className = "r-val text-danger";
        } else if (dbValue > 30) {
            acousLabel.className = "r-val text-warning";
        } else {
            acousLabel.className = "r-val text-success";
        }
    }
    
    // Clear canvas
    waveCtx.fillStyle = "#ffffff";
    waveCtx.fillRect(0, 0, waveCanvas.width, waveCanvas.height);
    
    // Draw Grid lines
    waveCtx.strokeStyle = "#cbd5e1";
    waveCtx.lineWidth = 1;
    for(let y=0; y<waveCanvas.height; y += 40) {
        waveCtx.beginPath();
        waveCtx.moveTo(0, y);
        waveCtx.lineTo(waveCanvas.width, y);
        waveCtx.stroke();
    }
    
    // Render Flow Signal
    waveCtx.beginPath();
    waveCtx.strokeStyle = "#0284c7"; // accent solid
    waveCtx.lineWidth = 2.5;
    for(let i=0; i<signalBufferFlow.length; i++) {
        // Map value to canvas height (0-200 L/min map to canvas bottom-top)
        const y = waveCanvas.height - (signalBufferFlow[i] / 220) * waveCanvas.height;
        const x = (i / (signalBufferFlow.length - 1)) * waveCanvas.width;
        if (i === 0) waveCtx.moveTo(x, y);
        else waveCtx.lineTo(x, y);
    }
    waveCtx.stroke();
    
    // Render Acoustic Signal
    waveCtx.beginPath();
    waveCtx.strokeStyle = "#dc2626"; // solid warning red
    waveCtx.lineWidth = 1.8;
    for(let i=0; i<signalBufferAcoustic.length; i++) {
        // Map 0-180 range
        const y = waveCanvas.height - (signalBufferAcoustic[i] / 180) * waveCanvas.height;
        const x = (i / (signalBufferAcoustic.length - 1)) * waveCanvas.width;
        if (i === 0) waveCtx.moveTo(x, y);
        else waveCtx.lineTo(x, y);
    }
    waveCtx.stroke();
    
    animationFrameId = requestAnimationFrame(animateWaveform);
}

// Draw Forecast Static/Dynamic Chart on Canvas (No Chart.js dependency for edge speed)
function initForecastChart() {
    const canvas = document.getElementById("forecast-canvas");
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    
    // Vertical grid
    for(let x=100; x<width; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height - 30);
        ctx.stroke();
    }
    // Horizontal grid
    for(let y=40; y<height - 20; y += 40) {
        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Draw Axis Labels
    ctx.fillStyle = "#475569";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    
    const timeLabels = ["Wednesday 12:00", "Thursday 00:00", "Thursday 12:00", "Friday 00:00", "Friday 12:00", "Saturday 00:00"];
    for(let i=0; i<timeLabels.length; i++) {
        const x = 50 + (i / (timeLabels.length - 1)) * (width - 80);
        ctx.fillText(timeLabels[i], x, height - 10);
    }
    
    ctx.textAlign = "right";
    const flowLabels = ["250k L/h", "200k L/h", "150k L/h", "100k L/h", "50k L/h"];
    for(let i=0; i<flowLabels.length; i++) {
        const y = 40 + i * 40;
        ctx.fillText(flowLabels[i], 45, y + 4);
    }
    
    // 1. Draw Historical Baseline Curve (Grey Dashed)
    ctx.beginPath();
    ctx.strokeStyle = "#94a3b8";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    for(let i=0; i<50; i++) {
        const x = 50 + (i / 49) * (width - 80);
        const val = 120 + Math.sin(i * 0.5) * 50;
        const y = height - 30 - (val / 250) * (height - 60);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]); // clear dash
    
    // 2. Draw Demand Forecast / Optimization Curve (Blue Solid)
    ctx.beginPath();
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 3;
    for(let i=0; i<50; i++) {
        const x = 50 + (i / 49) * (width - 80);
        let val;
        
        if (isSolving) {
            // Solve calculation animation: noisy fluctuating curve
            const noise = (Math.random() - 0.5) * 35;
            val = 110 + Math.sin(i * 0.5) * 30 + noise;
        } else if (hasRecalculated) {
            // Recalculated fully optimized curve: smooth and flattened
            val = 100 + Math.sin(i * 0.5) * 15;
        } else {
            // Default forecast (moderately optimized, follows baseline but slightly flatter)
            val = 115 + Math.sin(i * 0.5) * 30 + (i > 25 ? -10 : 15);
        }
        
        const y = height - 30 - (val / 250) * (height - 60);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // 3. Draw Actual Measured Flow (Red Curve) if any leak/burst/tapping fault is active
    const hasLeak = activeFaults.burst_dma1 || activeFaults.illegal_tap;
    if (hasLeak) {
        ctx.beginPath();
        ctx.strokeStyle = "#dc2626"; // solid warning red
        ctx.lineWidth = 2.5;
        for(let i=0; i<50; i++) {
            const x = 50 + (i / 49) * (width - 80);
            let val = 120 + Math.sin(i * 0.5) * 50; // starts similar to baseline
            
            // Add a massive leak spike/burst anomaly in the middle (indices 18 to 38)
            if (i >= 18 && i <= 38) {
                const leakPeak = Math.sin((i - 18) / 20 * Math.PI) * 70;
                val += leakPeak;
            }
            
            const y = height - 30 - (val / 250) * (height - 60);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    // Legend labels on canvas
    ctx.textAlign = "left";
    ctx.fillStyle = "#0f172a";
    ctx.font = "11px Outfit, sans-serif";
    
    // Legend item 1: Forecast Curve
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(60, 15, 12, 12);
    ctx.fillStyle = "#0f172a";
    ctx.fillText(hasRecalculated ? "Optimised Schedule (Google OR-Tools)" : "Demand Forecast (Unsolved)", 80, 25);
    
    // Legend item 2: Historical Baseline
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(310, 21); ctx.lineTo(325, 21); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#0f172a";
    ctx.fillText("Historical Baseline", 335, 25);
    
    // Legend item 3: Actual Measured Flow (only visible/labeled when fault is active)
    if (hasLeak) {
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(490, 15, 12, 12);
        ctx.fillStyle = "#0f172a";
        ctx.fillText("Actual Flow (Burst/Leak Anomaly)", 510, 25);
    }
}

// Simulates OR-Tools recalculation solver
function recalculateOptimization() {
    const tableBody = document.getElementById("optimization-schedule-body");
    if (!tableBody) return;
    
    // Change button text to calculating
    const btn = document.querySelector(".sched-card button");
    const origText = btn.textContent;
    btn.textContent = "Solving LP Model...";
    btn.disabled = true;
    
    isSolving = true;
    
    // Animate the canvas chart while solving
    const solverInterval = setInterval(() => {
        initForecastChart();
    }, 80);
    
    setTimeout(() => {
        clearInterval(solverInterval);
        isSolving = false;
        hasRecalculated = true;
        
        // Generate new random but realistic schedule rows
        tableBody.innerHTML = `
            <tr>
                <td>05:00 - 06:45</td>
                <td>Borehole 2 (BH-2)</td>
                <td>Aquifer Node 2</td>
                <td>Ground Tank (GST-1)</td>
                <td><span class="prio prio-high">High</span></td>
                <td>Pump Active (Solar Pre-heat and morning startup)</td>
            </tr>
            <tr>
                <td>10:00 - 14:30</td>
                <td>Borehole 1 & 2 (BH-1/2)</td>
                <td>Aquifer Shared</td>
                <td>Ground Tank (GST-1)</td>
                <td><span class="prio prio-low">Low</span></td>
                <td>Dual pumping active (Max solar yield period)</td>
            </tr>
            <tr>
                <td>18:30 - 20:30</td>
                <td>Borehole 1 (BH-1)</td>
                <td>Aquifer Node 1</td>
                <td>Overhead Tank (OST-1)</td>
                <td><span class="prio prio-med">Medium</span></td>
                <td>Pump active (Evening storage stabilization)</td>
            </tr>
            <tr>
                <td>01:00 - 03:00</td>
                <td>Gravity Feed Ring</td>
                <td>Overhead Tank Outlet</td>
                <td>All Hostels (Zone DMA-1)</td>
                <td><span class="prio prio-med">Medium</span></td>
                <td>Gravity discharge optimization active</td>
            </tr>
        `;
        
        // Redraw final optimized chart
        initForecastChart();
        
        btn.textContent = origText;
        btn.disabled = false;
        
        // Brief alert message
        alert("Google OR-Tools solver completed successfully. 4-step pumping schedule updated.");
    }, 1200);
}
