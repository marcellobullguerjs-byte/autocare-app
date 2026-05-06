/**
 * AutoCare Prototype v11
 * src/client/approval.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Customer service approval flow:
 *   - Star rating (1–5)
 *   - Job approval + payment release
 *   - Claim/warranty modal
 *   - Cancellation and rescheduling
 */

'use strict';

// ─── Star Rating ──────────────────────────────────────────────────────────────

/**
 * Set the star rating in the approval screen.
 * Updates the visual star display and stores the selection.
 * @param {number} n - Rating value 1–5
 */
function setStar(n) {
  currentStar = n;
  document.querySelectorAll('#starRow span').forEach((s, i) => {
    s.classList.toggle('lit', i < n);
  });
  const labels = ['', 'Ruim 😞', 'Regular 😐', 'Bom 😊', 'Ótimo 😃', 'Excelente! 🌟'];
  const lbl = document.getElementById('starLabel');
  if (lbl) lbl.textContent = labels[n] || '';
}

// ─── Approval ────────────────────────────────────────────────────────────────

/**
 * Customer approves the completed service.
 * Validates that a star rating has been selected.
 * In Phase 2: PATCH /api/jobs/:id/approve → triggers payment release via gateway.
 */
function approveJob() {
  if (currentStar === 0) {
    showToast('⭐ Avalie antes de aprovar');
    return;
  }
  goScreen('s-approved');
  showToast('✓ Aprovado! Pagamento liberado.');
}

// ─── Claim Modal ──────────────────────────────────────────────────────────────

/**
 * Open the claim/warranty modal.
 * Customer can report issues within the 30-day warranty window.
 * Admin reviews all claims manually (no automated resolution in V1).
 */
function openClaimModal() {
  document.getElementById('modalTitle').textContent = 'Abrir reclamação / garantia';
  document.getElementById('modalContent').innerHTML = `
    <div class="info-box info-yellow">
      ⚠️ Apenas para problemas reais. O admin analisa manualmente.
    </div>
    <div class="label">Tipo</div>
    <select class="input">
      <option>Serviço não foi realizado corretamente</option>
      <option>Prestador não apareceu</option>
      <option>Comportamento inadequado</option>
      <option>Dano ao veículo</option>
      <option>Problema dentro da garantia (30 dias)</option>
    </select>
    <div class="label">Descrição</div>
    <textarea class="input" rows="3" placeholder="Descreva o que aconteceu..."></textarea>
    <div style="display:flex;gap:8px">
      <button class="btn btn-outline btn-sm" style="flex:1" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-red btn-sm" style="flex:1" onclick="submitClaim()">Enviar</button>
    </div>`;
  document.getElementById('modalBg').style.display = 'flex';
}

/** Submit the claim and notify the customer. */
function submitClaim() {
  closeModal();
  showToast('Reclamação enviada. Admin notificado em até 24h.');
}

// ─── Cancellation ────────────────────────────────────────────────────────────

/** Select a cancellation reason from the radio list (customer). */
function selectCancelReason(id) {
  document.querySelectorAll('.cancel-option').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById(id);
  if (el) el.classList.add('selected');
}

/** Select a cancellation reason (provider). */
function selectPCancelReason(id) {
  document.querySelectorAll('.cancel-option').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById(id);
  if (el) el.classList.add('selected');
}

/**
 * Confirm job cancellation.
 * @param {string} who - 'client' | 'provider'
 */
function confirmCancel(who) {
  showToast(who === 'client' ? '✓ Job cancelado.' : '⚠️ Cancelado. Impacta ranking.');
  goScreen(who === 'client' ? 's-home' : 'p-dashboard');
}

/** Confirm rescheduling to the selected new slot. */
function confirmReschedule() {
  showToast('✓ Reagendado! Prestador notificado.');
  goScreen('s-job-status');
}
