/**
 * AutoCare Prototype v11
 * src/client/jobflow.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Customer job request flow: 6-step wizard.
 *
 * Step 1: Vehicle selection (or add new vehicle)
 * Step 2: Problem description + optional photo
 * Step 3: Parts validation — checks quotation status, shows lock warning (Fix 6)
 * Step 4: Address selection (home / work / other neighborhood)
 * Step 5: Calendar + time slot selection (slot engine enforces lock/lead rules)
 * Step 6: Order confirmation + payment method
 *
 * After confirmation: job created, dispatch begins.
 */

'use strict';

// ─── Step Progress Bar ─────────────────────────────────────────────────────────
/**
 * Update the 6-step progress bar at the top of all Job Flow screens.
 * @param {number} step - Current step (1–6)
 */
function buildProg(step) {
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById('jp' + i);
    if (!el) continue;
    el.innerHTML = '';
    for (let j = 1; j <= 6; j++) {
      const d = document.createElement('div');
      d.className = 'progress-step' + (j < step ? ' done' : j === step ? ' active' : '');
      el.appendChild(d);
    }
  }
}

// ─── Start Job (from service list) ─────────────────────────────────────────────
/**
 * Initialize the job flow when customer taps a service.
 * Resets jobState and navigates to Step 1 (vehicle selection).
 * @param {Object} svc - Service object from catalog
 */
function startJob(svc) {
  jobState.service      = svc;
  jobState.price        = svc.price;
  jobState.selectedDate = null;
  jobState.selectedSlot = null;

  document.getElementById('jfSvcName').textContent = svc.name;
  document.getElementById('jfSvcMeta').textContent =
    `${svc.cat} · R$ ${svc.price} · ${svc.time}min${svc.parts ? ` · peça ${svc.leadTimeH}h` : ''}`;

  buildProg(1);
  buildVehOptions();
  navHistory.push(currentScreen);
  showScreen('jf-vehicle');
}

/**
 * Navigate forward in the job flow to a specific screen and step.
 * @param {string} screen - Target screen ID
 * @param {number} step   - Step number for progress bar
 */
function jfGo(screen, step) {
  buildProg(step);
  navHistory.push(currentScreen);
  showScreen(screen);
}

// ─── Step 1: Vehicle Options ──────────────────────────────────────────────────
/**
 * Build the vehicle selection cards in Step 1.
 * Dynamically generated from the vehicles array (Fix 5 adds new ones).
 */
function buildVehOptions() {
  const el = document.getElementById('vehList');
  if (!el) return;
  el.innerHTML = '';

  vehicles.forEach((v, i) => {
    const d   = document.createElement('div');
    d.className = 'veh-option' + (i === 0 ? ' selected' : '');
    d.id        = 'vopt-' + v.id;
    d.innerHTML = `
      <div class="veh-icon">🚗</div>
      <div>
        <div style="font-size:13px;font-weight:500">${v.marca} ${v.modelo}</div>
        <div style="font-size:11px;color:var(--muted)">${v.ano} · ${v.placa} · ${v.comb}</div>
      </div>`;
    d.onclick = () => {
      document.querySelectorAll('.veh-option').forEach(e => e.classList.remove('selected'));
      d.classList.add('selected');
      jobState.vehicle = { id: v.id, label: `${v.marca} ${v.modelo} ${v.ano}`, plate: v.placa };
    };
    el.appendChild(d);
  });

  // Pre-select first vehicle
  if (vehicles.length > 0) {
    jobState.vehicle = {
      id:    vehicles[0].id,
      label: `${vehicles[0].marca} ${vehicles[0].modelo} ${vehicles[0].ano}`,
      plate: vehicles[0].placa,
    };
  }
}

// ─── Step 3: Parts Check ───────────────────────────────────────────────────────
/**
 * Step 2 → 3 transition. Reads the problem description, then:
 * - If service has no parts: skip to Step 4 (address)
 * - If service has parts: show the parts validation screen with:
 *     a. 1.5s loading animation (simulated API call)
 *     b. Part availability card
 *     c. Lead time warning (orange)
 *     d. Admin lock warning (red) if quotation is not confirmed (Fix 6)
 */
