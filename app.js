const URL_WEB_APP = "https://script.google.com/macros/s/AKfycbyfi9FPzTQx2pcOR5NFovDHs4r6j1QCGnMagBa9i3FVQcsOsX3984t1prReuRD-BAfF/exec";

let allDataRaw = [];
let queue = [];

window.onload = fetchData;

// 1. MENGAMBIL DATA
async function fetchData() {
    toggleLoading(true);
    queue = [];
    updateSubmitBar();
    try {
        const response = await fetch(URL_WEB_APP);
        const data = await response.json();
        allDataRaw = Array.isArray(data) ? data : [];
        renderTable(allDataRaw);
    } catch (err) {
        console.error(err);
        document.getElementById('cardContainer').innerHTML = '<div class="text-center text-danger py-5 fw-bold">Gagal terhubung ke GSheet. Pastikan URL Web App benar.</div>';
    } finally {
        toggleLoading(false);
    }
}

// 2. MERENDER DATA DENGAN DESAIN "COMPACT CARD" (Hemat Layar)
function renderTable(data) {
    const container = document.getElementById('cardContainer');
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<div class="text-center py-5 fw-bold text-muted">🎉 Tidak ada data tersisa untuk divalidasi.</div>';
        return;
    }

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'data-card';
        card.innerHTML = `
            <div class="p-2 p-md-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <div class="d-flex align-items-center gap-2" style="overflow: hidden;">
                        <span class="badge bg-success">${item.toko}</span>
                        <span class="fw-bold text-dark text-truncate" style="max-width: 160px; font-size: 0.9rem;">${item.nama}</span>
                    </div>
                    <small class="text-muted text-end flex-shrink-0 ms-2" style="font-size: 0.7rem;">${item.timestamp}</small>
                </div>
                
                <div class="mb-2">
                    ${parseChecklistCompact(item.aktivitas)}
                </div>

                <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                    <div class="btn-group shadow-sm">
                        <button class="btn btn-sm btn-outline-secondary py-1 px-2" onclick="bukaPopup('${item.fotoDisplay}')" title="Foto Display">
                            <i class="bi bi-image"></i><span class="ms-1" style="font-size: 0.75rem;">Disp</span>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary py-1 px-2" onclick="bukaPopup('${item.fotoStock}')" title="Foto Stock">
                            <i class="bi bi-box-seam"></i><span class="ms-1" style="font-size: 0.75rem;">Stck</span>
                        </button>
                    </div>

                    <div class="btn-group shadow-sm" style="min-width: 130px;">
                        <input type="checkbox" class="btn-check" name="row-${item.row}" id="ok-${item.row}" onclick="handleQueue(${item.row}, 'OK', this)">
                        <label class="btn btn-outline-success btn-sm fw-bold m-0 py-1" for="ok-${item.row}">OK</label>

                        <input type="checkbox" class="btn-check" name="row-${item.row}" id="nok-${item.row}" onclick="handleQueue(${item.row}, 'NOK', this)">
                        <label class="btn btn-outline-danger btn-sm fw-bold m-0 py-1" for="nok-${item.row}">NOK</label>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// 3. PARSER CHECKLIST MINI (Sangat Menghemat Tempat)
unction parseChecklistCompact(txt) {
    // Jika kolom benar-benar kosong
    if (!txt) {
        return `
            <span class="badge bg-danger bg-opacity-75 me-1 fw-normal" title="Culling">C ✖</span>
            <span class="badge bg-danger bg-opacity-75 me-1 fw-normal" title="Trimming">T ✖</span>
            <span class="badge bg-danger bg-opacity-75 fw-normal" title="Crisping">Cr ✖</span>
        `;
    }
    
    // Cukup deteksi keberadaan kata kunci di dalam teks (case-insensitive)
    const isC = /CULLING/i.test(txt);
    const isT = /TRIMMING/i.test(txt);
    const isCr = /CRISPING/i.test(txt);

    return `
        <span class="badge ${isC ? 'bg-success' : 'bg-danger'} bg-opacity-75 me-1 fw-normal" title="Culling">C ${isC ? '✔' : '✖'}</span>
        <span class="badge ${isT ? 'bg-success' : 'bg-danger'} bg-opacity-75 me-1 fw-normal" title="Trimming">T ${isT ? '✔' : '✖'}</span>
        <span class="badge ${isCr ? 'bg-success' : 'bg-danger'} bg-opacity-75 fw-normal" title="Crisping">Cr ${isCr ? '✔' : '✖'}</span>
    `;
}

// 4. LOGIKA ANTRIAN VALIDASI
function handleQueue(rowId, status, el) {
    // Memastikan jika klik OK, NOK mati. Jika klik NOK, OK mati.
    const rowGroup = document.getElementsByName(`row-${rowId}`);
    rowGroup.forEach(cb => { if(cb !== el) cb.checked = false; });
    
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

// 5. MENGIRIM KE GSHEET
async function kirimData() {
    if (!confirm(`Yakin ingin memvalidasi ${queue.length} baris data ini?`)) return;
    
    toggleLoading(true);
    try {
        await fetch(URL_WEB_APP, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queue)
        });
        
        setTimeout(() => {
            alert("Data berhasil diproses ke Google Sheet!");
            fetchData();
        }, 1200);
    } catch (e) {
        console.error(e);
        alert("Terjadi kesalahan koneksi.");
        toggleLoading(false);
    }
}

// 6. POPUP FOTO
function bukaPopup(url) {
    if(!url || url.length < 10) return alert("Foto tidak tersedia (Link kosong).");
    
    const modalEl = document.getElementById('modalFoto');
    const imgEl = document.getElementById('frameFoto');
    const loadEl = document.getElementById('loadingGambar');
    const myModal = new bootstrap.Modal(modalEl);

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
        imgEl.style.display = 'block';
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
    const dRaw = document.getElementById('inputTanggal').value; 
    
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
