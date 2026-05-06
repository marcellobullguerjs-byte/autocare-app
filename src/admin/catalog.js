/**
 * AutoCare Prototype v11
 * src/admin/catalog.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin service catalog management: list, create, edit, toggle, delete.
 *
 * In Phase 2: all mutations call Supabase RPC functions.
 * Service changes propagate to the customer home grid and slot engine in real time.
 */

'use strict';

// Active filter for the catalog list view
let activeFilter = 'Todos';

/**
 * Build the admin service catalog list with category filter chips.
 * Shows all services (or filtered by category), each with edit/toggle/delete actions.
 */
function buildAdminCatalog() {
  const list = document.getElementById('adminSvcList');
  const fr   = document.getElementById('filterRow');
  if (!list || !fr) return;

  // Build filter chips
  fr.innerHTML = '';
  ['Todos', ...CATEGORIES].forEach(f => {
    const d = document.createElement('div');
    d.className  = 'filter-chip' + (f === activeFilter ? ' active' : '');
    d.textContent = f === 'Todos' ? `Todos (${catalog.length})` : f;
    d.onclick    = () => { activeFilter = f; buildAdminCatalog(); };
    fr.appendChild(d);
  });

  // Build service cards
  list.innerHTML = '';
  const filtered = activeFilter === 'Todos' ? catalog : catalog.filter(s => s.cat === activeFilter);

  filtered.forEach(svc => {
    const d = document.createElement('div');
    d.className = 'svc-card' + (svc.active ? '' : ' inactive');
    d.innerHTML = `
      <div class="row" style="margin-bottom:4px">
        <span style="font-size:13px;font-weight:500">${svc.name}</span>
        <span class="badge ${svc.active ? 'badge-green' : 'badge-gray'}">${svc.active ? 'Ativo' : 'Inativo'}</span>
      </div>
      <div style="font-size:11px;color:var(--muted)">
        ${svc.cat} · ${svc.provider} · ${svc.time}min${svc.parts ? ` · peça ${svc.leadTimeH}h` : ''}
      </div>
      <div style="font-size:14px;font-weight:500;color:var(--blue);margin-top:6px">R$ ${svc.price}</div>
      <div class="action-row">
        <button class="action-btn ab-edit"    onclick="openSvcForm(${svc.id})">Editar</button>
        <button class="action-btn ${svc.active ? 'ab-suspend' : 'ab-approve'}"
                onclick="toggleSvc(${svc.id})">${svc.active ? 'Desativar' : 'Ativar'}</button>
        <button class="action-btn ab-del"     onclick="delSvc(${svc.id})">Excluir</button>
      </div>`;
    list.appendChild(d);
  });
}

/**
 * Open the create/edit service modal.
 * Prepopulates form fields when editing an existing service.
 * @param {number|null} id - Service ID to edit, or null for new service
 */
function openSvcForm(id) {
  editingId   = id;
  const svc  = id ? catalog.find(x => x.id === id) : null;

  document.getElementById('modalTitle').textContent = id ? 'Editar serviço' : 'Novo serviço';
  document.getElementById('modalContent').innerHTML = `
    <div class="label">Nome</div>
    <input class="input" id="f-name" value="${svc ? svc.name : ''}" placeholder="Nome do serviço">
    <div class="label">Categoria</div>
    <select class="input" id="f-cat">
      ${CATEGORIES.map(c => `<option${svc && svc.cat === c ? ' selected' : ''}>${c}</option>`).join('')}
    </select>
    <div class="label">Tipo de prestador</div>
    <select class="input" id="f-prov">
      ${PROV_TYPES.map(p => `<option${svc && svc.provider === p ? ' selected' : ''}>${p}</option>`).join('')}
    </select>
    <div class="label">Preço (R$)</div>
    <input class="input" id="f-price" type="number" value="${svc ? svc.price : ''}" placeholder="180">
    <div class="label">Duração (min)</div>
    <input class="input" id="f-time" type="number" value="${svc ? svc.time : ''}" placeholder="30">
    <div class="label">Slots necessários (30min cada)</div>
    <input class="input" id="f-slots" type="number" value="${svc ? svc.slots : 1}">
    <div class="row" style="padding:8px 0">
      <span style="font-size:13px">Precisa de peça</span>
      <div class="toggle ${svc && svc.parts ? 'on' : ''}" id="f-parts" onclick="this.classList.toggle('on')"></div>
    </div>
    <div class="label">Lead time da peça (horas)</div>
    <input class="input" id="f-lead" type="number" value="${svc ? svc.leadTimeH : 0}">
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn btn-outline btn-sm" style="flex:1" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary btn-sm" style="flex:1" onclick="saveSvc()">Salvar</button>
    </div>`;
  document.getElementById('modalBg').style.display = 'flex';
}

/**
 * Save a service from the create/edit modal.
 * Validates name and price. Updates existing or appends new.
 */
function saveSvc() {
  const name  = document.getElementById('f-name').value.trim();
  const price = parseInt(document.getElementById('f-price').value) || 0;
  if (!name || !price) { alert('Preencha nome e preço'); return; }

  const hasParts = document.getElementById('f-parts').classList.contains('on');
  const data = {
    name,
    cat:       document.getElementById('f-cat').value,
    provider:  document.getElementById('f-prov').value,
    price,
    time:      parseInt(document.getElementById('f-time').value) || 30,
    slots:     parseInt(document.getElementById('f-slots').value) || 1,
    parts:     hasParts,
    leadTimeH: parseInt(document.getElementById('f-lead').value) || 0,
    active:    true,
  };

  if (editingId) {
    Object.assign(catalog.find(x => x.id === editingId), data);
  } else {
    catalog.push({ id: nextSvcId++, ...data });
  }

  closeModal();
  buildAdminCatalog();
  buildCatGrid(); // Rebuild customer-facing category grid
}

/**
 * Toggle a service's active status.
 * Inactive services are hidden from customers but retained in admin view.
 * @param {number} id - Service ID
 */
function toggleSvc(id) {
  const svc = catalog.find(x => x.id === id);
  if (!svc) return;
  svc.active = !svc.active;
  buildAdminCatalog();
  buildCatGrid();
}

/**
 * Permanently delete a service from the catalog.
 * @param {number} id - Service ID
 */
function delSvc(id) {
  catalog = catalog.filter(x => x.id !== id);
  buildAdminCatalog();
  buildCatGrid();
}
