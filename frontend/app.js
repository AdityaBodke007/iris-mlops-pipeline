const API_URL = "http://51.20.119.248:8000/predict";

// DOM Elements
const slInput = document.getElementById("sepal-length");
const swInput = document.getElementById("sepal-width");
const plInput = document.getElementById("petal-length");
const pwInput = document.getElementById("petal-width");
const apiKeyInput = document.getElementById("api-key");
const form = document.getElementById("prediction-form");

const slVal = document.getElementById("sl-val");
const swVal = document.getElementById("sw-val");
const plVal = document.getElementById("pl-val");
const pwVal = document.getElementById("pw-val");

const predClassElement = document.getElementById("predicted-class");
const predConfidence = document.getElementById("prediction-confidence");
const predIcon = document.getElementById("pred-class-icon");
const statusIndicator = document.querySelector(".status-indicator");
const statusText = document.getElementById("api-status-text");

const logsBody = document.getElementById("logs-body");
const runTestBtn = document.getElementById("run-test");

// Chart.js Configuration
const ctx = document.getElementById('radarChart').getContext('2d');
let radarChart;

// Class Configuration for Styling
const classConfig = {
    "setosa": { color: "var(--primary)", icon: "ph-plant", bg: "rgba(139, 92, 246, 0.4)" },
    "versicolor": { color: "var(--secondary)", icon: "ph-leaf", bg: "rgba(236, 72, 153, 0.4)" },
    "virginica": { color: "var(--success)", icon: "ph-tree-palm", bg: "rgba(16, 185, 129, 0.4)" },
    "unknown": { color: "var(--danger)", icon: "ph-warning-circle", bg: "rgba(239, 68, 68, 0.4)" }
};

// Initialize Chart
function initChart() {
    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Sepal Length', 'Sepal Width', 'Petal Length', 'Petal Width'],
            datasets: [{
                label: 'Current Input',
                data: [slInput.value, swInput.value, plInput.value, pwInput.value],
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderColor: '#8b5cf6',
                pointBackgroundColor: '#8b5cf6',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#8b5cf6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: { color: '#94a3b8', font: { family: 'Inter' } },
                    ticks: { display: false, min: 0, max: 8 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Update Chart Data dynamically
function updateChart(features, className) {
    if (!radarChart) return;
    radarChart.data.datasets[0].data = features;

    // Change chart color based on class
    const tClass = className.toLowerCase();
    if (classConfig[tClass]) {
        radarChart.data.datasets[0].borderColor = classConfig[tClass].color.replace('var(--', '').replace(')', ''); // hacky var fallback
        radarChart.data.datasets[0].backgroundColor = classConfig[tClass].bg;
    }

    radarChart.update();
}

// Debounce helper to prevent spamming API
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Fetch Prediction from API
async function fetchPrediction(features) {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) return null;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": apiKey
            },
            body: JSON.stringify({ features: features })
        });

        if (response.ok) {
            setAPIStatus("online", "Connected to API");
            return await response.json();
        } else if (response.status === 401) {
            setAPIStatus("error", "Unauthorized: Bad API Key");
            return { error: "Auth Failed" };
        } else {
            setAPIStatus("error", `Error: ${response.status}`);
            return { error: "API Error" };
        }
    } catch (err) {
        setAPIStatus("error", "API Unreachable");
        return { error: "Network Error" };
    }
}

// Handle Inference Logic
const triggerInference = debounce(async () => {
    const features = [
        parseFloat(slInput.value),
        parseFloat(swInput.value),
        parseFloat(plInput.value),
        parseFloat(pwInput.value)
    ];

    // Read API Key
    const res = await fetchPrediction(features);

    if (res && res.predicted_class) {
        const className = res.predicted_class;
        predClassElement.textContent = className.charAt(0).toUpperCase() + className.slice(1);

        // Re-trigger animation
        predClassElement.classList.remove('fade-in');
        void predClassElement.offsetWidth;
        predClassElement.classList.add('fade-in');

        // Update styling dynamically
        const cf = classConfig[className.toLowerCase()];
        if (cf) {
            predClassElement.style.color = "#fff";
            document.querySelector('.glow-ring').style.background = cf.color;
            predIcon.className = `ph ${cf.icon}`;
            predConfidence.innerHTML = `<i class="ph ph-check-circle"></i> Prediction Successful`;
            predConfidence.style.color = "var(--success)";
        }

        updateChart(features, className);
    } else if (res && res.error) {
        predClassElement.textContent = "Error";
        predClassElement.style.color = "var(--danger)";
        predConfidence.innerHTML = `<i class="ph ph-warning-circle"></i> ${res.error}`;
        predConfidence.style.color = "var(--danger)";
        document.querySelector('.glow-ring').style.background = "var(--danger)";
    }

}, 300); // 300ms debounce


// UI Update Helper
function updateSliderValues() {
    slVal.textContent = `${slInput.value}cm`;
    swVal.textContent = `${swInput.value}cm`;
    plVal.textContent = `${plInput.value}cm`;
    pwVal.textContent = `${pwInput.value}cm`;
}

function setAPIStatus(status, text) {
    statusIndicator.className = `status-indicator ${status}`;
    statusText.textContent = text;
}

// Event Listeners for Live Form
form.addEventListener('input', (e) => {
    if (e.target.type === 'range') {
        updateSliderValues();
        // Update chart instantly, wait for API
        const f = [slInput.value, swInput.value, plInput.value, pwInput.value];
        radarChart.data.datasets[0].data = f;
        radarChart.update();
        triggerInference();
    }
    if (e.target.id === 'api-key') {
        triggerInference();
    }
});

// Batch Log Generator (Expt 9 Table Mock/Real Logic)
runTestBtn.addEventListener('click', async () => {
    const testCases = [
        { f: [5.1, 3.5, 1.4, 0.2] }, // setosa
        { f: [6.7, 3.0, 5.2, 2.3] }, // virginica
        { f: [5.9, 3.0, 4.2, 1.5] }, // versicolor
    ];

    runTestBtn.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Running...`;

    for (let tc of testCases) {
        const tr = document.createElement('tr');
        const ts = new Date().toLocaleTimeString();
        tr.innerHTML = `
            <td>${ts}</td>
            <td style="font-family: monospace;">[${tc.f.join(', ')}]</td>
            <td><span class="status-badge" style="background:#4b5563; color:#fff"><i>Loading...</i></span></td>
            <td>-</td>
        `;
        logsBody.prepend(tr); // Insert at top

        const res = await fetchPrediction(tc.f);

        if (res && res.predicted_class) {
            tr.innerHTML = `
                <td>${ts}</td>
                <td style="font-family: monospace;">[${tc.f.join(', ')}]</td>
                <td><span style="font-weight: 600; text-transform: capitalize;">${res.predicted_class}</span></td>
                <td><span class="status-badge success">Success</span></td>
            `;
        } else {
            tr.innerHTML = `
                <td>${ts}</td>
                <td style="font-family: monospace;">[${tc.f.join(', ')}]</td>
                <td><span style="color:var(--danger)">Failed</span></td>
                <td><span class="status-badge error">${res.error || 'Err'}</span></td>
            `;
        }

        await new Promise(r => setTimeout(r, 600)); // artifical delay for visually pleasing table pop
    }

    runTestBtn.innerHTML = `<i class="ph ph-play"></i> Run Batch Test`;
});

// App Startup
initChart();
updateSliderValues();
triggerInference(); // Initial prediction
