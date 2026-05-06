/**
 * AutoCare Prototype v11
 * src/shared/nav.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Navigation system — the spine of the entire single-page app.
 *
 * Every screen transition, back-button press, login/logout, view switch,
 * modal open/close, toast, and bottom-nav update goes through this file.
 *
 * Architecture:
 *   - showScreen(id)    : low-level — activate a screen, update chrome
 *   - goScreen(id)      : push current screen to history, then showScreen
 *   - goBack()          : pop history stack, call showScreen
 *   - doLogin(role)     : clear history, jump to home for that role
 *   - switchView(v)     : swap between client / provider / admin demo modes
 *   - navTo(n)          : customer bottom-nav
 *   - pNavTo(n)         : provider bottom-nav
 *
 * In Phase 2 (Next.js):
 *   Replace with Next.js App Router — each screen becomes a route.
 *   navHistory → browser history API.
 *   showScreen side-effects → per-page useEffect() hooks.
 */

'use strict';

// ─── Core: Show Screen ────────────────────────────────────────────────────────

/**
 * Activate a screen by ID. This is the central dispatch point:
 *   1. Deactivates all screens, activates the target
 *   2. Shows/hides topbar, view tabs, bottom navs based on context
 *   3. Updates back-button visibility
 *   4. Updates avatar and title in the topbar
 *   5. Triggers any screen-specific initialization (build* functions)
 *
 * @param {string} id - Screen element ID, e.g. 's-home', 'a-dashboard'
 */
function showScreen(id) {
  // 1. Activate target screen
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(id);
  if (screen) { screen.classList.add('active'); currentScreen = id; }

  // 2. Determine context
  const isAuth     = AUTH_SCREENS.includes(id);
  const isProvider = id.startsWith('p-') && !isAuth;
  const isClient   = (id.startsWith('s-') || id.startsWith('jf-')) && !isAuth;

  // 3. Chrome visibility
  document.getElementById('topbar').style.display    = isAuth ? 'none' : 'flex';
  document.getElementById('viewTabs').style.display  = isAuth ? 'none' : 'flex';
  document.getElementById('bottomNav').style.display = isClient   ? 'flex' : 'none';
  document.getElementById('provNav').style.display   = isProvider ? 'flex' : 'none';

  // 4. Back button — only if there's history and we're not in auth flow
  document.getElementById('backBtn').style.display =
    navHistory.length > 0 && !isAuth ? 'block' : 'none';

  // 5. Topbar content
  document.getElementById('avatarEl').textContent = isProvider ? 'CR' : 'MC';
  document.getElementById('topTitle').textContent = SCREEN_TITLES[id] || 'AutoCare';

  // 6. Screen-specific initialization
  _initScreen(id);
}

/**
 * Per-screen initialization hooks.
 * Called by showScreen() every time a screen is activated.
 * Each case is responsible for rendering dynamic content into the screen's container elements.
 *
 * @param {string} id - Screen ID
 */
function _initScreen(id) {
  switch (id) {

    // ── Customer screens ──────────────────────────────────────────────────────
    case 's-home':
      buildCatGrid();
      break;

    case 'jf-vehicle':
      buildVehOptions();
      break;

    case 'jf-schedule':
      buildCalendar('calMonthLabel', 'calDays', jobState.service ? jobState.service.id : 1);
      break;

    case 's-reschedule':
      buildCalendar('reschedCalLabel', 'reschedDays', 1);
      break;

    case 's-vehicle-history':
      // Use the currently selected vehicle tab (default: 2 = Corolla)
      switchVehicle(selectedVehicle);
      break;

    case 's-vehicles':
      buildVehicleListScreen();
      break;

    // ── Provider screens ──────────────────────────────────────────────────────
    case 'p-offer':
      // Start the 15-minute acceptance countdown
      startCountdown();
      break;

    case 'p-agenda':
      buildAgendaConfig();
      switchAgendaTab('config');
      break;

    // ── Admin screens ─────────────────────────────────────────────────────────
    case 'a-services':
      buildAdminCatalog();
      break;

    case 'a-providers':
      buildProviderList();
      break;

    case 'a-dispatch':
      buildDispatchList();
      break;

    case 'a-supply':
      switchSupply(currentSupply);
      break;

    case 'a-ranking':
      buildRanking();
      break;

    case 'a-claims':
      buildClaims();
      break;

    case 'a-payments':
      switchPayTab('today');
      break;

    default:
      break;
  }

  // Stop countdown when leaving the offer screen
  if (id !== 'p-offer' && countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

// ─── Navigation Helpers ───────────────────────────────────────────────────────

/**
 * Navigate to a screen, pushing current screen onto the history stack.
 * The Back button will return to the previous screen.
 * Use this for forward navigation within a flow.
 *
 * @param {string} id - Target screen ID
 */
function goScreen(id) {
  navHistory.push(currentScreen);
  showScreen(id);
}

/**
 * Navigate back to the previous screen.
 * Pops the history stack — mirrors browser Back button behavior.
 * If history is empty, does nothing.
 */
function goBack() {
  if (navHistory.length > 0) {
    const prev = navHistory.pop();
    showScreen(prev);
  }
}

// Back button click handler — wired up once on page load
document.getElementById('backBtn').addEventListener('click', goBack);

// ─── Auth / Login ─────────────────────────────────────────────────────────────

/**
 * Simulate login for a given role.
 * Clears navigation history and jumps to the role's home screen.
 *
 * In Phase 2: replaced by Supabase Auth.signIn() + redirect based on user.role.
 *
 * @param {string} role - 'client' | 'provider' | 'admin'
 */
function doLogin(role) {
  navHistory = [];
  const home = { client: 's-home', provider: 'p-dashboard', admin: 'a-dashboard' };
  showScreen(home[role] || 's-home');
}

// ─── View Switcher (Demo Mode) ────────────────────────────────────────────────

/**
 * Switch between client / provider / admin demo views.
 * Updates the view tab indicator and jumps to that role's entry screen.
 * Only exists in the prototype — in Phase 2 each role has its own app/subdomain.
 *
 * @param {string} v - 'client' | 'provider' | 'admin'
 */
function switchView(v) {
  currentView = v;
  navHistory  = [];

  // Update active tab indicator
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', ['client', 'provider', 'admin'][i] === v);
  });

  const entry = { client: 's-splash', provider: 'p-splash', admin: 'a-dashboard' };
  showScreen(entry[v]);
}

