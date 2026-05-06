/**
 * AutoCare Prototype v11
 * src/admin/claims.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin claims and warranty management.
 *
 * All claims are reviewed manually by admin in V1.
 * Resolution options:
 *   - warn:       Reduce provider score + notify
 *   - compensate: Refund customer + reduce score + notify
 *   - suspend:    Suspend provider (drastic — triggers immediately)
 *   - dismiss:    Improcedente (no action)
 *
 * Upheld claims impact provider ranking via the score engine.
 * Provider exclusion is always manual — never automatic.
 */

'use strict';

let claimsFilter = 'Todos';

function buildClaims() {
  const fr   = document.getElementById('claimsFilter');
  const list = document.getElementById('claimsList');
  if (!fr || !list) return;

  const cnt = {
    Todos:    claims.length,
    Pendente: claims.filter(c => c.status === 'pending').length,
    Resolvido: claims.filter(c => c.status === 'resolved').length,
  };

  fr.innerHTML = '';
  ['Todos', 'Pendente', 'Resolvido'].forEach(f => {
    const d = document.createElement('div');
    d.className  = 'filter-chip' + (f === claimsFilter ? ' active' : '');
    d.textContent = `${f} (${cnt[f] || 0})`;
    d.onclick    = () => { claimsFilter = f; buildClaims(); };
    fr.appendChild(d);
  });

  list.innerHTML = '';
  const filtered = claimsFilter === 'Todos' ? claims
    : claims.filter(c => c.status === (claimsFilter === 'Pendente' ? 'pending' : 'resolved'));

  filtered.forEach(claim => {
    const d = document.createElement('div');
    d.className = 'svc-card';
    d.innerHTML = `
      <div class="row" style="margin-bottom:6px">
        <span style="font-size:13px;font-weight:500">${claim.jobId} · ${claim.service}</span>
        <span class="badge ${claim.status === 'pending' ? 'badge-yellow' : 'badge-green'}">
          ${claim.status === 'pending' ? '⏳ Pendente' : '✓ Resolvido'}
        </span>
      </div>
      <div style="font-size:12px;color:var(--muted)">
        ${claim.client} · ${claim.date} · ${claim.provider}
      </div>
      <div style="font-size:12px;margin-top:6px;font-weight:500">${claim.type}</div>
      ${claim.status === 'resolved'
        ? `<div class="info-box info-green" style="margin-top:6px">✓ ${claim.resolution}</div>`
        : `<div class="action-row">
             <button class="action-btn ab-view" onclick="viewClaim(${claim.id})">Analisar</button>
           </div>`}`;
    list.appendChild(d);
  });
}

function viewClaim(id) {
  const claim = claims.find(x => x.id === id);
  if (!claim) return;
  const prov = PROVIDERS.find(p => p.id === claim.providerId);

  document.getElementById('claimDetailContent').innerHTML = `
    <div style="background:var(--orange);margin:-16px -16px 16px;padding:20px 16px">
      <div style="color:#fff;font-size:16px;font-weight:500">Reclamação · ${claim.jobId}</div>
      <div style="color:rgba(255,255,255,.8);font-size:12px;margin-top:4px">${claim.type}</div>
    </div>

    <div class="card">
      <div class="row"><span style="font-size:13px;color:var(--muted)">Cliente</span>   <span>${claim.client}</span></div>
      <div class="row"><span style="font-size:13px;color:var(--muted)">Prestador</span> <span>${claim.provider}</span></div>
      <div class="row" style="margin-bottom:0"><span style="font-size:13px;color:var(--muted)">Serviço</span> <span>${claim.service}</span></div>
    </div>

    <div class="card">
      <div style="font-size:12px;font-weight:500;color:var(--muted);margin-bottom:6px">DESCRIÇÃO</div>
      <div style="font-size:13px">${claim.desc}</div>
    </div>

    ${prov ? `
    <div class="card">
      <div style="font-size:12px;font-weight:500;color:var(--muted);margin-bottom:6px">
        PRESTADOR · Score ${calcScore(prov)}
      </div>
      <div style="font-size:13px">${prov.stats.reclamacoes} reclamação(ões) · ${prov.stats.jobsConcluidos} jobs</div>
    </div>` : ''}

    <div style="font-size:13px;font-weight:500;margin-bottom:10px">Ação do admin</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn btn-outline btn-sm" style="text-align:left" onclick="resolveClaim(${id},'warn')">
        ⚠️ Notificar prestador (reduz score)
      </button>
      <button class="btn btn-outline btn-sm" style="text-align:left" onclick="resolveClaim(${id},'compensate')">
        💰 Compensar cliente + notificar prestador
      </button>
      <button class="btn btn-outline-red btn-sm" style="text-align:left" onclick="resolveClaim(${id},'suspend')">
        🚫 Suspender prestador
      </button>
      <button class="btn btn-outline btn-sm" style="text-align:left" onclick="resolveClaim(${id},'dismiss')">
        ✓ Improcedente (dispensar)
      </button>
    </div>`;

  navHistory.push(currentScreen);
  showScreen('a-claim-detail');
}

function resolveClaim(id, action) {
  const claim = claims.find(x => x.id === id);
  if (!claim) return;

  const resolutions = {
    warn:       'Score reduzido. Prestador notificado.',
    compensate: 'Cliente compensado. Score reduzido.',
    suspend:    'Prestador suspenso por decisão administrativa.',
    dismiss:    'Reclamação considerada improcedente.',
  };

  claim.status     = 'resolved';
  claim.resolution = resolutions[action];

  if (action === 'suspend') {
    const prov = PROVIDERS.find(p => p.id === claim.providerId);
    if (prov) prov.status = 'suspended';
  }

  showToast('✓ Reclamação resolvida.');
  goScreen('a-claims');
}
