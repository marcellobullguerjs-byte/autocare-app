/**
 * AutoCare Prototype v11
 * src/core/engine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Core business logic engines:
 *   - Score Engine: calculates provider ranking score from raw stats
 *   - Helpers: time conversion utilities
 *   - Slot Engine (Fix 6): calculates available time slots for a service,
 *     respecting provider availability, existing bookings, parts lead time,
 *     and admin confirmation status of quotations
 *   - Agenda Engine (Fix 1 & 2): provider schedule helpers
 */

'use strict';

// ═════════════════════════════════════════════════════════════════════════════
// SCORE ENGINE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Calculate a provider's ranking score from their raw performance stats.
 *
 * Formula:
 *   score = (notaMedia/5 × 10) × 0.40    ← customer rating (40%)
 *         + (jobsConcluidos/total × 10) × 0.25  ← completion rate (25%)
 *         + (pontualidade/100 × 10) × 0.20     ← punctuality (20%)
 *         + max(0, 10 - reclamacoes × 1.5) × 0.15  ← complaints (15%)
 *
 * @param {Object} provider - A provider object from PROVIDERS array
 * @returns {number} Score between 0 and 10, rounded to 1 decimal
 */
function calcScore(provider) {
  const s = provider.stats;
  if (!s || s.jobsTotal === 0) return 0;

  const nota       = (s.notaMedia / 5) * 10;
  const conclusao  = (s.jobsConcluidos / s.jobsTotal) * 10;
  const pontual    = (s.pontualidade / 100) * 10;
  const reclam     = Math.max(0, 10 - (s.reclamacoes * 1.5));

  return +(nota * 0.40 + conclusao * 0.25 + pontual * 0.20 + reclam * 0.15).toFixed(1);
}

/**
 * Determine a provider's tier based on their score.
 *
 * Tiers:
 *   Diamante: score >= 9.0 — highest dispatch priority
 *   Ouro:     score >= 8.0
 *   Prata:    score >= 7.0
 *   Bronze:   score <  7.0 — lowest dispatch priority
 *
 * @param {number} score
 * @returns {{ label: string, icon: string, color: string }}
 */
function getTier(score) {
  if (score >= 9) return { label: 'Diamante', icon: '💎', color: 'var(--purple)' };
  if (score >= 8) return { label: 'Ouro',     icon: '🥇', color: '#F57F17'       };
  if (score >= 7) return { label: 'Prata',    icon: '🥈', color: '#666'           };
  return               { label: 'Bronze',    icon: '🥉', color: '#CD7F32'       };
}

// ═════════════════════════════════════════════════════════════════════════════
// TIME HELPERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Convert "HH:MM" string to total minutes since midnight.
 * @param {string} t - Time string, e.g. "09:30"
 * @returns {number} Minutes since midnight, e.g. 570
 */
