/**
 * AutoCare Prototype v11
 * src/admin/dispatch.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin dispatch monitoring and manual reallocation.
 *
 * In V1 / prototype: dispatch is manually triggered via UI.
 * In Phase 2: automated by Supabase Edge Functions + pg_cron:
 *   - On job creation: Edge Function runs the ranking filter and sends offer
 *   - After 15 min: pg_cron checks for expired offers and advances queue
 *   - Admin can still override at any point via this screen
 */

'use strict';

const DISPATCH_STATUS_CONFIG = {
  confirmed:   { label: 'Confirmado',      badge: 'badge-green',  icon: '✓' },
  offering:    { label: 'Aguardando aceite', badge: 'badge-yellow', icon: '⏳' },
  no_provider: { label: 'Sem prestador',   badge: 'badge-red',    icon: '🚨' },
  completed:   { label: 'Concluído',       badge: 'badge-gray',   icon: '✓' },
};

let dispatchFilterState = 'Todos';

/**
 * Build the dispatch jobs list with filter chips and action buttons.
 * Highlights urgent jobs (no_provider) in red.
 */
function buildDispatchList() {
  const fr   = document.getElementById('dispatchFilter');
  const list = document.getElementById('dispatchList');
  if (!fr || !list) return;

  const counts = {
    'Todos':          dispatchJobs.length,
    'Aguardando':     dispatchJobs.filter(j => j.dispatch.status === 'offering').length,
    'Confirmado':     dispatchJobs.filter(j => j.dispatch.status === 'confirmed').length,
    'Sem prestador':  dispatchJobs.filter(j => j.dispatch.status === 'no_provider').length,
    'Concluído':      dispatchJobs.filter(j => j.dispatch.status === 'completed').length,
  };

  // Filter chips
  fr.innerHTML = '';
  Object.keys(counts).forEach(f => {
    const d = document.createElement('div');
    d.className  = 'filter-chip' + (f === dispatchFilterState ? ' active' : '');
    d.textContent = `${f} (${counts[f] || 0})`;
    d.onclick    = () => { dispatchFilterState = f; buildDispatchList(); };
    fr.appendChild(d);
  });

  // Job cards
  list.innerHTML = '';
  const filterMap = {
    'Todos': null, 'Aguardando': 'offering', 'Confirmado': 'confirmed',
    'Sem prestador': 'no_provider', 'Concluído': 'completed',
  };
  const filtered = dispatchFilterState === 'Todos'
    ? dispatchJobs
    : dispatchJobs.filter(j => j.dispatch.status === filterMap[dispatchFilterState]);

  filtered.forEach(job => {
    const cfg    = DISPATCH_STATUS_CONFIG[job.dispatch.status];
    const prov   = PROVIDERS.find(p => p.id === job.dispatch.providerId);
    const currP  = PROVIDERS.find(p => p.id === job.dispatch.currentOfferId);

    let provInfo = '';
    if (job.dispatch.status === 'confirmed' && prov) {
      provInfo = `<div style="font-size:11px;color:var(--green);margin-top:4px">✓ ${prov.name}</div>`;
    } else if (job.dispatch.status === 'offering' && currP) {
      provInfo = `<div style="font-size:11px;color:var(--yellow);margin-top:4px">⏳ Aguardando ${currP.name}</div>`;
    } else if (job.dispatch.status === 'no_provider') {
      provInfo = `<div style="font-size:11px;color:var(--red);margin-top:4px">🚨 Intervenção manual necessária</div>`;
    }

    const d = document.createElement('div');
    d.className = `job-card ${job.dispatch.status === 'no_provider' ? 'urgent' : job.dispatch.status === 'offering' ? 'waiting' : 'confirmed'}`;
    d.innerHTML = `
      <div class="row" style="margin-bottom:6px">
        <span style="font-size:13px;font-weight:500">#${job.id} · ${job.service}</span>
        <span class="badge ${cfg.badge}">${cfg.icon} ${cfg.label}</span>
      </div>
      <div style="font-size:12px;color:var(--muted)">${job.client} · 📍 ${job.bairro} · ${job.date} ${job.time} · R$ ${job.price}</div>
      ${provInfo}
      <div class="action-row">
        <button class="action-btn ab-view" onclick="viewDispatch(${job.id})">Ver detalhes</button>
        ${(job.dispatch.status === 'no_provider' || job.dispatch.status === 'offering')
          ? `<button class="action-btn ab-suspend" onclick="openReallocModal(${job.id})">Realocar</button>`
          : ''}
      </div>`;
    list.appendChild(d);
  });
}

/**
 * Show the dispatch timeline detail for a specific job.
 * @param {number} id - Job ID
 */
