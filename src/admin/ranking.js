/**
 * AutoCare Prototype v11
 * src/admin/ranking.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin ranking view:
 *   - All approved providers ranked by score
 *   - Filter by neighborhood
 *   - Score breakdown detail per provider
 *
 * The ranking determines dispatch priority:
 *   higher score → first to receive job offers in a matching neighborhood.
 */

'use strict';

let rankFilter = 'Todos';

function buildRanking() {
  const fr   = document.getElementById('rankFilter');
  const list = document.getElementById('rankingList');
  if (!fr || !list) return;

  fr.innerHTML = '';
  ['Todos', 'Vila Madalena', 'Pinheiros', 'Moema'].forEach(f => {
    const d = document.createElement('div');
    d.className  = 'filter-chip' + (f === rankFilter ? ' active' : '');
    d.textContent = f;
    d.onclick    = () => { rankFilter = f; buildRanking(); };
    fr.appendChild(d);
  });

  const ranked = [...PROVIDERS]
    .filter(p => rankFilter === 'Todos' || p.region.includes(rankFilter))
    .filter(p => p.stats.jobsTotal > 0)
    .map(p => ({ ...p, score: calcScore(p) }))
    .sort((a, b) => b.score - a.score);

  list.innerHTML = '';
  ranked.forEach((p, i) => {
    const tier   = getTier(p.score);
    const c      = p.score >= 8 ? 'var(--green)' : p.score >= 7 ? 'var(--blue)' : 'var(--orange)';
    const circ   = 2 * Math.PI * 22;
    const offset = circ * (1 - p.score / 10);

    const medalBg = i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--blue-light)';
    const medalFg = i <= 2 ? '#333' : 'var(--blue)';

    const d = document.createElement('div');
    d.className = 'rank-card';
    d.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
        <div style="width:28px;height:28px;border-radius:50%;background:${medalBg};
                    display:flex;align-items:center;justify-content:center;
                    font-size:12px;font-weight:700;flex-shrink:0;color:${medalFg}">
          #${i + 1}
        </div>
        <div class="av ${p.color}">${p.initials}</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:500">${p.name}</div>
          <div style="font-size:11px;color:var(--muted)">${p.specialty.join(', ')}</div>
        </div>
        <div class="score-ring">
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle fill="none" stroke="#f0f0f0" stroke-width="5" cx="28" cy="28" r="22" transform="rotate(-90 28 28)"/>
            <circle fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"
                    cx="28" cy="28" r="22" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
                    transform="rotate(-90 28 28)"/>
          </svg>
          <div class="score-num" style="color:${c}">${p.score}</div>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
        <span style="background:var(--green-light);color:var(--green);padding:2px 8px;border-radius:10px;font-size:11px">★ ${p.stats.notaMedia}</span>
        <span style="background:var(--blue-light);color:var(--blue);padding:2px 8px;border-radius:10px;font-size:11px">${Math.round(p.stats.jobsConcluidos / p.stats.jobsTotal * 100)}% concl.</span>
        <span style="background:var(--orange-light);color:var(--orange);padding:2px 8px;border-radius:10px;font-size:11px">${p.stats.pontualidade}% pontual</span>
      </div>
      <button class="action-btn ab-view" style="width:100%" onclick="viewProviderRank(${p.id})">Ver detalhes</button>`;
    list.appendChild(d);
  });
}

function viewProviderRank(id) {
  const p     = PROVIDERS.find(x => x.id === id);
  if (!p) return;

  const score   = calcScore(p);
  const tier    = getTier(score);
  const nota    = (p.stats.notaMedia / 5) * 10;
  const conclus = (p.stats.jobsConcluidos / p.stats.jobsTotal) * 10;
  const pontual = (p.stats.pontualidade / 100) * 10;
  const reclam  = Math.max(0, 10 - (p.stats.reclamacoes * 1.5));

  document.getElementById('provRankContent').innerHTML = `
    <div style="background:var(--blue);margin:-16px -16px 16px;padding:20px 16px;display:flex;align-items:center;gap:14px">
      <div class="av ${p.color}" style="width:52px;height:52px;font-size:18px">${p.initials}</div>
      <div>
        <div style="color:#fff;font-size:16px;font-weight:500">${p.name}</div>
        <div style="margin-top:6px">
          ${tier.icon} <span style="color:#fff;font-weight:500">${tier.label}</span>
          · Score <span style="color:#fff;font-weight:700">${score}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div style="font-size:12px;font-weight:500;color:var(--muted);margin-bottom:12px">BREAKDOWN DO SCORE</div>

      ${[
        { label: 'Nota clientes (40%)', val: nota,   weight: 0.40, color: 'var(--green)'  },
        { label: 'Conclusão (25%)',     val: conclus, weight: 0.25, color: 'var(--blue)'   },
        { label: 'Pontualidade (20%)',  val: pontual, weight: 0.20, color: 'var(--orange)' },
        { label: 'Reclamações (15%)',   val: reclam,  weight: 0.15, color: reclam >= 8 ? 'var(--green)' : 'var(--red)' },
      ].map(row => `
        <div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
            <span>${row.label} → ${row.val.toFixed(1)}</span>
            <span style="font-weight:500">${(row.val * row.weight).toFixed(2)} pts</span>
          </div>
          <div style="height:6px;border-radius:3px;background:#f0f0f0">
            <div style="width:${row.val * 10}%;height:100%;border-radius:3px;background:${row.color}"></div>
          </div>
        </div>`).join('')}
    </div>

    <button class="btn btn-outline" onclick="goBack()">← Voltar</button>`;

  navHistory.push(currentScreen);
  showScreen('a-provider-rank');
}
