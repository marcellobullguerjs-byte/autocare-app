/**
 * AutoCare Prototype v11
 * src/client/vehicles.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Customer vehicle management:
 *   - Add vehicle form with dynamic brand/model selection (Fix 5)
 *   - Vehicle list rendering
 *   - Vehicle service history with tab switching
 */

'use strict';

// ─── Add Vehicle Form (Fix 5) ─────────────────────────────────────────────────

/**
 * Update the model dropdown when the brand selection changes.
 * Reads from MODELS_BY_BRAND constant in constants.js.
 * Called by the onchange handler on the brand select element.
 */
function updateModels() {
  const marca = document.getElementById('vehMarca').value;
  const sel   = document.getElementById('vehModelo');

  sel.innerHTML = marca
    ? '<option value="">Selecione o modelo...</option>'
    : '<option value="">Selecione primeiro a marca</option>';

  if (MODELS_BY_BRAND[marca]) {
    MODELS_BY_BRAND[marca].forEach(m => {
      const o = document.createElement('option');
      o.textContent = m;
      sel.appendChild(o);
    });
  }
}

/**
 * Save a new vehicle from the Add Vehicle form.
 * Validates required fields (brand, model, year, plate).
 * On success: adds to vehicles array, rebuilds lists, shows toast, navigates back.
 */
function saveVehicle() {
  const marca  = document.getElementById('vehMarca').value;
  const modelo = document.getElementById('vehModelo').value;
  const ano    = document.getElementById('vehAno').value;
  const placa  = document.getElementById('vehPlaca').value.trim();

  // Validate required fields
  if (!marca || !modelo || !ano) {
    showToast('⚠️ Preencha marca, modelo e ano');
    return;
  }
  if (!placa) {
    showToast('⚠️ Preencha a placa');
    return;
  }

  const comb    = document.getElementById('vehComb').value;
  const cor     = document.getElementById('vehCor').value;
  const apelido = document.getElementById('vehApelido').value.trim();

  // Add to vehicles array
  vehicles.push({ id: nextVehId++, marca, modelo, ano, comb, placa, cor, apelido });

  showToast(`✓ ${marca} ${modelo} adicionado!`);
  buildVehicleListScreen();
  buildVehOptions();
  goBack();
}

// ─── Vehicle List Screen ──────────────────────────────────────────────────────

/**
 * Render the Meus Veículos list screen.
 * Shows all registered vehicles with service count and quick actions.
 */
function buildVehicleListScreen() {
  const el = document.getElementById('vehicleListEl');
  if (!el) return;
  el.innerHTML = '';

  vehicles.forEach(v => {
    // Mock service count from history (only available for original 2 vehicles)
    const histEntry = vehicleHistory[v.id];
    const svcCount  = histEntry ? histEntry.svcs.length : 0;

    const d       = document.createElement('div');
    d.className   = 'veh-option';
    d.style.cssText = 'border-style:solid;cursor:pointer';
    d.innerHTML   = `
      <div class="veh-icon">🚗</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500">
          ${v.marca} ${v.modelo}${v.apelido ? ` · <span style="color:var(--muted)">${v.apelido}</span>` : ''}
        </div>
        <div style="font-size:12px;color:var(--muted)">${v.ano} · ${v.placa} · ${v.comb}</div>
        <div style="font-size:11px;color:var(--blue);margin-top:2px">${svcCount} serviço(s) realizado(s)</div>
      </div>
      <span class="badge badge-blue">Ativo</span>`;
    d.onclick = () => goScreen('s-vehicle-history');
    el.appendChild(d);
  });
}

// ─── Vehicle History ──────────────────────────────────────────────────────────

/**
 * Build the vehicle service history screen for the selected vehicle.
 * Shows summary stats and a chronological list of completed services.
 */
function buildVehicleHistory() {
  const vh = vehicleHistory[selectedVehicle];
  if (!vh) return;

  // Header
  const subtitleEl = document.getElementById('vhSubtitle');
  if (subtitleEl) subtitleEl.textContent = `${vh.name} · ${vh.plate}`;

  // Stats
  const totalSpent  = vh.svcs.reduce((a, s) => a + s.price, 0);
  const totalSvcsEl = document.getElementById('vhTotalSvcs');
  const totalSpentEl = document.getElementById('vhTotalSpent');
  const lastSvcEl   = document.getElementById('vhLastSvc');

  if (totalSvcsEl)  totalSvcsEl.textContent  = vh.svcs.length;
  if (totalSpentEl) totalSpentEl.textContent = `R$ ${totalSpent}`;
  if (lastSvcEl)    lastSvcEl.textContent    = `Último: ${vh.svcs[0].svc} · ${vh.svcs[0].date}`;

  // Service list
  const list = document.getElementById('vhList');
  if (!list) return;
  list.innerHTML = '';

  vh.svcs.forEach(s => {
    const svcObj = catalog.find(c => c.name === s.svc) || { cat: 'Manutenção' };
    const icon   = CAT_ICONS[svcObj.cat] || '🔧';
    const stars  = '★'.repeat(s.nota) + '☆'.repeat(5 - s.nota);

    const d   = document.createElement('div');
    d.className = 'hist-item';
    d.innerHTML = `
      <div class="hist-icon">${icon}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500">${s.svc}</div>
        <div style="font-size:11px;color:var(--muted)">${s.date} · ${s.prov}</div>
        <div style="font-size:11px;color:#FFA000;margin-top:2px">${stars}</div>
        ${s.foto ? '<div style="font-size:10px;color:var(--blue);margin-top:2px">📸 Fotos disponíveis</div>' : ''}
      </div>
      <div style="text-align:right">
        <div style="font-size:13px;font-weight:500;color:var(--blue)">R$ ${s.price}</div>
      </div>`;
    list.appendChild(d);
  });
}

/**
 * Switch the active vehicle tab in the history screen.
 * @param {number} id - Vehicle ID (1 or 2)
 */
function switchVehicle(id) {
  selectedVehicle = id;
  const btn1 = document.getElementById('vhBtn1');
  const btn2 = document.getElementById('vhBtn2');
  if (btn1) btn1.style.cssText = id === 1 ? 'background:var(--blue);color:#fff;border-color:var(--blue)' : '';
  if (btn2) btn2.style.cssText = id === 2 ? 'background:var(--blue);color:#fff;border-color:var(--blue)' : '';
  buildVehicleHistory();
}