function goToPartCheck() {
  const descEl = document.getElementById('jfDesc');
  jobState.description = descEl ? (descEl.value || 'Serviço de rotina') : 'Serviço de rotina';

  const svc = jobState.service;

  if (svc && svc.parts) {
    buildProg(3);
    navHistory.push(currentScreen);
    showScreen('jf-parts');

    // Reset all cards
    const partsCard    = document.getElementById('partsCard');
    const continueBtn  = document.getElementById('partsContinueBtn');
    const leadWarning  = document.getElementById('partsLeadWarning');
    const adminWarning = document.getElementById('partsAdminWarning');
    const progressBar  = document.getElementById('partsBar');

    [partsCard, continueBtn, leadWarning, adminWarning].forEach(el => {
      if (el) el.style.display = 'none';
    });

    // Restart loading animation
    if (progressBar) {
      progressBar.style.animation = 'none';
      setTimeout(() => { progressBar.style.animation = 'prog2 1.5s ease forwards'; }, 50);
    }

    // Simulate async parts check (1.6 seconds)
    setTimeout(() => {
      const extra    = Math.round(svc.price * 0.35);
      jobState.price = svc.price + extra;

      const nameEl  = document.getElementById('partItemName');
      const priceEl = document.getElementById('partTotalPrice');
      const breakEl = document.getElementById('partBreak');
      const leadEl  = document.getElementById('partLeadInfo');

      if (nameEl)  nameEl.textContent  = svc.name + ' (peça)';
      if (priceEl) priceEl.textContent = `R$ ${jobState.price}`;
      if (breakEl) breakEl.textContent = `Serviço R$ ${svc.price} + Peça R$ ${extra}`;
      if (leadEl)  leadEl.textContent  = `Entrega em ${svc.leadTimeH}h ao prestador`;
      if (partsCard) partsCard.style.display = 'block';

      // Fix 6: show the correct warning based on quotation status
      const confirmed = isPartsConfirmed(svc.id);
      if (!confirmed) {
        // Parts not yet confirmed by admin → slot calendar will show locks
        if (adminWarning) adminWarning.style.display = 'block';
      } else {
        // Parts confirmed → just show the lead time info
        if (leadWarning) {
          leadWarning.style.display = 'block';
          const explainEl = document.getElementById('partsLeadExplain');
          if (explainEl) {
            explainEl.textContent = `Fornecedor entrega em ${svc.leadTimeH}h. Horários ajustados automaticamente.`;
          }
        }
      }

      if (continueBtn) continueBtn.style.display = 'block';
    }, 1600);

  } else {
    // No parts → go directly to address selection
    navHistory.push(currentScreen);
    showScreen('jf-address');
  }
}

// ─── Step 4: Address Selection ─────────────────────────────────────────────────
/**
 * Handle customer selecting a service address.
 * Updates jobState and shows provider availability info for the selected neighborhood.
 *
 * @param {string} type      - 'home' | 'work' | 'other'
 * @param {string} bairro    - Neighborhood name
 * @param {string} addrLabel - Display string for the address
 */
function selectJobAddr(type, bairro, addrLabel) {
  // Deselect all and select chosen
  document.querySelectorAll('.addr-option').forEach(e => e.classList.remove('selected'));
  const el = document.getElementById('ja-' + type);
  if (el) el.classList.add('selected');

  // Show/hide the "other" neighborhood dropdown
  document.getElementById('otherAddrForm').style.display = type === 'other' ? 'block' : 'none';

  if (!bairro) bairro = 'Vila Madalena';
  jobState.bairro    = bairro;
  jobState.addrLabel = addrLabel || bairro;

  // Count compatible providers in this neighborhood
  const matched = PROVIDERS.filter(p =>
    p.status === 'approved' &&
    p.region.includes(bairro) &&
    jobState.service &&
    p.specialty.some(sp => jobState.service.provider.includes(sp))
  );

  const card   = document.getElementById('addrMatchCard');
  const title  = document.getElementById('addrMatchTitle');
  const detail = document.getElementById('addrMatchDetail');

  if (matched.length > 0) {
    if (card)   card.style.background = 'var(--blue-light)';
    if (title)  { title.style.color = 'var(--blue)'; title.textContent = '✓ Prestadores disponíveis'; }
    if (detail) detail.textContent = `${matched.length} prestador(es) · ${bairro}`;
  } else {
    if (card)   card.style.background = 'var(--red-light)';
    if (title)  { title.style.color = 'var(--red)'; title.textContent = '⚠️ Sem prestadores'; }
    if (detail) detail.textContent = 'Tente outro endereço';
  }
}

