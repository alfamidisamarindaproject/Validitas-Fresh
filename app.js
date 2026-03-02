let allData = [];
let updateQueue = [];

document.addEventListener('DOMContentLoaded', fetchData);

function fetchData() {
    toggleLoader(true);
    google.script.run.withSuccessHandler(data => {
        allData = data;
        renderCards(data);
        toggleLoader(false);
    }).getData();
}

function renderCards(data) {
    const container = document.getElementById('cardContainer');
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = `<div class="text-center mt-5 text-muted">Data tidak ditemukan</div>`;
        return;
    }

    data.forEach(item => {
        const statusClass = item.statusValidasi === 'OK' ? 'card-ok' : (item.statusValidasi === 'NOK' ? 'card-nok' : 'card-pending');
        const card = document.createElement('div');
        card.className = `card data-card ${statusClass}`;
        card.innerHTML = `
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <span class="badge bg-light text-dark mb-1 border">${item.toko}</span>
                        <h6 class="fw-bold mb-0">${item.nama}</h6>
                    </div>
                    <small class="text-muted">${item.timestamp}</small>
                </div>
                <p class="small text-muted mb-3"><i class="bi bi-tag"></i> Aktivitas: <strong>${item.aktivitas}</strong></p>
                
                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <button class="btn btn-outline-secondary btn-sm w-100 py-2 rounded-3" onclick="openImg('${item.fotoDisplay}')">🖼️ Display</button>
                    </div>
                    <div class="col-6">
                        <button class="btn btn-outline-secondary btn-sm w-100 py-2 rounded-3" onclick="openImg('${item.fotoStock}')">📦 Stock</button>
                    </div>
                </div>

                <div class="d-flex gap-2">
                    <button id="btn_ok_${item.rowNum}" class="btn btn-val w-100 ${item.statusValidasi === 'OK' ? 'btn-success' : 'btn-outline-success'}" 
                        onclick="queueStatus(${item.rowNum}, 'OK')">OK</button>
                    <button id="btn_nok_${item.rowNum}" class="btn btn-val w-100 ${item.statusValidasi === 'NOK' ? 'btn-danger' : 'btn-outline-danger'}" 
                        onclick="queueStatus(${item.rowNum}, 'NOK')">NOK</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function filterData() {
    const term = document.getElementById('searchTerm').value.toLowerCase();
    const filtered = allData.filter(item => 
        item.nama.toLowerCase().includes(term) || 
        item.toko.toLowerCase().includes(term)
    );
    renderCards(filtered);
}

function queueStatus(row, status) {
    const idx = updateQueue.findIndex(x => x.rowNum === row);
    if (idx > -1) updateQueue[idx].status = status;
    else updateQueue.push({ rowNum: row, status: status });

    // Update UI Feedback
    document.getElementById(`btn_ok_${row}`).className = `btn btn-val w-100 ${status === 'OK' ? 'btn-success' : 'btn-outline-success'}`;
    document.getElementById(`btn_nok_${row}`).className = `btn btn-val w-100 ${status === 'NOK' ? 'btn-danger' : 'btn-outline-danger'}`;

    document.getElementById('submitBar').style.display = 'block';
    document.getElementById('selectedCount').innerText = updateQueue.length;
}

function simpanData() {
    toggleLoader(true);
    google.script.run.withSuccessHandler(res => {
        alert(res);
        updateQueue = [];
        document.getElementById('submitBar').style.display = 'none';
        fetchData();
    }).updateValidation(updateQueue);
}

function openImg(url) {
    if(!url || url === "" || url === "undefined") return alert("Foto tidak tersedia");
    document.getElementById('imgPreview').src = url;
    new bootstrap.Modal(document.getElementById('fotoModal')).show();
}

function toggleLoader(show) {
    document.getElementById('loader').style.display = show ? 'flex' : 'none';
}
