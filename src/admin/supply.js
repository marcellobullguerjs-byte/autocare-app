/**
 * AutoCare Prototype v11
 * src/admin/supply.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin supply chain management:
 *   - Quotations tab: confirm parts with supplier → unlocks customer calendar (Fix 6)
 *   - Parts tab: parts catalog
 *   - Suppliers tab: registered suppliers
 *
 * Key business rule: the customer cannot book a time slot for a service that
 * requires parts until the admin has confirmed the quotation here.
 * Confirmation unlocks all available slots instantly.
 */

'use strict';

let currentSupply   = 'q';
let quotFilterState = 'Todos';

/**
 * Switch between supply chain sub-tabs.
 * @param {string} tab - 'q' (quotations) | 'p' (parts) | 's' (suppliers)
 */
function switchSupply(tab) {
  currentSupply = tab;
  ['q', 'p', 's'].forEach(t => {
    const navEl    = document.getElementById('snav-' + t);
    const screenEl = document.getElementById('ss-' + t);
    if (navEl)    navEl.classList.toggle('active', t === tab);
    if (screenEl) screenEl.classList.toggle('active', t === tab);
  });

  if (tab === 'q') buildQuotations();
  if (tab === 'p') buildPartsAdmin();
  if (tab === 's') buildSuppliersAdmin();
}

// ─── Quotations ───────────────────────────────────────────────────────────────

/**
 * Build the quotations list with filter chips.
 * Pending quotations show the 🔒 "Agenda bloqueada" banner.
 * Confirmed quotations show the ✓ "Agenda liberada" banner.
 *
 * Admin action: "Confirmar peça" → opens supplier selection modal (Fix 6).
 */
function buildQuotations() {
  const fr   = document.getElementById('quotFilter');
  const list = document.getElementById('quotationList');
  if (!fr || !list) return;

  const cnt = {
    Todos:     quotations.length,
    Pendente:  quotations.filter(q => q.status === 'pending').length,
    Confirmada: quotations.filter(q => q.status === 'confirmed').length,
  };

  fr.innerHTML = '';
  ['Todos', 'Pendente', 'Confirmada'].forEach(f => {
    const d = document.createElement('div');
    d.className  = 'filter-chip' + (f === quotFilterState ? ' active' : '');
    d.textContent = `${f} (${cnt[f] || 0})`;
    d.onclick    = () => { quotFilterState = f; buildQuotations(); };
    fr.appendChild(d);
  });

  list.innerHTML = '';
  const statusFilterMap = { Todos: null, Pendente: 'pending', Confirmada: 'confirmed' };
  const filtered = quotFilterState === 'Todos'
    ? quotations
    : quotations.filter(q => q.status === statusFilterMap[quotFilterState]);

  filtered.forEach(q => {
    const supp   = suppliers.find(s => s.id === q.supplierId);
    const isPending  = q.status === 'pending';
    const isConfirmed = q.status === 'confirmed';

    const d = document.createElement('div');
    d.className = 'svc-card';
    d.innerHTML = `
      <div class="row" style="margin-bottom:6px">
        <span style="font-size:13px;font-weight:500">${q.jobId} · ${q.service}</span>
        <span class="badge ${isPending ? 'badge-yellow' : 'badge-green'}">
          ${isPending ? '⏳ Pendente' : '✓ Confirmada'}
        </span>
      </div>
      <div style="font-size:12px;color:var(--muted)">${q.client} · 📍 ${q.bairro} · ${q.scheduledDate}</div>
      <div style="font-size:13px;font-weight:500;color:var(--blue);margin-top:6px">
        Total peças: R$ ${q.totalParts}
      </div>
      ${isConfirmed
        ? `<div style="font-size:11px;color:var(--green);margin-top:2px">
             ✓ ${q.confirmedAt} · ${supp ? supp.name : ''} · ${q.leadTimeH}h ao prestador
           </div>
           <div class="info-box info-green" style="margin-top:8px;font-size:11px">
             ✓ Agenda do cliente liberada
           </div>`
        : `<div class="info-box info-orange" style="margin-top:8px;font-size:11px">
             🔒 Agenda bloqueada até confirmação
           </div>
           <div class="action-row">
             <button class="action-btn ab-approve" onclick="confirmQuot(${q.id})">Confirmar peça</button>
             <button class="action-btn ab-del"     onclick="showToast('Marcado como indisponível')">Indisponível</button>
           </div>`}`;
    list.appendChild(d);
  });
}

