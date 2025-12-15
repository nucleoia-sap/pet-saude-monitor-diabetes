// Inicializa ícones
lucide.createIcons();

// Variáveis Globais para os Gráficos
let chartRecency = null;
let chartRace = null;
let allData = [];

// DADOS DE EXEMPLO (Baseados na estrutura do seu CSV para visualização inicial)
const SAMPLE_CSV_DATA = `cod_area,clinica_familia,ESF,id_paciente,DM,pre_DM,data_nascimento,genero,raca,dias_ultima_medica,dias_ultima_enfermagem,obesidade,tabagismo
5.1,CF Rosino Baccarini,06 de Novembro,1,true,false,1960-01-01,masculino,branca,150,20,true,false
5.1,CF Rosino Baccarini,06 de Novembro,2,true,false,1975-05-12,feminino,parda,30,10,false,true
5.1,CF Rosino Baccarini,06 de Novembro,3,false,true,1980-08-20,masculino,preta,200,200,true,true
2.1,CF Santa Marta,Zumbi,4,true,true,1950-02-15,feminino,branca,10,15,false,false
2.1,CF Santa Marta,Zumbi,5,true,false,1990-11-11,masculino,parda,400,380,false,false
2.1,CF Santa Marta,Zumbi,6,false,true,2000-01-01,feminino,preta,5,5,true,false
3.1,CF Estacio,Alpha,7,true,false,1955-06-06,masculino,amarela,60,60,false,true
3.1,CF Estacio,Alpha,8,true,false,1948-12-12,feminino,branca,185,100,false,false`;

// 1. Função para Processar CSV
function processCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());

    // Mapeamento de índices das colunas (para robustez)
    const idx = {
        clinica: headers.indexOf('clinica_familia'),
        esf: headers.indexOf('ESF'),
        dm: headers.indexOf('DM'),
        pre_dm: headers.indexOf('pre_DM'),
        dias_med: headers.indexOf('dias_ultima_medica'),
        dias_enf: headers.indexOf('dias_ultima_enfermagem'),
        raca: headers.indexOf('raca'),
        obesidade: headers.indexOf('obesidade'),
        tabagismo: headers.indexOf('tabagismo')
    };

    const data = lines.slice(1).map(line => {
        // Regex simples para lidar com vírgulas (assumindo CSV padrão sem aspas complexas)
        const row = line.split(',');

        // Tratar dados
        const diasMed = parseInt(row[idx.dias_med]) || 999;
        const diasEnf = parseInt(row[idx.dias_enf]) || 999;
        // Consideramos a última consulta a MENOR data entre médico e enf
        const lastSeen = Math.min(diasMed, diasEnf);

        return {
            clinica: row[idx.clinica],
            esf: row[idx.esf],
            isDM: row[idx.dm].toLowerCase() === 'true',
            isPreDM: row[idx.pre_dm].toLowerCase() === 'true',
            raca: row[idx.raca] || 'Não Informado',
            lastSeen: lastSeen,
            isObese: row[idx.obesidade].toLowerCase() === 'true',
            isSmoker: row[idx.tabagismo].toLowerCase() === 'true'
        };
    });

    return data;
}

// 2. Atualizar Dropdowns de Filtro
function updateFilters(data) {
    const clinicas = [...new Set(data.map(d => d.clinica))].sort();
    const esfs = [...new Set(data.map(d => d.esf))].sort();

    const selClinica = document.getElementById('filter-clinica');
    const selEsf = document.getElementById('filter-esf');

    // Limpa atuais mantendo a opção "Todos"
    selClinica.innerHTML = '<option value="all">Todas as Unidades</option>';
    selEsf.innerHTML = '<option value="all">Todas as Equipes</option>';

    clinicas.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.innerText = c;
        selClinica.appendChild(opt);
    });

    esfs.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e; opt.innerText = e;
        selEsf.appendChild(opt);
    });
}

