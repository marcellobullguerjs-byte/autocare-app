/**
 * AutoCare Prototype v11
 * src/provider/provider.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Provider-side logic:
 *   - Job offer: 15-minute countdown, accept/reject
 *   - Job execution: mandatory 4-step checklist with photos
 *   - Cancellation with reason logging
 *   - Ranking screen rendering
 *   - Navigation helpers for the provider bottom nav
 */

'use strict';

// ═════════════════════════════════════════════════════════════════════════════
// DISPATCH COUNTDOWN
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Start the 15-minute countdown timer on the job offer screen.
 * Updates the circular SVG arc and the numeric display every second.
 * Turns red in the last 2 minutes.
 * If timer expires: shows toast and returns to dashboard (simulated auto-decline).
 *
 * In Phase 2: server-side timer. Client subscribes to the offer record via
 * Supabase Realtime; expiry is enforced by a pg_cron / Edge Function job.
 */
function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownSecs = DISPATCH_TIMEOUT_SECONDS;
  updateCountdown();

  countdownInterval = setInterval(() => {
    countdownSecs--;
    if (countdownSecs <= 0) {
      clearInterval(countdownInterval);
      showToast('⏱ Tempo esgotado!');
      goScreen('p-dashboard');
    } else {
      updateCountdown();
    }
  }, 1000);
}

/**
 * Update the countdown display and SVG arc.
 * Called every second by startCountdown().
 */
function updateCountdown() {
  const numEl = document.getElementById('countdownNum');
  const arcEl = document.getElementById('countdownArc');
  if (!numEl || !arcEl) return;

  const m = Math.floor(countdownSecs / 60);
  const s = countdownSecs % 60;
  numEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  // Arc fills clockwise: dashoffset goes from 213.6 (empty) to 0 (full)
  arcEl.style.strokeDashoffset = String(213.6 * (1 - countdownSecs / DISPATCH_TIMEOUT_SECONDS));

  const urgent = countdownSecs <= 120; // Last 2 minutes
  numEl.className   = 'countdown-num' + (urgent ? ' urgent' : '');
  arcEl.style.stroke = urgent ? 'var(--red)' : 'var(--blue)';
}

/** Provider accepts the job offer. */
function acceptOffer() {
  if (countdownInterval) clearInterval(countdownInterval);
  goScreen('p-offer-accepted');
}

/** Provider rejects the job offer (goes to reason selection screen). */
function rejectOffer() {
  if (countdownInterval) clearInterval(countdownInterval);
  goScreen('p-offer-rejected');
}

/** Confirm offer rejection (after reason selected). */
function confirmReject() {
  showToast('Recusa registrada.');
  goScreen('p-dashboard');
}

// ═════════════════════════════════════════════════════════════════════════════
// JOB EXECUTION CHECKLIST
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Toggle a checklist item in the job execution screen.
 * Enforces order constraints:
 *   - Item 3 (photo after) requires item 2 (start execution) first
 *   - Item 4 (confirm parts) requires item 3 (photo after) first
 *
 * @param {number} n - Checklist item number (1–4)
 */