function t2m(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convert total minutes since midnight to "HH:MM" string.
 * @param {number} m - Minutes since midnight, e.g. 570
 * @returns {string} Time string, e.g. "09:30"
 */
function m2t(m) {
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}

// ═════════════════════════════════════════════════════════════════════════════
// SLOT ENGINE (Fix 6)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Check if a service's parts quotation has been confirmed by admin.
 *
 * Business rule: services that require parts have their calendar slots LOCKED
 * (shown as 🔒 to the customer) until the admin confirms the quotation in the
 * Supply Chain screen.
 *
 * In Phase 2, this is a real-time DB lookup. In the prototype, it searches the
 * quotations array for a matching confirmed entry.
 *
 * @param {number} svcId - Service ID from catalog
 * @returns {boolean} true if parts are confirmed (or not required), false if locked
 */
function isPartsConfirmed(svcId) {
  const svc = catalog.find(s => s.id === svcId);
  if (!svc || !svc.parts) return true; // No parts needed → always unlocked

  // Check if any quotation for this service name is confirmed
  return quotations.some(q => q.service === svc.name && q.status === 'confirmed');
}

/**
 * Calculate available time slots for a service on a given date.
 *
 * Algorithm:
 *   1. Find all approved providers matching: region + specialty
 *   2. For each provider, generate their working window for that day
 *   3. Filter out slots occupied by existing bookings
 *   4. If service requires parts:
 *      a. If parts not confirmed by admin → all slots are 'partsLocked'
 *      b. If confirmed → slots before (dayStart + leadTimeH) are 'partsWait'
 *   5. A slot is 'available' only if N consecutive slots are all free
 *      (N = service.slots, e.g. 60-min service needs 2 consecutive 30-min slots)
 *
 * @param {string} bairro - Neighborhood for matching providers
 * @param {number} svcId  - Service ID from catalog
 * @param {string} dateStr - Date in "YYYY-MM-DD" format
 * @returns {Array<[string, {available, booked, partsWait, partsLocked}]>}
 *   Sorted array of [timeString, statusObject] pairs
 */
function getAvailableSlots(bairro, svcId, dateStr) {
  const svc = catalog.find(s => s.id === svcId);
  if (!svc) return [];

  const slotsNeeded = svc.slots;
  const leadTimeH   = svc.parts ? svc.leadTimeH : 0;
  const partsOk     = isPartsConfirmed(svcId);
  const dow         = new Date(dateStr + 'T12:00:00').getDay();
  const dk          = DAY_KEYS[dow];

  // Match providers: approved, covers this neighborhood, has the right specialty
  const matched = PROVIDERS.filter(p =>
    p.status === 'approved' &&
    p.region.includes(bairro) &&
    p.specialty.some(sp => svc.provider.includes(sp)) &&
    p.availability[dk] &&
    p.availability[dk].on
  );

  // Build a slot map: timeStr → status
  const slotMap = {};

  matched.forEach(provider => {
    const av = provider.availability[dk];
    if (!av || !av.on) return;

    const startM   = t2m(av.start);
    const endM     = t2m(av.end);
    const earliestM = startM + (leadTimeH * 60); // Parts must arrive first
    const booked   = provider.booked[dateStr] || [];

    for (let m = startM; m < endM; m += SLOT_MIN) {
      const time = m2t(m);
      if (!slotMap[time]) {
        slotMap[time] = { available: false, booked: false, partsWait: false, partsLocked: false };
      }

      // Rule 1: If parts not confirmed by admin → slot is locked
      if (!partsOk) {
        slotMap[time].partsLocked = true;
        continue;
      }

      // Rule 2: If parts need to arrive first and it's too early → partsWait
      if (svc.parts && m < earliestM) {
        slotMap[time].partsWait = true;
        continue;
      }

      // Rule 3: Check if N consecutive slots are all free for this provider
      let consecutiveFree = true;
      for (let s = 0; s < slotsNeeded; s++) {
        const slotM = m + s * SLOT_MIN;
        if (slotM >= endM || booked.includes(m2t(slotM))) {
          consecutiveFree = false;
          break;
        }
      }

      if (consecutiveFree) {
        slotMap[time].available = true;
      } else if (!slotMap[time].available) {
        slotMap[time].booked = true;
      }
    }
  });

  return Object.entries(slotMap).sort((a, b) => a[0].localeCompare(b[0]));
}

/**
 * Get a count of available slots per day for a given month.
 * Used to color calendar days (blue = has slots, gray = no slots).
 *
 * @param {string} bairro
 * @param {number} svcId
 * @param {number} month - 0-indexed month
 * @param {number} year
 * @returns {Object} { dayNumber: availableSlotCount }
 */
function getDaysWithSlots(bairro, svcId, month, year) {
  const result   = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const slots   = getAvailableSlots(bairro, svcId, dateStr);
    result[d]     = slots.filter(([, v]) => v.available).length;
  }
  return result;
}

// ═════════════════════════════════════════════════════════════════════════════
// AGENDA ENGINE (Fix 1 & 2)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Build the provider's flexible schedule configuration UI.
 * Renders each day of the week with:
 *   - On/Off toggle
 *   - Start time input (type=time, any value accepted)
 *   - End time input (type=time, any value accepted)
 *
 * Fix 1: replaced fixed 08:00–18:00 with free-form time inputs.
 * Any hours are valid: nights (13:00–20:00), Sundays, etc.
 */