/**
 * Open the supplier confirmation modal for a quotation.
 * Admin selects a supplier — confirmation unlocks customer calendar slots (Fix 6).
 * @param {number} id - Quotation ID
 */
function confirmQuot(id) {
  const q = quotations.find(x => x.id === id);
  if (!q) return;

  const opts = suppliers.filter(s => s.active).map(s =>
    `<option value="${s.id}">${s.name} (${s.leadTimeH}h)</option>`
  ).join('');

  document.getElementById('modalTitle').textContent = 'Confirmar peça com fornecedor';
  document.getElementById('modalContent').innerHTML = `
    <div class="info-box info-orange">
      📦 Peças entregues no endereço do prestador antes do serviço.
    </div>
    <div class="label">Fornecedor</div>
    <select class="input" id="confSupp">
      <option value="">Selecione o fornecedor...</option>
      ${opts}
    </select>
    <div class="info-box info-green" style="margin-top:8px">
      ✓ Ao confirmar: agenda do cliente é liberada automaticamente.
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-outline btn-sm" style="flex:1" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-green btn-sm"   style="flex:1" onclick="doConfirmQuot(${id})">
        Confirmar e liberar agenda
      </button>
    </div>`;
  document.getElementById('modalBg').style.display = 'flex';
}

/**
 * Execute quotation confirmation.
 * Updates quotation status to 'confirmed', which causes isPartsConfirmed()
 * to return true for this service, unlocking calendar slots in the slot engine.
 * @param {number} id - Quotation ID
 */
function doConfirmQuot(id) {
  const q      = quotations.find(x => x.id === id);
  if (!q) return;

  const suppId = parseInt(document.getElementById('confSupp').value) || 1;
  const supp   = suppliers.find(s => s.id === suppId);

  q.supplierId  = suppId;
  q.leadTimeH   = supp ? supp.leadTimeH : 2;
  q.status      = 'confirmed';
  q.confirmedAt = 'agora';

  closeModal();
  buildQuotations();
  showToast(`✓ Peças confirmadas! Agenda do cliente liberada.`);
}

// ─── Parts Catalog ─────────────────────────────────────────────────────────────
function buildPartsAdmin() {
  const list = document.getElementById('partList');
  if (!list) return;
  list.innerHTML = '';

  parts.forEach(p => {
    const supp = suppliers.find(s => s.id === p.supplierId);
    const d    = document.createElement('div');
    d.className = 'svc-card';
    d.innerHTML = `
      <div class="row">
        <span style="font-size:13px;font-weight:500">${p.name}</span>
        <span style="font-size:13px;font-weight:500;color:var(--blue)">R$ ${p.price}</span>
      </div>
      <div style="font-size:11px;color:var(--muted)">
        ${p.cat} · ${p.unit}${supp ? ` · ${supp.name}` : ''}
      </div>`;
    list.appendChild(d);
  });
}

// ─── Suppliers ────────────────────────────────────────────────────────────────
function buildSuppliersAdmin() {
  const list = document.getElementById('supplierList');
  if (!list) return;
  list.innerHTML = '';

  suppliers.forEach(s => {
    const d = document.createElement('div');
    d.className = 'svc-card';
    d.innerHTML = `
      <div class="row">
        <span style="font-size:13px;font-weight:500">${s.name}</span>
        <span class="badge badge-green">Ativo</span>
      </div>
      <div style="font-size:12px;color:var(--muted)">📍 ${s.region} · ⏱ ${s.leadTimeH}h</div>
      <div style="margin-top:4px">
        ${s.cats.map(c => `<span class="tag-cat">${c}</span>`).join('')}
      </div>`;
    list.appendChild(d);
  });
}
