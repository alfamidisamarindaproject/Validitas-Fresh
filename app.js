const URL_WEB_APP = "https://script.google.com/macros/s/AKfycbyfi9FPzTQx2pcOR5NFovDHs4r6j1QCGnMagBa9i3FVQcsOsX3984t1prReuRD-BAfF/exec";

let allDataRaw = [];
let queue = [];

window.onload = fetchData;

// 1. MENGAMBIL DATA DARI GSHEET
async function fetchData() {
    toggleLoading(true);
    queue = [];
    updateSubmitBar();
    try {
        const response = await fetch(URL_WEB_APP);
        const data = await response.json();
        // Memastikan data yang diterima adalah array
        allDataRaw = Array.isArray(data) ? data : [];
        renderTable(allDataRaw);
    } catch (err) {
        console.error(err);
        // Memperbaiki id dari tableBody ke cardContainer
        document.getElementById('cardContainer').innerHTML = '<div class="text-center text-danger py-5 fw-bold">Gagal terhubung ke GSheet. Pastikan URL Web App sudah benar dan sudah di-deploy.</div>';
    } finally {
        toggleLoading(false);
    }
}

// 2. MERENDER DATA KE HTML SEBAGAI CARD
function renderTable(data) {
    const container = document.getElementById('cardContainer');
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<div class="text-center py-5 fw-bold text-muted">Tidak ada data ditemukan. ✅</div>';
        return;
    }

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'data-card shadow-sm';
        card.innerHTML = `
            <div class="card-header-custom">
                <div>
                    <span class="badge bg-success mb-1">${item.toko}</span>
                    <h6 class="fw-bold mb-0 text-dark">${item.nama}</h6>
                </div>
                <small class="text-muted" style="font-size:0.7rem;">${item.timestamp}</small>
            </div>
            <div class="p-3">
                <div class="mb-3">
                    ${parseChecklist(item.aktivitas)}
                </div>
                <div class="row g-2 mb-3">
                    <div class="col-6">
                        <button class="btn btn-sm btn-outline-primary w-100 fw-bold" onclick="bukaPopup('${item.fotoDisplay}')">
                            <i class="bi bi-image"></i> Foto Display
                        </button>
                    </div>
                    <div class="col-6">
                        <button class="btn btn-sm btn-outline-info w-100 fw-bold text-dark" onclick="bukaPopup('${item.fotoStock}')">
                            <i class="bi bi-box-seam"></i> Foto Stock
                        </button>
                    </div>
                </div>
            </div>
            <div class="validation-area">
                <div class="row text-center">
                    <div class="col-6">
                        <input type="checkbox" class="cb-ok" name="row-${item.row}" onclick="handleQueue(${item.row}, 'OK', this)">
                        <div class="val-label text-success">VALID (OK)</div>
                    </div>
                    <div class="col-6">
                        <input type="checkbox" class="cb-nok" name="row-${item.row}" onclick="handleQueue(${item.row}, 'NOK', this)">
                        <div class="val-label text-danger">NOT OK (NOK)</div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// 3. PARSING CHECKLIST FRESH (Culling, Trimming, Crisping)
function parseChecklist(txt) {
    if (!txt) return '<span class="text-muted">Data Kosong</span>';
    
    const categories = [
        { key: "CULLING", label: "Culling" },
        { key: "TRIMMING", label: "Trimming" },
        { key: "CRISPING", label: "Crisping" }
    ];

    let html = '<div class="checklist-box">';
    categories.forEach(cat => {
        // Regex untuk mencari kata kunci kategori yang diikuti kata OK
        const regex = new RegExp(`${cat.key}\\s+OK`, 'i');
        const isOK = regex.test(txt);
        
        html += `
            <div class="checklist-item">
                <span class="fw-bold" style="font-size:0.7rem;">${cat.label}</span>
                <span class="status-pill ${isOK ? 'status-ok' : 'status-nok'}">
                    ${isOK ? '✔ OK' : '✖ NOK'}
                </span>
            </div>`;
    });
    return html + '</div>';
}

// 4. LOGIKA PEMILIHAN (OK/NOK)
function handleQueue(rowId, status, el) {
    // Memastikan hanya satu checkbox yang terpilih per baris (OK atau NOK)
    const rowGroup = document.getElementsByName(`row-${rowId}`);
    rowGroup.forEach(cb => { if(cb !== el) cb.checked = false; });
    
    // Update antrian data yang akan dikirim
    queue = queue.filter(q => q.row !== rowId);
    if (el.checked) {
        queue.push({ row: rowId, status: status });
    }
    updateSubmitBar();
}

function updateSubmitBar() {
    const bar = document.getElementById('submitBar');
    const countEl = document.getElementById('countSelected');
    if(countEl) countEl.innerText = queue.length;
    if(bar) bar.style.display = queue.length > 0 ? 'block' : 'none';
}

// 5. MENGIRIM DATA KE GSHEET (KOLOM G)
async function kirimData() {
    if (!confirm(`Simpan validasi Kolom G untuk ${queue.length} data ini?`)) return;
    
    toggleLoading(true);
    try {
        await fetch(URL_WEB_APP, {
            method: 'POST',
            mode: 'no-cors', // Menghindari isu CORS pada Apps Script
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queue)
        });
        
        // Karena no-cors, kita beri delay sedikit sebelum refresh UI
        setTimeout(() => {
            alert("Validasi Berhasil Disimpan ke Kolom G!");
            fetchData();
        }, 1500);
    } catch (e) {
        console.error(e);
        alert("Terjadi kesalahan saat mengirim data.");
        toggleLoading(false);
    }
}

// 6. POPUP PREVIEW FOTO
function bukaPopup(url, title = "Preview Foto") {
    if(!url || url.length < 10) return alert("Link foto tidak valid atau kosong!");
    
    const modalEl = document.getElementById('modalFoto');
    const imgEl = document.getElementById('frameFoto');
    const loadEl = document.getElementById('loadingGambar');
    const myModal = new bootstrap.Modal(modalEl);

    // Konversi link Drive agar bisa dirender sebagai gambar langsung
    let finalUrl = url;
    if (url.includes('drive.google.com')) {
        const fileId = url.split('/d/')[1]?.split('/')[0] || url.split('id=')[1]?.split('&')[0];
        finalUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }

    imgEl.style.display = 'none';
    if(loadEl) loadEl.style.display = 'block';
    
    imgEl.src = finalUrl;
    myModal.show();
    
    imgEl.onload = () => {
        if(loadEl) loadEl.style.display = 'none';
        imgEl.style.display = 'inline-block';
    };
}

function toggleLoading(show) {
    const loader = document.getElementById('loading-overlay');
    if(loader) loader.style.display = show ? 'flex' : 'none';
}

// 7. FILTER PENCARIAN
if(document.getElementById('inputNama')) document.getElementById('inputNama').oninput = runFilter;
if(document.getElementById('inputToko')) document.getElementById('inputToko').oninput = runFilter;
if(document.getElementById('inputTanggal')) document.getElementById('inputTanggal').onchange = runFilter;

function runFilter() {
    const n = document.getElementById('inputNama').value.toLowerCase();
    const t = document.getElementById('inputToko').value.toLowerCase();
    const dRaw = document.getElementById('inputTanggal').value; // Mengambil YYYY-MM-DD
    
    // Konversi format tanggal YYYY-MM-DD (dari HTML) menjadi DD/MM/YYYY (dari GS)
    let dFormatted = "";
    if (dRaw) {
        const parts = dRaw.split('-');
        dFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`; 
    }
    
    const filtered = allDataRaw.filter(i => {
        const matchNama = i.nama.toLowerCase().includes(n);
        const matchToko = i.toko.toLowerCase().includes(t);
        const matchDate = (dFormatted === "" || i.timestamp.includes(dFormatted));
        return matchNama && matchToko && matchDate;
    });
    renderTable(filtered);
}
