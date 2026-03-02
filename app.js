let queueUpdate = [];

// Inisialisasi awal
document.addEventListener('DOMContentLoaded', fetchData);

function fetchData() {
    toggleLoading(true);
    google.script.run.withSuccessHandler(renderTable).getData();
}

function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada data ditemukan.</td></tr>';
        toggleLoading(false);
        return;
    }

    data.forEach(row => {
        const tr = document.createElement('tr');
        const badgeColor = row.statusValidasi === 'OK' ? 'bg-success' : (row.statusValidasi === 'NOK' ? 'bg-danger' : 'bg-secondary');
        
        tr.innerHTML = `
            <td><small>${row.timestamp}</small></td>
            <td><strong>${row.nama}</strong><br><small class="text-muted">${row.toko}</small></td>
            <td><span class="fresh-badge">${row.aktivitas}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary mb-1" onclick="viewImage('${row.fotoDisplay}')">🖼️ Display</button>
                <button class="btn btn-sm btn-outline-info mb-1" onclick="viewImage('${row.fotoStock}')">📦 Stock</button>
            </td>
            <td class="text-center"><span class="badge ${badgeColor}">${row.statusValidasi || 'BELUM'}</span></td>
            <td class="text-center">
                <div class="btn-group btn-group-sm">
                    <input type="radio" class="btn-check" name="row_${row.rowNum}" id="ok_${row.rowNum}" onchange="prepareUpdate(${row.rowNum}, 'OK')">
                    <label class="btn btn-outline-success" for="ok_${row.rowNum}">OK</label>
                    
                    <input type="radio" class="btn-check" name="row_${row.rowNum}" id="nok_${row.rowNum}" onchange="prepareUpdate(${row.rowNum}, 'NOK')">
                    <label class="btn btn-outline-danger" for="nok_${row.rowNum}">NOK</label>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    toggleLoading(false);
}

function prepareUpdate(rowNum, status) {
    const idx = queueUpdate.findIndex(x => x.rowNum === rowNum);
    if (idx > -1) {
        queueUpdate[idx].status = status;
    } else {
        queueUpdate.push({ rowNum, status });
    }
    
    document.getElementById('submitBar').style.display = 'block';
    document.getElementById('countSelected').innerText = queueUpdate.length;
}

function kirimData() {
    toggleLoading(true);
    google.script.run.withSuccessHandler(response => {
        alert(response);
        queueUpdate = [];
        document.getElementById('submitBar').style.display = 'none';
        fetchData(); // Refresh data setelah simpan
    }).updateValidation(queueUpdate);
}

function viewImage(url) {
    if (!url || url === "" || url === "undefined") return alert("Link foto tidak tersedia");
    document.getElementById('frameFoto').src = url;
    const modal = new bootstrap.Modal(document.getElementById('modalFoto'));
    modal.show();
}

function toggleLoading(show) {
    document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
}