function buildAgendaConfig() {
  const card = document.getElementById('agendaDaysCard');
  if (!card) return;
  card.innerHTML = '';

  const labels = { dom: 'Dom', seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb' };

  DAY_KEYS.forEach(dk => {
    const ag  = providerAgenda[dk];
    const row = document.createElement('div');
    row.className = 'agenda-day-row' + (ag.on ? '' : ' disabled');
    row.id        = 'arow-' + dk;

    row.innerHTML = `
      <div class="agenda-day-label">${labels[dk]}</div>
      <div class="toggle ${ag.on ? 'on' : ''}" id="atog-${dk}" onclick="toggleAgendaDay('${dk}')"></div>
      <div class="agenda-time-inputs" id="atime-${dk}">
        <input type="time" class="time-input" id="astart-${dk}"
               value="${ag.start}" onchange="updateAgendaTime('${dk}', 'start', this.value)">
        <span style="font-size:11px;color:var(--muted)">até</span>
        <input type="time" class="time-input" id="aend-${dk}"
               value="${ag.end}" onchange="updateAgendaTime('${dk}', 'end', this.value)">
      </div>`;

    card.appendChild(row);
  });
}

/**
 * Toggle a day on or off in the provider's schedule.
 * @param {string} dk - Day key, e.g. 'seg', 'dom'
 */
function toggleAgendaDay(dk) {
  providerAgenda[dk].on = !providerAgenda[dk].on;

  const tog = document.getElementById('atog-' + dk);
  if (tog) tog.classList.toggle('on', providerAgenda[dk].on);

  const row = document.getElementById('arow-' + dk);
  if (row) row.classList.toggle('disabled', !providerAgenda[dk].on);
}

/**
 * Update a time field (start or end) for a day in the provider's schedule.
 * @param {string} dk    - Day key
 * @param {string} field - 'start' or 'end'
 * @param {string} val   - New time value, e.g. "13:00"
 */
function updateAgendaTime(dk, field, val) {
  providerAgenda[dk][field] = val;
}

/** Persist the schedule (in prototype: just shows a toast). */
function saveAgenda() {
  showToast('✓ Agenda salva! Slots atualizados.');
}

/**
 * Switch between the two agenda sub-tabs.
 * @param {string} tab - 'config' | 'view'
 */
function switchAgendaTab(tab) {
  document.getElementById('agenda-config').style.display = tab === 'config' ? 'block' : 'none';
  document.getElementById('agenda-view').style.display   = tab === 'view'   ? 'block' : 'none';
  ['config', 'view'].forEach(t => {
    const el = document.getElementById('atab-' + t);
    if (el) el.classList.toggle('active', t === tab);
  });
  if (tab === 'view') buildAgendaDayView();
}

// ─── Fix 2: Day View (occupied vs free slots) ─────────────────────────────────

/** Navigation offset for the day view (0 = today, +1 = tomorrow, etc.) */
let agendaViewOffset = 0;

/**
 * Navigate the day view forward or backward.
 * @param {number} dir - +1 or -1
 */
function changeAgendaDay(dir) {
  agendaViewOffset += dir;
  buildAgendaDayView();
}

/**
 * Build the "Ver hoje" day view for the provider.
 * Shows each 30-min slot in the provider's working window as:
 *   - Green "Livre" — available
 *   - Gray "Job confirmado" — booked (from BOOKED_TODAY / BOOKED_TOMORROW mock data)
 *
 * Also shows summary stats: free count, occupied count, estimated earnings.
 */
function buildAgendaDayView() {
  // Simulated base date: May 6, 2025 (Tuesday)
  const baseDate = new Date(2025, 4, 6);
  baseDate.setDate(baseDate.getDate() + agendaViewOffset);

  const dk        = DAY_KEYS[baseDate.getDay()];
  const ag        = providerAgenda[dk];
  const dateLabel = document.getElementById('agendaViewDate');

  if (dateLabel) {
    const prefix = agendaViewOffset === 0 ? 'Hoje · ' : '';
    dateLabel.textContent = `${prefix}${WEEKDAYS[baseDate.getDay()]}, ${baseDate.getDate()} ${MONTHS[baseDate.getMonth()].substring(0, 3)}`;
  }

  const booked = agendaViewOffset === 0 ? BOOKED_TODAY
               : agendaViewOffset === 1 ? BOOKED_TOMORROW
               : [];

  const el = document.getElementById('agendaDaySlots');
  if (!el) return;

  // Day is off
  if (!ag.on) {
    el.innerHTML = '<div class="info-box info-yellow" style="text-align:center">Dia não configurado como dia de trabalho.</div>';
    ['agFreeCount', 'agOccCount'].forEach(id => { const e = document.getElementById(id); if (e) e.textContent = '0'; });
    const earn = document.getElementById('agEarnCount');
    if (earn) earn.textContent = 'R$ 0';
    return;
  }

  el.innerHTML = '';

  const startM = t2m(ag.start);
  const endM   = t2m(ag.end);
  let freeCount = 0, occCount = 0, earn = 0;

  for (let m = startM; m < endM; m += SLOT_MIN) {
    const time  = m2t(m);
    const endT  = m2t(m + SLOT_MIN);
    const isOcc = booked.includes(time);

    if (isOcc) { occCount++; earn += 220; } else { freeCount++; }

    const row = document.createElement('div');
    row.className = `day-slot-row ${isOcc ? 'occupied' : 'free'}`;
    row.innerHTML = `
      <div class="day-slot-dot ${isOcc ? 'dot-occ' : 'dot-free'}"></div>
      <div style="flex:1">
        <span style="font-size:13px;font-weight:500">${time}</span>
        <span style="font-size:11px;color:var(--muted)"> – ${endT}</span>
      </div>
      ${isOcc
        ? '<span class="badge badge-orange" style="font-size:10px">Job confirmado</span>'
        : '<span class="badge badge-green"  style="font-size:10px">Livre</span>'}`;
    el.appendChild(row);
  }

  const freeEl = document.getElementById('agFreeCount');
  const occEl  = document.getElementById('agOccCount');
  const earnEl = document.getElementById('agEarnCount');
  if (freeEl) freeEl.textContent = freeCount;
  if (occEl)  occEl.textContent  = occCount;
  if (earnEl) earnEl.textContent = `R$ ${earn}`;
}
