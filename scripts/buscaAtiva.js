lucide.createIcons();
document.getElementById('print-date').innerText = `Gerado em: ${new Date().toLocaleDateString()}`;

let allData = [];

// 1. Processar CSV (Mesma lógica do Dashboard)
function processCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());

    const idx = {
        clinica: headers.indexOf('clinica_familia'),
        esf: headers.indexOf('ESF'),
        id: headers.indexOf('id_paciente'),
        dm: headers.indexOf('DM'),
        dias_med: headers.indexOf('dias_ultima_medica'),
        dias_enf: headers.indexOf('dias_ultima_enfermagem'),
        obesidade: headers.indexOf('obesidade'),
        tabagismo: headers.indexOf('tabagismo')
    };

    return lines.slice(1).map(line => {
        const row = line.split(',');
        const diasMed = parseInt(row[idx.dias_med]) || 999;
        const diasEnf = parseInt(row[idx.dias_enf]) || 999;

        return {
            id: row[idx.id] || 'Desconhecido',
            clinica: row[idx.clinica],
            esf: row[idx.esf],
            isDM: row[idx.dm]?.toLowerCase() === 'true',
            lastSeen: Math.min(diasMed, diasEnf), // Menor tempo entre med/enf
            isObese: row[idx.obesidade]?.toLowerCase() === 'true',
            isSmoker: row[idx.tabagismo]?.toLowerCase() === 'true'
        };
    });
}

// 2. Atualizar Filtro de Equipe
function updateEsfFilter(data) {
    const esfs = [...new Set(data.map(d => d.esf))].sort().filter(Boolean);
    const selEsf = document.getElementById('filter-esf');
    selEsf.innerHTML = '<option value="all">Todas as Equipes</option>';
    esfs.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e; opt.innerText = e;
        selEsf.appendChild(opt);
    });
}

// 3. Renderizar Tabela
function updateTable() {
    const delayThreshold = parseInt(document.getElementById('filter-delay').value);
    const esfVal = document.getElementById('filter-esf').value;

    // Filtrar apenas quem está atrasado ACIMA do limite escolhido
    const filtered = allData.filter(d => {
        const matchEsf = esfVal === 'all' || d.esf === esfVal;
        const matchDelay = d.lastSeen >= delayThreshold;
        return matchEsf && matchDelay;
    });

    // Ordenar: Quem tem mais dias de atraso aparece primeiro (urgência)
    filtered.sort((a, b) => b.lastSeen - a.lastSeen);

    // Atualizar contadores
    document.getElementById('count-list').innerText = filtered.length;
    document.getElementById('count-warning').innerText = filtered.filter(d => d.lastSeen >= 120 && d.lastSeen < 365).length;
    document.getElementById('count-critical').innerText = filtered.filter(d => d.lastSeen >= 365).length;

    // Construir HTML da tabela
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">Nenhum paciente encontrado com estes critérios.</td></tr>`;
        return;
    }

    filtered.forEach(p => {
        // Definir cor do badge de status
        let statusClass = 'bg-yellow-100 text-yellow-800';
        let statusText = 'Atenção';

        if (p.lastSeen > 365) {
            statusClass = 'bg-gray-100 text-gray-800';
            statusText = 'Abandono Provisório';
        } else if (p.lastSeen > 180) {
            statusClass = 'bg-red-100 text-red-800';
            statusText = 'Crítico';
        }

        // Tags de risco
        let tags = [];
        if (p.isDM) tags.push(`<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-1">DM</span>`);
        if (p.isObese) tags.push(`<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mr-1">Obeso</span>`);
        if (p.isSmoker) tags.push(`<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-1">Fumante</span>`);

        const tr = document.createElement('tr');
        tr.className = 'bg-white border-b hover:bg-gray-50';
        tr.innerHTML = `
                    <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">${p.id.substring(0, 8)}...</td>
                    <td class="px-6 py-4">
                        <div class="text-sm font-bold text-gray-700">${p.esf}</div>
                        <div class="text-xs text-gray-500">${p.clinica}</div>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="text-lg font-bold ${p.lastSeen > 180 ? 'text-red-600' : 'text-yellow-600'}">${p.lastSeen}</span>
                        <span class="text-xs text-gray-500 block">dias</span>
                    </td>
                    <td class="px-6 py-4">${tags.length > 0 ? tags.join('') : '-'}</td>
                    <td class="px-6 py-4 text-center">
                        <span class="${statusClass} text-xs font-medium px-2.5 py-0.5 rounded border border-current opacity-80">${statusText}</span>
                    </td>
                `;
        tbody.appendChild(tr);
    });
}

// Event Listeners
document.getElementById('csv-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            allData = processCSV(evt.target.result);
            updateEsfFilter(allData);
            updateTable();
        };
        reader.readAsText(file);
    }
});

document.getElementById('filter-delay').addEventListener('change', updateTable);
document.getElementById('filter-esf').addEventListener('change', updateTable);

// Dados de Amostra para teste inicial
const SAMPLE_CSV_DATA = `cod_area,clinica_familia,ESF,id_paciente,DM,pre_DM,data_nascimento,genero,raca,dias_ultima_medica,dias_ultima_enfermagem,obesidade,tabagismo
5.1,CF Rosino Baccarini,06 de Novembro,1a2b3c4d,true,false,1960,M,branca,400,380,true,false
5.1,CF Rosino Baccarini,06 de Novembro,5e6f7g8h,true,false,1975,F,parda,150,140,false,true
2.1,CF Santa Marta,Zumbi,9i0j1k2l,false,true,1980,M,preta,190,200,true,true
2.1,CF Santa Marta,Zumbi,3m4n5o6p,true,true,1950,F,branca,10,15,false,false`;

// Carregar amostra ao abrir
allData = processCSV(SAMPLE_CSV_DATA);
updateEsfFilter(allData);
updateTable();

