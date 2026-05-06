/**
 * AutoCare Prototype v11
 * src/admin/payments.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin payments dashboard (Fix 3).
 *
 * In V1: all payments are mock data.
 * In Phase 2: integrated with Pagar.me or Stripe (Brazil support).
 * Payments are released when the customer approves the completed service.
 *
 * Status values:
 *   released: Customer approved → payment settled to provider
 *   waiting:  Service completed but awaiting customer approval
 *   pending:  Job has no provider yet (quota/dispatch pending)
 */

'use strict';

let payTab = 'today';

function switchPayTab(tab) {
  payTab = tab;
  ['today', 'pending', 'all'].forEach(t => {
    const el = document.getElementById('ptab-' + t);
    if (el) el.classList.toggle('active', t === tab);
  });
  buildPayments();
}

function buildPayments() {
  const el = document.getElementById('paymentsList');
  if (!el) return;
  el.innerHTML = '';

  let filtered = payments;
  if (payTab === 'pending') {
    filtered = payments.filter(p => p.status === 'waiting' || p.status === 'pending');
  }

  const statusCfg = {
    released: { label: 'Liberado',             cls: 'ps-released' },
    waiting:  { label: 'Aguard. aprovação',    cls: 'ps-waiting'  },
    pending:  { label: 'Sem prestador',         cls: 'ps-pending'  },
  };

  filtered.forEach(p => {
    const cfg = statusCfg[p.status];
    const d   = document.createElement('div');
    d.className = 'pay-item';
    d.innerHTML = `
      <div class="row" style="margin-bottom:6px">
        <span style="font-size:13px;font-weight:500">${p.jobId} · ${p.service}</span>
        <span class="pay-status ${cfg.cls}">${cfg.label}</span>
      </div>
      <div style="font-size:12px;color:var(--muted)">${p.client} · ${p.time} · ${p.method}</div>
      <div class="row" style="margin-top:8px;margin-bottom:0">
        <span style="font-size:12px;color:var(--muted)">${p.provider}</span>
        <span style="font-size:15px;font-weight:500;color:var(--blue)">R$ ${p.value}</span>
      </div>`;
    el.appendChild(d);
  });

  // Show total released amount
  const total = filtered.reduce((a, p) => a + (p.status === 'released' ? p.value : 0), 0);
  if (filtered.length > 0) {
    const s = document.createElement('div');
    s.className  = 'card';
    s.style.background = 'var(--blue-light)';
    s.innerHTML  = `
      <div class="row" style="margin-bottom:0">
        <span style="font-size:13px;font-weight:500">Total liberado</span>
        <span style="font-size:16px;font-weight:500;color:var(--blue)">R$ ${total}</span>
      </div>`;
    el.appendChild(s);
  }
}