// ─── Step 5: Calendar ─────────────────────────────────────────────────────────
/**
 * Build the monthly calendar for slot selection.
 * Days with available slots are shown in blue; days with no slots are gray.
 * Clicking a day with slots triggers showSlots() for that day.
 *
 * @param {string} calId   - ID of the month label element
 * @param {string} daysId  - ID of the calendar grid element
 * @param {number} svcId   - Service ID (defaults to 1)
 */
function buildCalendar(calId, daysId, svcId) {
  svcId = svcId || 1;

  const lbl  = document.getElementById(calId);
  if (lbl) lbl.textContent = `${MONTHS[calMonth]} ${calYear}`;

  const grid = document.getElementById(daysId);
  if (!grid) return;
  grid.innerHTML = '';

  const dws      = getDaysWithSlots(jobState.bairro, svcId, calMonth, calYear);
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysIn   = new Date(calYear, calMonth + 1, 0).getDate();

  // Blank cells before month start
  for (let i = 0; i < firstDay; i++) {
    const d = document.createElement('div');
    d.className = 'cal-day other';
    grid.appendChild(d);
  }

  // Day cells
  for (let d = 1; d <= daysIn; d++) {
    const el     = document.createElement('div');
    const ds     = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const count  = dws[d] || 0;
    const isSel  = jobState.selectedDate === ds;
    const isResched = daysId === 'reschedDays';

    el.className = 'cal-day' + (isSel ? ' selected' : count > 0 ? ' has-slots' : ' no-slots');
    el.textContent = d;

    if (count > 0) {
      el.onclick = () => {
        jobState.selectedDate = ds;
        jobState.selectedSlot = null;
        buildCalendar(calId, daysId, svcId);
        showSlots(ds, svcId, isResched ? 'reschedSlotsGrid' : 'slotsGrid', isResched);
      };
    }
    grid.appendChild(el);
  }

  // Update info bar with parts lock status
  const si = document.getElementById('schedInfo');
  if (si) {
    const svc = jobState.service;
    const locked = svc && svc.parts && !isPartsConfirmed(svc.id);
    si.textContent = `📍 ${jobState.bairro}`
      + (svc && svc.parts ? ` · peça ${svc.leadTimeH}h antes` : '')
      + (locked ? ' · 🔒 aguardando confirmação admin' : '');
  }
}

/**
 * Navigate calendar by one month.
 * @param {number} dir - +1 or -1
 */
function changeCalMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0)  { calMonth = 11; calYear--; }

  if (currentScreen === 'jf-schedule') {
    buildCalendar('calMonthLabel', 'calDays', jobState.service ? jobState.service.id : 1);
  }
  if (currentScreen === 's-reschedule') {
    buildCalendar('reschedCalLabel', 'reschedDays', 1);
  }
}

/**
 * Show the time slot grid for a selected day.
 * Each slot is rendered with its status:
 *   - Blue (available): clickable, updates jobState.selectedSlot
 *   - Orange (partsWait): parts confirmed but too early (lead time not passed)
 *   - Gray 🔒 (partsLocked): admin has not confirmed parts
 *   - Gray (booked): already taken by another job
 *
 * @param {string}  ds        - Date string "YYYY-MM-DD"
 * @param {number}  svcId     - Service ID
 * @param {string}  gridId    - ID of the slot grid element
 * @param {boolean} isResched - True if this is the reschedule calendar
 */