function doChk(n) {
  if (n === 3 && !chkState[2]) {
    showToast('⚠️ Inicie a execução primeiro (item 2)');
    return;
  }
  if (n === 4 && !chkState[3]) {
    showToast('⚠️ Envie a foto depois primeiro');
    return;
  }

  chkState[n] = !chkState[n];
  const box = document.getElementById('chk' + n);
  if (!box) return;
  box.classList.toggle('checked', chkState[n]);
  box.textContent = chkState[n] ? '✓' : '';

  // Show start timestamp when item 2 is checked
  if (n === 2 && chkState[2]) {
    const el = document.getElementById('startTimeEl');
    if (el) {
      const now = new Date();
      el.style.display = 'block';
      el.textContent   = `▶ Iniciado às ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
  }
}

/**
 * Simulate photo upload for a checklist item.
 * Marks the photo box as uploaded and auto-checks the corresponding checklist item.
 *
 * @param {string} type - 'before' | 'after'
 */
function uploadExecPhoto(type) {
  const boxId = type === 'before' ? 'photoBefore' : 'photoAfter';
  const box   = document.getElementById(boxId);
  if (!box) return;

  box.classList.add('uploaded');
  box.innerHTML = `
    <div style="font-size:28px;margin-bottom:4px">📸</div>
    <div style="font-size:11px;color:var(--green);font-weight:500">✓ Foto enviada</div>`;

  // Auto-check the corresponding checklist item
  const itemNum = type === 'before' ? 1 : 3;
  if (!chkState[itemNum]) {
    chkState[itemNum] = true;
    const b = document.getElementById('chk' + itemNum);
    if (b) { b.classList.add('checked'); b.textContent = '✓'; }
  }
}

/**
 * Attempt to finalize job execution.
 * Validates all 4 checklist items are complete.
 * Shows a warning listing any missing items if not.
 *
 * In Phase 2: PATCH /api/jobs/:id/finalize → uploads photos to Supabase Storage,
 * sets job status to 'awaiting_approval', triggers customer notification.
 */
function finalizeExec() {
  const missing = [];
  if (!chkState[1]) missing.push('Foto antes');
  if (!chkState[2]) missing.push('Início');
  if (!chkState[3]) missing.push('Foto depois');
  if (!chkState[4]) missing.push('Peças');

  if (missing.length > 0) {
    const w = document.getElementById('chkWarning');
    if (w) {
      w.style.display = 'block';
      w.textContent   = `⚠️ Pendentes: ${missing.join(', ')}`;
    }
    showToast('⚠️ Complete todos os itens');
    return;
  }

  goScreen('p-job-done');
  showToast('✓ Job finalizado! Aguardando aprovação.');
}

// ═════════════════════════════════════════════════════════════════════════════
// RANKING SCREEN
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Build the provider's ranking screen.
 * Shows overall score, tier badge, and breakdown bars for each component.
 * Uses the mock Carlos Ribeiro data (PROVIDERS[0]).
 *
 * The breakdown matches the score engine formula:
 *   nota × 40% + conclusão × 25% + pontualidade × 20% + reclamações × 15%
 */
function buildProviderRanking() {
  // In the prototype the logged-in provider is always Carlos Ribeiro (id=1)
  const provider = PROVIDERS[0];
  const score    = calcScore(provider);
  const tier     = getTier(score);

  // The ranking screen HTML is static in index.html, values are hardcoded there.
  // In Phase 2 this function would dynamically populate the screen.
  // For now it just ensures the screen is visible.
}

// ═════════════════════════════════════════════════════════════════════════════
// PROVIDER NAVIGATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Navigate via the provider bottom navigation bar.
 * Resets history and updates active nav item.
 * @param {string} n - Nav key: 'dash' | 'exec' | 'ranking' | 'agenda' | 'profile'
 */
function pNavTo(n) {
  navHistory = [];
  document.querySelectorAll('#provNav .nav-item').forEach(ni => ni.classList.remove('active'));
  const el = document.getElementById('pnav-' + n);
  if (el) el.classList.add('active');

  const screenMap = {
    dash:    'p-dashboard',
    exec:    'p-job-exec',
    ranking: 'p-ranking',
    agenda:  'p-agenda',
    profile: 'p-profile',
  };
  showScreen(screenMap[n] || 'p-dashboard');
}

// ─── Mock Upload (for document upload in registration) ────────────────────────
/**
 * Simulate a document file upload in the registration flow.
 * Changes button appearance to show success.
 * @param {HTMLButtonElement} btn - The upload button element
 */
function mockUpload(btn) {
  btn.textContent         = '✓ Enviado';
  btn.style.background    = 'var(--green-light)';
  btn.style.color         = 'var(--green)';
  btn.disabled            = true;
}
