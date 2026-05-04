// 1. COLOCA AQUÍ TU URL DE GOOGLE APPS SCRIPT
const CLOUD_URL = "https://script.google.com/macros/s/AKfycbwdQXtIBwLBnwfEtN-FJlgA5brmCeDuBNKyTKKLUx2HjWMTRJXKHOKkwpKRUlB_2b_K/exec"; 

const ICONS = ['🏠', '🚗', '🍔', '🛒', '💊', '🎬', '🎧', '📱', '👕', '💡', '🐾', '✈️', '🎁', '🏋️', '📚', '💸', '🏦', '⚡', '📶', '🔥', '🍕', '💻', '💼', '🧼'];

let state = {
    expenses: [
        { icon: "🏠", cat: "Compra casa", monto: 4000, dist: 50 },
        { icon: "🎬", cat: "Netflix", monto: 630, dist: 0 },
        { icon: "🎧", cat: "Spotify", monto: 440, dist: 0 },
        { icon: "🍔", cat: "Alimentación", monto: 8000, dist: 50 }
    ],
    sueldoQ1: 18000,
    sueldoQ2: 18000,
    darkMode: false,
    activeRow: null
};

let pieChart = null;

async function init() {
    const saved = localStorage.getItem('yahir_budget_data');
    if (saved) {
        state = JSON.parse(saved);
        updateUI();
    }
    
    if (CLOUD_URL !== "TU_URL_DE_APPS_SCRIPT_AQUI") {
        try {
            const res = await fetch(CLOUD_URL);
            const cloudData = await res.json();
            if (cloudData) {
                state = cloudData;
                updateUI();
                showToast("☁️ Datos sincronizados");
            }
        } catch (e) { console.log("Modo local activo"); }
    }
}

function updateUI() {
    document.getElementById('sueldoQ1').value = state.sueldoQ1;
    document.getElementById('sueldoQ2').value = state.sueldoQ2;
    document.getElementById('inputTotalMensual').value = state.sueldoQ1 + state.sueldoQ2;
    
    document.body.classList.toggle('dark-mode', state.darkMode);
    document.getElementById('mode-text').innerText = state.darkMode ? 'Modo Noche' : 'Modo Claro';
    render();
}

function saveAndRefresh() {
    state.sueldoQ1 = parseFloat(document.getElementById('sueldoQ1').value) || 0;
    state.sueldoQ2 = parseFloat(document.getElementById('sueldoQ2').value) || 0;
    localStorage.setItem('yahir_budget_data', JSON.stringify(state));
    render();
}

function updateFromTotal(val) {
    const total = parseFloat(val) || 0;
    state.sueldoQ1 = total / 2;
    state.sueldoQ2 = total / 2;
    document.getElementById('sueldoQ1').value = state.sueldoQ1;
    document.getElementById('sueldoQ2').value = state.sueldoQ2;
    saveAndRefresh();
}