function showSlots(ds, svcId, gridId, isResched) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '';

  const svc = catalog.find(s => s.id === svcId) || catalog[0];

  getAvailableSlots(jobState.bairro, svcId, ds).forEach(([time, data]) => {
    const d      = document.createElement('div');
    const endTime = m2t(t2m(time) + svc.slots * SLOT_MIN);

    if (data.available) {
      d.className = 'slot' + (jobState.selectedSlot === time ? ' selected' : '');
      d.innerHTML = `<div class="sh">${time}</div><div class="sd">até ${endTime}</div>`;
      d.onclick   = () => {
        document.querySelectorAll(`#${gridId} .slot.selected`).forEach(s => s.classList.remove('selected'));
        d.classList.add('selected');
        jobState.selectedSlot = time;
        if (!isResched) fillConfirm(svc, time, endTime);
        const btn = document.getElementById(isResched ? 'reschedConfirmBtn' : 'schedContinueBtn');
        if (btn) btn.style.display = 'block';
      };
    } else if (data.partsWait) {
      d.className = 'slot parts-wait';
      d.innerHTML = `<div class="sh">${time}</div><div class="sd">⏱ peça</div>`;
    } else if (data.partsLocked) {
      d.className = 'slot parts-locked';
      d.innerHTML = `<div class="sh">${time}</div><div class="sd">🔒 bloq.</div>`;
    } else {
      d.className = 'slot booked';
      d.innerHTML = `<div class="sh">${time}</div><div class="sd">Ocupado</div>`;
    }

    grid.appendChild(d);
  });

  const ss = document.getElementById(isResched ? 'reschedSlots' : 'slotsSection');
  if (ss) ss.style.display = 'block';

  const lbl = document.getElementById('slotsDateLabel');
  if (lbl) {
    const dt = new Date(ds + 'T12:00:00');
    lbl.textContent = `${dt.getDate()} de ${MONTHS[dt.getMonth()]} · horários disponíveis`;
  }
}

// ─── Step 6: Confirmation ─────────────────────────────────────────────────────
/**
 * Populate the confirmation screen (Step 6) with job summary details.
 *
 * @param {Object} svc     - Selected service
 * @param {string} time    - Start time "HH:MM"
 * @param {string} endTime - End time "HH:MM"
 */
function fillConfirm(svc, time, endTime) {
  const dt = new Date(jobState.selectedDate + 'T12:00:00');

  const fields = {
    cfSvc:   svc.name,
    cfVeh:   jobState.vehicle.label,
    cfAddr:  jobState.addrLabel,
    cfDate:  `${dt.getDate()} de ${MONTHS[dt.getMonth()]}`,
    cfTime:  `${time} – ${endTime}`,
    cfPrice: `R$ ${jobState.price}`,
  };
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
  buildProg(6);
}

/** Payment method selector on the confirmation screen. */
function selectPay(type) {
  document.getElementById('payCard').style.border = type === 'card' ? '2px solid var(--blue)' : '0.5px solid var(--border)';
  document.getElementById('payPix').style.border  = type === 'pix'  ? '2px solid var(--blue)' : '0.5px solid var(--border)';
}

/**
 * Finalize the job creation.
 * In prototype: updates UI and shows success screen.
 * In Phase 2: POST to /api/jobs, triggers Supabase Realtime dispatch event.
 */
function createJob() {
  const svc = jobState.service;
  if (!svc) return;

  const infoEl = document.getElementById('jobCreatedInfo');
  const dateEl = document.getElementById('jcDate');

  if (infoEl) infoEl.textContent = `${svc.name} · ${jobState.addrLabel} · ${jobState.selectedDate} ${jobState.selectedSlot}`;
  if (dateEl) dateEl.textContent  = `${jobState.selectedDate} às ${jobState.selectedSlot}`;

  showToast('✓ Job criado! Alocando prestador...');
  navHistory = [];
  showScreen('jf-created');
}