function viewDispatch(id) {
  const job = dispatchJobs.find(j => j.id === id);
  if (!job) return;

  const cfg = DISPATCH_STATUS_CONFIG[job.dispatch.status];

  // Build timeline steps
  const steps = [{ icon: '📄', title: 'Job criado', sub: 'Pagamento confirmado', state: 'done' }];

  job.dispatch.offeredTo.forEach(pid => {
    const p = PROVIDERS.find(x => x.id === pid);
    const h = job.dispatch.history.find(x => x.providerId === pid);
    if (h && h.action === 'accepted') {
      steps.push({ icon: '✓', title: `Aceito · ${p ? p.name : '?'}`, sub: h.at, state: 'done' });
    } else if (job.dispatch.currentOfferId === pid) {
      steps.push({ icon: '⏳', title: `Aguardando · ${p ? p.name : '?'}`, sub: '15 min', state: 'active' });
    }
  });

  if (job.dispatch.status === 'confirmed') {
    steps.push({ icon: '✓', title: 'Confirmado', sub: 'Pronto para execução', state: 'done' });
  } else if (job.dispatch.status === 'no_provider') {
    steps.push({ icon: '🚨', title: 'Sem prestador', sub: 'Intervenção necessária', state: 'failed' });
  }

  const stateColor = { done: 'var(--green)', active: 'var(--blue)', failed: 'var(--red)' };
  const sh = steps.map(s => `
    <div style="display:flex;gap:12px;padding-bottom:12px">
      <div style="width:28px;height:28px;border-radius:50%;background:${stateColor[s.state] || '#f0f0f0'};
                  display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;color:#fff">
        ${s.icon}
      </div>
      <div>
        <div style="font-size:13px;font-weight:500">${s.title}</div>
        <div style="font-size:11px;color:var(--muted)">${s.sub}</div>
      </div>
    </div>`).join('');

  document.getElementById('dispatchDetailContent').innerHTML = `
    <div style="background:var(--blue);margin:-16px -16px 16px;padding:20px 16px">
      <div style="color:#fff;font-size:16px;font-weight:500">#${job.id} · ${job.service}</div>
      <span class="badge ${cfg.badge}" style="margin-top:8px">${cfg.icon} ${cfg.label}</span>
    </div>
    <div class="card">${sh}</div>
    ${(job.dispatch.status === 'no_provider' || job.dispatch.status === 'offering')
      ? `<button class="btn btn-primary" onclick="openReallocModal(${job.id})">🔄 Realocar prestador</button>
         <div style="height:8px"></div>`
      : ''}
    <button class="btn btn-outline" onclick="goScreen('a-dispatch')">Voltar</button>`;

  navHistory.push(currentScreen);
  showScreen('a-dispatch-detail');
}

/**
 * Open the manual reallocation modal.
 * Shows a ranked list of compatible approved providers to reassign the job to.
 * @param {number} jobId - Job ID to reallocate
 */
function openReallocModal(jobId) {
  const job = dispatchJobs.find(j => j.id === jobId);
  if (!job) return;

  const compatible = PROVIDERS.filter(p =>
    p.status === 'approved' &&
    p.region.includes(job.bairro) &&
    p.available
  );

  document.getElementById('modalTitle').textContent = 'Realocar prestador';

  const opts = compatible.map(p => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px;border:1.5px solid var(--border);
                border-radius:10px;margin-bottom:8px;cursor:pointer" class="realloc-opt"
         onclick="
           this.style.border='2px solid var(--blue)';
           this.style.background='var(--blue-light)';
           document.querySelectorAll('.realloc-opt').forEach(el => {
             if(el !== this){ el.style.border='1.5px solid var(--border)'; el.style.background=''; }
           });
           selectedReallocId=${p.id}">
      <div class="av ${p.color}" style="width:32px;height:32px;font-size:11px">${p.initials}</div>
      <div style="flex:1">
        <div style="font-size:13px">${p.name}</div>
        <div style="font-size:11px;color:var(--muted)">⭐ ${calcScore(p)} · ${p.specialty.join(', ')}</div>
      </div>
    </div>`).join('');

  document.getElementById('modalContent').innerHTML = `
    <div class="info-box info-yellow">⏱ O prestador terá 15 min para aceitar após o envio.</div>
    ${opts || '<p style="color:var(--muted);font-size:13px;margin-bottom:12px">Nenhum prestador disponível neste bairro.</p>'}
    <div style="display:flex;gap:8px">
      <button class="btn btn-outline btn-sm" style="flex:1" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary btn-sm" style="flex:1" onclick="confirmRealloc(${jobId})">Enviar oferta</button>
    </div>`;

  document.getElementById('modalBg').style.display = 'flex';
}

/**
 * Confirm and execute manual reallocation.
 * Updates the job's dispatch record and shows a toast.
 * @param {number} jobId - Job ID
 */
function confirmRealloc(jobId) {
  if (!selectedReallocId) { showToast('Selecione um prestador'); return; }

  const job  = dispatchJobs.find(j => j.id === jobId);
  const prov = PROVIDERS.find(p => p.id === selectedReallocId);
  if (!job || !prov) return;

  job.dispatch.status         = 'offering';
  job.dispatch.currentOfferId = selectedReallocId;
  if (!job.dispatch.offeredTo.includes(selectedReallocId)) {
    job.dispatch.offeredTo.push(selectedReallocId);
  }

  selectedReallocId = null;
  closeModal();
  buildDispatchList();
  showToast(`✓ Oferta enviada para ${prov.name}!`);
}
