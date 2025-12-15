lucide.createIcons();
Chart.defaults.font.family = "'Inter', sans-serif";

let allData = [];
let riskChartInst = null;
let ageRiskChartInst = null;

// Utilitário: Calcular Idade
const calculateAge = (dobString) => {
    if (!dobString) return 0;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

// 1. Processamento CSV
function processCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());

    const idx = {
        id: headers.indexOf('id_paciente'),
        dm: headers.indexOf('DM'),
        nasc: headers.indexOf('data_nascimento'),
        obesidade: headers.indexOf('obesidade'),
        tabagismo: headers.indexOf('tabagismo')
    };

    return lines.slice(1).map(line => {
        const row = line.split(',');
        const isDM = row[idx.dm]?.toLowerCase() === 'true';
        const isObese = row[idx.obesidade]?.toLowerCase() === 'true';
        const isSmoker = row[idx.tabagismo]?.toLowerCase() === 'true';
        const age = calculateAge(row[idx.nasc]);

        // Cálculo de Score de Risco
        let riskScore = 0;
        if (isDM) riskScore += 2;
        if (isObese) riskScore += 1;
        if (isSmoker) riskScore += 1;
        if (age > 60) riskScore += 1;

        return {
            id: row[idx.id] || 'N/A',
            isDM,
            isObese,
            isSmoker,
            age,
            riskScore
        };
    });
}

// 2. Atualizar UI
function updateUI() {
    const filterVal = document.getElementById('filter-risk').value;

    // Filtragem
    let filtered = allData;
    if (filterVal === 'high') {
        filtered = allData.filter(d => d.riskScore >= 3 && d.isDM);
    } else if (filterVal === 'smokers') {
        filtered = allData.filter(d => d.isSmoker);
    } else if (filterVal === 'obese') {
        filtered = allData.filter(d => d.isObese);
    }

    // Ordenar por risco (maior primeiro)
    filtered.sort((a, b) => b.riskScore - a.riskScore);

    // --- KPIs ---
    const dmOnly = allData.filter(d => d.isDM);
    document.getElementById('kpi-extreme').innerText = allData.filter(d => d.isDM && d.isObese && d.isSmoker).length;
    document.getElementById('kpi-obese-dm').innerText = dmOnly.filter(d => d.isObese).length;
    document.getElementById('kpi-smoker-dm').innerText = dmOnly.filter(d => d.isSmoker).length;
    document.getElementById('kpi-elderly').innerText = dmOnly.filter(d => d.age >= 60).length;

    // --- Gráficos ---
    updateCharts(allData);

    // --- Tabela ---
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    // Limitando a tabela aos top 50 para performance se lista for grande
    const displayList = filtered.slice(0, 100);

    if (displayList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">Nenhum paciente encontrado.</td></tr>`;
        return;
    }

    displayList.forEach(p => {
        // Tags
        let tags = [];
        if (p.isObese) tags.push('<span class="bg-pink-100 text-pink-800 text-xs px-2 py-0.5 rounded font-medium mr-1">Obesidade</span>');
        if (p.isSmoker) tags.push('<span class="bg-gray-200 text-gray-800 text-xs px-2 py-0.5 rounded font-medium mr-1">Tabagismo</span>');

        // Classificação Visual
        let riskLabel = '<span class="text-green-600 font-bold text-xs">Baixo</span>';
        if (p.riskScore >= 4) riskLabel = '<span class="bg-purple-100 text-purple-800 border border-purple-200 text-xs px-3 py-1 rounded-full font-bold">ALTO RISCO</span>';
        else if (p.riskScore >= 2) riskLabel = '<span class="bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs px-3 py-1 rounded-full font-bold">Moderado</span>';

        const tr = document.createElement('tr');
        tr.className = "bg-white border-b hover:bg-gray-50";
        tr.innerHTML = `
                    <td class="px-6 py-4 font-medium text-gray-900">${p.id.substring(0, 10)}...</td>
                    <td class="px-6 py-4">${p.age} anos</td>
                    <td class="px-6 py-4">
                        ${p.isDM ? '<span class="text-blue-700 font-bold">DM (Diabetes)</span>' : '<span class="text-gray-500">Pré-DM</span>'}
                    </td>
                    <td class="px-6 py-4">${tags.length > 0 ? tags.join('') : '-'}</td>
                    <td class="px-6 py-4 text-center">${riskLabel}</td>
                `;
        tbody.appendChild(tr);
    });
}

function updateCharts(data) {
    // Chart 1: Sobreposição (Bar Chart)
    const countOnlyDM = data.filter(d => d.isDM && !d.isObese && !d.isSmoker).length;
    const countDMObese = data.filter(d => d.isDM && d.isObese && !d.isSmoker).length;
    const countDMSmoker = data.filter(d => d.isDM && !d.isObese && d.isSmoker).length;
    const countAll = data.filter(d => d.isDM && d.isObese && d.isSmoker).length;

    if (riskChartInst) riskChartInst.destroy();
    riskChartInst = new Chart(document.getElementById('riskChart'), {
        type: 'bar',
        data: {
            labels: ['Apenas DM', 'DM + Obesidade', 'DM + Tabagismo', 'DM + Ambos'],
            datasets: [{
                label: 'Pacientes',
                data: [countOnlyDM, countDMObese, countDMSmoker, countAll],
                backgroundColor: ['#60a5fa', '#f472b6', '#94a3b8', '#9333ea'],
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });

    // Chart 2: Idade vs Risco (Stacked)
    const groups = ['0-39', '40-59', '60+'];
    const riskCounts = {
        '0-39': { low: 0, high: 0 },
        '40-59': { low: 0, high: 0 },
        '60+': { low: 0, high: 0 }
    };

    data.forEach(d => {
        let g = '60+';
        if (d.age < 40) g = '0-39';
        else if (d.age < 60) g = '40-59';

        if (d.riskScore >= 3) riskCounts[g].high++;
        else riskCounts[g].low++;
    });

    if (ageRiskChartInst) ageRiskChartInst.destroy();
    ageRiskChartInst = new Chart(document.getElementById('ageRiskChart'), {
        type: 'bar',
        data: {
            labels: groups,
            datasets: [
                { label: 'Risco Elevado', data: groups.map(g => riskCounts[g].high), backgroundColor: '#9333ea' },
                { label: 'Risco Padrão', data: groups.map(g => riskCounts[g].low), backgroundColor: '#e2e8f0' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { stacked: true }, y: { stacked: true } }
        }
    });
}

// Eventos
document.getElementById('csv-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            allData = processCSV(evt.target.result);
            updateUI();
        };
        reader.readAsText(file);
    }
});

document.getElementById('filter-risk').addEventListener('change', updateUI);

// Amostra inicial
const SAMPLE = `id_paciente,DM,data_nascimento,obesidade,tabagismo
1,true,1950-01-01,true,true
2,true,1980-05-05,false,true
3,true,1990-10-10,true,false
4,false,2000-01-01,false,false
5,true,1945-12-12,false,false`;

allData = processCSV(SAMPLE);
updateUI();
