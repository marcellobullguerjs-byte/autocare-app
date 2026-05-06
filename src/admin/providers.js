/**
 * AutoCare Prototype v11
 * src/admin/providers.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin provider management:
 *   - List with status filter
 *   - Detail view with score breakdown
 *   - Approve / reject / suspend / reactivate
 *
 * In Phase 2: mutations are Supabase RPC calls.
 * Status changes trigger push notifications to the affected provider.
 */

'use strict';

let provFilter = 'Todos';

/**
 * Build the admin provider list with status filter chips and action buttons.
 */
function buildProviderList() {
  const fr   = document.getElementById('provFilterRow');
  const list = document.getElementById('providerList');
  if (!fr || !list) return;

  // Count by status
  const cnt = {
    Todos:    PROVIDERS.length,
    Pendente: PROVIDERS.filter(p => p.status === 'pending').length,
    Aprovado: PROVIDERS.filter(p => p.status === 'approved').length,
    Suspenso: PROVIDERS.filter(p => p.status === 'suspended').length,
  };

  // Filter chips
  fr.innerHTML = '';
  ['Todos', 'Pendente', 'Aprovado', 'Suspenso'].forEach(f => {
    const d = document.createElement('div');
    d.className  = 'filter-chip' + (f === provFilter ? ' active' : '');
    d.textContent = `${f} (${cnt[f] || 0})`;
    d.onclick    = () => { provFilter = f; buildProviderList(); };
    fr.appendChild(d);
  });

  // Provider cards
  list.innerHTML = '';
  const statusMap = { Todos: null, Pendente: 'pending', Aprovado: 'approved', Suspenso: 'suspended' };
  const filtered  = provFilter === 'Todos' ? PROVIDERS : PROVIDERS.filter(p => p.status === statusMap[provFilter]);

  filtered.forEach(p => {
    const cfg  = getStatusConfig(p.status);
    const score = calcScore(p);
    const tier  = getTier(score);

    const d = document.createElement('div');
    d.className = 'prov-card';
    d.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <div class="av ${p.color}">${p.initials}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:500">${p.name}</div>
          <div style="font-size:11px;color:var(--muted)">${p.specialty.join(', ')} · ${p.region.join(', ')}</div>
          ${p.stats.jobsTotal > 0
            ? `<div style="font-size:11px;margin-top:2px">${tier.icon} <span style="color:${tier.color};font-weight:500">${tier.label}</span> · Score ${score}</div>`
            : ''}
        </div>
        <span class="badge ${cfg.badge}">${cfg.icon} ${cfg.label}</span>
      </div>
      <div class="action-row">
        <button class="action-btn ab-view" onclick="viewProvider(${p.id})">Ver detalhes</button>
        ${p.status === 'pending'   ? `<button class="action-btn ab-approve" onclick="changeStatus(${p.id},'approved')">Aprovar</button>
                                      <button class="action-btn ab-reject"  onclick="promptReject(${p.id})">Rejeitar</button>` : ''}
        ${p.status === 'approved'  ? `<button class="action-btn ab-suspend" onclick="promptSuspend(${p.id})">Suspender</button>` : ''}
        ${p.status === 'suspended' ? `<button class="action-btn ab-approve" onclick="changeStatus(${p.id},'approved')">Reativar</button>` : ''}
      </div>`;
    list.appendChild(d);
  });
}

/** Returns display config for a provider status value. */
function getStatusConfig(status) {
  const cfg = {
    approved:  { label: 'Aprovado',  badge: 'badge-green',  icon: '✓' },
    pending:   { label: 'Pendente',  badge: 'badge-yellow', icon: '⏳' },
    suspended: { label: 'Suspenso', badge: 'badge-orange', icon: '⚠️' },
    rejected:  { label: 'Rejeitado', badge: 'badge-red',    icon: '✗' },
  };
  return cfg[status] || { label: status, badge: 'badge-gray', icon: '?' };
}

/**
 * Show full provider detail screen.
 * @param {number} id - Provider ID
 */
function viewProvider(id) {
  const p = PROVIDERS.find(x => x.id === id);
  if (!p) return;

  const cfg   = getStatusConfig(p.status);
  const score = calcScore(p);
  const tier  = getTier(score);

  document.getElementById('provDetailContent').innerHTML = `
    <div style="background:var(--blue);margin:-16px -16px 16px;padding:20px 16px;display:flex;align-items:center;gap:14px">
      <div class="av ${p.color}" style="width:52px;height:52px;font-size:18px">${p.initials}</div>
      <div>
        <div style="color:#fff;font-size:16px;font-weight:500">${p.name}</div>
        <div style="color:rgba(255,255,255,.8);font-size:12px">${p.email || ''}</div>
        <span class="badge ${cfg.badge}" style="margin-top:6px">${cfg.icon} ${cfg.label}</span>
      </div>
    </div>

    <div class="card">
      <div style="font-size:12px;font-weight:500;color:var(--muted);margin-bottom:8px">ESPECIALIDADES & BAIRROS</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        ${p.specialty.map(s => `<span class="badge badge-blue">${s}</span>`).join('')}
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${p.region.map(r => `<span class="badge badge-blue">📍 ${r}</span>`).join('')}
      </div>
    </div>

    ${p.stats.jobsTotal > 0 ? `
    <div class="card">
      <div style="font-size:12px;font-weight:500;color:var(--muted);margin-bottom:8px">
        RANKING · Score ${score} · ${tier.icon} ${tier.label}
      </div>
      <div style="margin-bottom:6px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
          <span>Nota clientes</span><span>${p.stats.notaMedia}★</span>
        </div>
        <div style="height:5px;border-radius:3px;background:#f0f0f0">
          <div style="width:${p.stats.notaMedia / 5 * 100}%;height:100%;background:var(--green);border-radius:3px"></div>
        </div>
      </div>
      <div style="margin-bottom:6px">
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
          <span>Pontualidade</span><span>${p.stats.pontualidade}%</span>
        </div>
        <div style="height:5px;border-radius:3px;background:#f0f0f0">
          <div style="width:${p.stats.pontualidade}%;height:100%;background:var(--blue);border-radius:3px"></div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:12px">
        <span>Reclamações</span>
        <span style="color:${p.stats.reclamacoes === 0 ? 'var(--green)' : 'var(--red)'}">${p.stats.reclamacoes}</span>
      </div>
    </div>` : ''}

    <div class="card">
      <div class="row" style="margin-bottom:0"><span>Membro desde</span><span>${p.joinDate}</span></div>
    </div>

    ${p.status === 'pending' ? `
    <div style="display:flex;gap:8px">
      <button class="btn btn-green btn-sm" style="flex:1" onclick="changeStatus(${p.id},'approved')">✓ Aprovar</button>
      <button class="btn btn-red btn-sm"   style="flex:1" onclick="promptReject(${p.id})">✗ Rejeitar</button>
    </div>` : ''}
    ${p.status === 'approved' ? `
    <button class="btn btn-outline-red btn-sm" style="width:100%" onclick="promptSuspend(${p.id})">⚠️ Suspender</button>
    ` : ''}`;

  navHistory.push(currentScreen);
  showScreen('a-provider-detail');
}

/**
 * Change a provider's status directly (approve / reactivate).
 * @param {number} id     - Provider ID
 * @param {string} status - New status value
 */
function changeStatus(id, status) {
  const p = PROVIDERS.find(x => x.id === id);
  if (!p) return;
  p.status = status;
  closeModal();
  buildProviderList();
  if (currentScreen === 'a-provider-detail') viewProvider(id);
  showToast(status === 'approved' ? `✓ ${p.name} aprovado!` : 'Status atualizado');
}

/** Open rejection modal with reason dropdown. */
function promptReject(id) {
  document.getElementById('modalTitle').textContent = 'Rejeitar prestador';
  document.getElementById('modalContent').innerHTML = `
    <div class="label">Motivo</div>
    <select class="input" id="rr">
      <option>Documentação incompleta</option>
      <option>Documentos inválidos</option>
      <option>Região fora de cobertura</option>
    </select>
    <div style="display:flex;gap:8px">
      <button class="btn btn-outline btn-sm" style="flex:1" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-red btn-sm"     style="flex:1" onclick="confirmRej(${id})">Confirmar</button>
    </div>`;
  document.getElementById('modalBg').style.display = 'flex';
}

function confirmRej(id) {
  const p = PROVIDERS.find(x => x.id === id);
  if (!p) return;
  p.status = 'rejected';
  closeModal();
  buildProviderList();
  showToast(`✗ ${p.name} rejeitado`);
}

/** Open suspension modal with reason dropdown. */
function promptSuspend(id) {
  document.getElementById('modalTitle').textContent = 'Suspender prestador';
  document.getElementById('modalContent').innerHTML = `
    <div class="label">Motivo</div>
    <select class="input" id="sr">
      <option>Reclamações recorrentes</option>
      <option>Descumprimento das regras</option>
      <option>Não comparecimento</option>
    </select>
    <div style="display:flex;gap:8px">
      <button class="btn btn-outline btn-sm" style="flex:1" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-red btn-sm"     style="flex:1" onclick="confirmSusp(${id})">Suspender</button>
    </div>`;
  document.getElementById('modalBg').style.display = 'flex';
}

function confirmSusp(id) {
  const p = PROVIDERS.find(x => x.id === id);
  if (!p) return;
  p.status = 'suspended';
  closeModal();
  buildProviderList();
  showToast(`⚠️ ${p.name} suspenso`);
}