function render() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    state.expenses.forEach((item, i) => {
        const q1 = item.monto * (item.dist / 100);
        const q2 = item.monto - q1;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="p-5">
                <div class="flex items-center gap-3">
                    <div onclick="openIconPicker(${i})" class="icon-circle cursor-pointer hover:scale-105 transition-transform">${item.icon}</div>
                    <input type="text" value="${item.cat}" class="bg-transparent font-bold focus:outline-none w-full" onchange="updateExp(${i}, 'cat', this.value)">
                </div>
            </td>
            <td class="p-5">
                <div class="flex items-center text-sm font-black bg-custom-input px-3 py-2 rounded-xl w-fit">
                    <span class="text-blue-500 mr-1">$</span>
                    <input type="number" value="${item.monto}" class="bg-transparent w-16 focus:outline-none" oninput="updateExp(${i}, 'monto', this.value)">
                </div>
            </td>
            <td class="p-5 text-center">
                <input type="range" min="0" max="100" step="25" value="${item.dist}" class="w-full h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer" oninput="updateExp(${i}, 'dist', this.value)">
            </td>
            <td class="p-5 text-right text-xs font-bold opacity-60">$${Math.round(q1).toLocaleString()}</td>
            <td class="p-5 text-right text-xs font-bold opacity-60">$${Math.round(q2).toLocaleString()}</td>
            <td class="p-5 text-center">
                <button onclick="delRow(${i})" class="text-rose-400 hover:text-rose-600 transition-colors">✕</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    updateAnalytics();
}

function updateExp(i, field, val) {
    state.expenses[i][field] = (field === 'monto' || field === 'dist') ? parseFloat(val) || 0 : val;
    localStorage.setItem('yahir_budget_data', JSON.stringify(state));
    updateAnalytics(); 
}

function updateAnalytics() {
    const totalIngreso = state.sueldoQ1 + state.sueldoQ2;
    let sumTotal = 0;
    let sumQ1 = 0;

    state.expenses.forEach(e => {
        sumTotal += e.monto;
        sumQ1 += (e.monto * (e.dist / 100));
    });

    const sumQ2 = sumTotal - sumQ1;
    const ahorroTotal = totalIngreso - sumTotal;
    const porcAhorro = totalIngreso > 0 ? (ahorroTotal / totalIngreso) * 100 : 0;

    // --- CÁLCULOS Q1 ---
    const restoQ1 = state.sueldoQ1 - sumQ1;
    const cargaQ1 = state.sueldoQ1 > 0 ? (sumQ1 / state.sueldoQ1) * 100 : 0;
    document.getElementById('gastoQ1Text').innerText = `$${Math.round(sumQ1).toLocaleString()}`;
    document.getElementById('ahorroQ1').innerText = `$${Math.round(restoQ1).toLocaleString()}`;
    document.getElementById('barQ1').style.width = `${Math.min(100, cargaQ1)}%`;
    document.getElementById('cargaQ1Perc').innerText = `${Math.round(cargaQ1)}%`;

    // --- CÁLCULOS Q2 ---
    const restoQ2 = state.sueldoQ2 - sumQ2;
    const cargaQ2 = state.sueldoQ2 > 0 ? (sumQ2 / state.sueldoQ2) * 100 : 0;
    document.getElementById('gastoQ2Text').innerText = `$${Math.round(sumQ2).toLocaleString()}`;
    document.getElementById('ahorroQ2').innerText = `$${Math.round(restoQ2).toLocaleString()}`;
    document.getElementById('barQ2').style.width = `${Math.min(100, cargaQ2)}%`;
    document.getElementById('cargaQ2Perc').innerText = `${Math.round(cargaQ2)}%`;

    // --- CARD PRINCIPAL ---
    document.getElementById('totalAhorro').innerText = `$${Math.round(ahorroTotal).toLocaleString()}`;
    document.getElementById('ahorroPorcentaje').innerText = `${Math.round(porcAhorro)}% del total`;
    document.getElementById('ahorroCard').style.backgroundColor = ahorroTotal < 0 ? '#ef4444' : '#10b981';
    document.getElementById('percEfect').innerText = `${Math.round(porcAhorro)}%`;
    document.getElementById('statusText').innerText = ahorroTotal < 0 ? 'Déficit' : 'Saludable';

    updateChart(sumQ1, sumQ2, Math.max(0, ahorroTotal));
}

function updateChart(q1, q2, a) {
    const ctx = document.getElementById('mainPieChart').getContext('2d');
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [q1, q2, a],
                backgroundColor: ['#3b82f6', '#6366f1', '#10b981'],
                borderWidth: 0
            }]
        },
        options: { cutout: '80%', plugins: { legend: { display: false } } }
    });
}

async function exportAll() {
    localStorage.setItem('yahir_budget_data', JSON.stringify(state));
    showToast("💾 Guardando...");
    if (CLOUD_URL !== "TU_URL_DE_APPS_SCRIPT_AQUI") {
        try {
            await fetch(CLOUD_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(state)
            });
            showToast("✅ Sincronizado");
        } catch (e) { showToast("❌ Error Nube"); }
    }
}

function addNewRow() {
    state.expenses.unshift({ icon: "💸", cat: "Nuevo Gasto", monto: 0, dist: 50 });
    render();
}

function delRow(i) {
    state.expenses.splice(i, 1);
    saveAndRefresh();
}

function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    updateUI();
    saveAndRefresh();
}

function downloadCode() {
    const htmlContent = document.documentElement.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'backup_yahir_rd.txt';
    a.click();
}

function openIconPicker(i) {
    state.activeRow = i;
    const grid = document.getElementById('iconGrid');
    grid.innerHTML = '';
    ICONS.forEach(icon => {
        const b = document.createElement('button');
        b.className = "text-xl p-2 hover:bg-black/5 rounded-lg";
        b.innerText = icon;
        b.onclick = () => {
            state.expenses[state.activeRow].icon = icon;
            render();
            closeIconPicker();
        };
        grid.appendChild(b);
    });
    document.getElementById('iconPicker').classList.remove('hidden');
}

function closeIconPicker() { document.getElementById('iconPicker').classList.add('hidden'); }

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

window.onload = init;