// 3. Atualizar Dashboard
function updateDashboard() {
    const clinicaVal = document.getElementById('filter-clinica').value;
    const esfVal = document.getElementById('filter-esf').value;

    // Filtragem
    const filtered = allData.filter(d => {
        return (clinicaVal === 'all' || d.clinica === clinicaVal) &&
            (esfVal === 'all' || d.esf === esfVal);
    });

    // --- Cálculos de KPI ---
    const total = filtered.length;
    const dm = filtered.filter(d => d.isDM).length;
    const preDm = filtered.filter(d => d.isPreDM).length;
    // Busca ativa: quem não vai há mais de 180 dias (6 meses)
    const atrasados = filtered.filter(d => d.lastSeen > 180).length;

    const obesePerc = total ? Math.round((filtered.filter(d => d.isObese).length / total) * 100) : 0;
    const smokerPerc = total ? Math.round((filtered.filter(d => d.isSmoker).length / total) * 100) : 0;

    // DOM Updates - KPIs
    document.getElementById('kpi-total').innerText = total.toLocaleString();
    document.getElementById('kpi-dm').innerText = dm.toLocaleString();
    document.getElementById('kpi-predm').innerText = preDm.toLocaleString();
    document.getElementById('kpi-atrasados').innerText = atrasados.toLocaleString();

    // DOM Updates - Bars
    document.getElementById('val-obesidade').innerText = obesePerc + '%';
    document.getElementById('bar-obesidade').style.width = obesePerc + '%';
    document.getElementById('val-tabagismo').innerText = smokerPerc + '%';
    document.getElementById('bar-tabagismo').style.width = smokerPerc + '%';

    // --- Chart 1: Recência (Histograma de Dias) ---
    const bins = {
        '0-30 dias': 0,
        '31-120 dias': 0,
        '121-180 dias': 0,
        '> 180 dias': 0
    };

    filtered.forEach(d => {
        if (d.lastSeen <= 30) bins['0-30 dias']++;
        else if (d.lastSeen <= 120) bins['31-120 dias']++;
        else if (d.lastSeen <= 180) bins['121-180 dias']++;
        else bins['> 180 dias']++;
    });

    if (chartRecency) chartRecency.destroy();
    const ctxRecency = document.getElementById('recencyChart').getContext('2d');
    chartRecency = new Chart(ctxRecency, {
        type: 'bar',
        data: {
            labels: Object.keys(bins),
            datasets: [{
                label: 'Pacientes',
                data: Object.values(bins),
                backgroundColor: ['#4ade80', '#60a5fa', '#fbbf24', '#f87171'], // Verde, Azul, Amarelo, Vermelho
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { borderDash: [5, 5] } }, x: { grid: { display: false } } }
        }
    });

    // --- Chart 2: Raça/Cor ---
    const raceCounts = {};
    filtered.forEach(d => {
        const r = d.raca || 'Não Informado';
        raceCounts[r] = (raceCounts[r] || 0) + 1;
    });

    if (chartRace) chartRace.destroy();
    const ctxRace = document.getElementById('raceChart').getContext('2d');
    chartRace = new Chart(ctxRace, {
        type: 'doughnut',
        data: {
            labels: Object.keys(raceCounts),
            datasets: [{
                data: Object.values(raceCounts),
                backgroundColor: ['#3730a3', '#ec4899', '#6366f1', '#a5b4fc', '#e0e7ff'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } }
        }
    });
}

// --- Event Listeners ---
document.getElementById('csv-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            allData = processCSV(evt.target.result);
            updateFilters(allData);
            updateDashboard();
            document.getElementById('filename-display').innerText = file.name;
        };
        reader.readAsText(file);
    }
});

document.getElementById('filter-clinica').addEventListener('change', updateDashboard);
document.getElementById('filter-esf').addEventListener('change', updateDashboard);

// Inicialização com dados de amostra
window.addEventListener('load', () => {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#64748b';

    allData = processCSV(SAMPLE_CSV_DATA);
    updateFilters(allData);
    updateDashboard();
});