// ─── Customer Bottom Navigation ───────────────────────────────────────────────

/**
 * Navigate via the customer bottom navigation bar.
 * Clears history (bottom nav items are root-level destinations).
 *
 * @param {string} n - 'home' | 'vehicles' | 'history' | 'profile'
 */
function navTo(n) {
  navHistory = [];

  // Update active tab
  document.querySelectorAll('#bottomNav .nav-item').forEach(ni => ni.classList.remove('active'));
  const el = document.getElementById('nav-' + n);
  if (el) el.classList.add('active');

  const screenMap = {
    home:     's-home',
    vehicles: 's-vehicles',
    history:  's-vehicle-history',
    profile:  's-profile',
  };
  showScreen(screenMap[n] || 's-home');
}

// ─── Provider Bottom Navigation ───────────────────────────────────────────────

/**
 * Navigate via the provider bottom navigation bar.
 * @param {string} n - 'dash' | 'exec' | 'ranking' | 'agenda' | 'profile'
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

// ─── Modal ────────────────────────────────────────────────────────────────────

/**
 * Close the global modal overlay.
 * Triggered by clicking outside the modal box or by cancel buttons.
 * @param {Event} [e] - Click event (optional). Closes only if clicking the backdrop.
 */
function closeModal(e) {
  const bg = document.getElementById('modalBg');
  if (!e || e.target === bg) {
    bg.style.display = 'none';
  }
}

// ─── Toast Notification ───────────────────────────────────────────────────────

/**
 * Show a brief toast notification at the bottom of the app.
 * Auto-dismisses after 2.5 seconds.
 *
 * In Phase 2: replace with a React toast library (e.g. react-hot-toast).
 *
 * @param {string} msg - Message text to display
 */
function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = [
    'position:absolute', 'bottom:70px', 'left:50%', 'transform:translateX(-50%)',
    'background:#333', 'color:#fff', 'padding:8px 16px', 'border-radius:20px',
    'font-size:12px', 'z-index:200', 'white-space:nowrap',
    'max-width:320px', 'text-align:center',
  ].join(';');
  t.textContent = msg;
  document.getElementById('app').appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ─── Home Category Grid ───────────────────────────────────────────────────────

/**
 * Build the 2-column service category grid on the customer home screen.
 * Only shows categories that have at least one active service in the catalog.
 * Tapping a category navigates to the service list for that category.
 */
function buildCatGrid() {
  const g = document.getElementById('catGrid');
  if (!g) return;
  g.innerHTML = '';

  CATEGORIES.forEach(cat => {
    // Skip empty categories
    if (!catalog.some(s => s.cat === cat && s.active)) return;

    const d       = document.createElement('div');
    d.className   = 'cat';
    d.innerHTML   = `<div class="icon">${CAT_ICONS[cat]}</div><div class="name">${cat}</div>`;
    d.onclick     = () => openCategory(cat);
    g.appendChild(d);
  });
}

/**
 * Open a service category — build the service list and navigate to it.
 * @param {string} cat - Category name, e.g. 'Manutenção'
 */
function openCategory(cat) {
  navHistory.push(currentScreen);

  document.getElementById('svcCatTitle').textContent = `${CAT_ICONS[cat]} ${cat}`;

  const list = document.getElementById('svcList');
  list.innerHTML = '';

  catalog.filter(s => s.cat === cat && s.active).forEach(svc => {
    const partBadge = svc.parts
      ? `<span style="font-size:10px;background:var(--orange-light);color:var(--orange);padding:1px 5px;border-radius:4px;margin-left:4px">+peça</span>`
      : '';

    const d       = document.createElement('div');
    d.className   = 'svc-item';
    d.innerHTML   = `
      <div>
        <div style="font-size:13px;font-weight:500">${svc.name}${partBadge}</div>
        <div style="font-size:11px;color:var(--muted)">${svc.time}min · ${svc.provider}</div>
      </div>
      <div style="font-size:13px;font-weight:500;color:var(--blue)">R$ ${svc.price}</div>`;
    d.onclick     = () => startJob(svc);
    list.appendChild(d);
  });

  showScreen('s-svc-list');
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

// Initial screen on page load — start at admin dashboard for demo
showScreen('a-dashboard');
