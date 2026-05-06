/**
 * AutoCare Prototype v11
 * src/core/state.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Global application state for the single-page prototype.
 *
 * In Phase 2 (real backend), this is replaced by:
 *   - Supabase Auth session (user identity)
 *   - Server-side DB (jobs, bookings, quotations)
 *   - React/Next.js state management (UI state)
 *   - Supabase Realtime subscriptions (live updates)
 *
 * For the prototype, everything lives here in memory.
 * State resets on page reload.
 */

'use strict';

// ─── Customer Vehicles ────────────────────────────────────────────────────────
/**
 * Vehicles registered by the mock customer (Marcello Costa).
 * Fix 5 allows adding new vehicles via the Add Vehicle form.
 */
let vehicles = [
  {
    id: 1,
    marca: 'Volkswagen',
    modelo: 'Gol',
    ano: '2019',
    comb: 'Flex',
    placa: 'ABC-1234',
    cor: 'Branco',
    apelido: 'Meu Gol',
  },
  {
    id: 2,
    marca: 'Toyota',
    modelo: 'Corolla',
    ano: '2021',
    comb: 'Flex',
    placa: 'XYZ-5678',
    cor: 'Prata',
    apelido: 'Corolla',
  },
];
let nextVehId = 3;

// ─── Vehicle Service History ───────────────────────────────────────────────────
const vehicleHistory = {
  1: {
    name: 'VW Gol 2019',
    plate: 'ABC-1234',
    svcs: [
      { id: 1, date: '15 abr 2025', svc: 'Troca de óleo + filtro', prov: 'Carlos Ribeiro', price: 240, nota: 5, status: 'completed', foto: true  },
      { id: 2, date: '10 mar 2025', svc: 'Scanner / diagnóstico OBD',  prov: 'Carlos Ribeiro', price: 80,  nota: 4, status: 'completed', foto: true  },
      { id: 3, date: '05 fev 2025', svc: 'Calibragem',                 prov: 'João Santos',   price: 20,  nota: 5, status: 'completed', foto: false },
    ],
  },
  2: {
    name: 'Toyota Corolla 2021',
    plate: 'XYZ-5678',
    svcs: [
      { id: 1, date: '20 abr 2025', svc: 'Higienização interna',    prov: 'Maria Lima',    price: 150, nota: 5, status: 'completed', foto: true  },
      { id: 2, date: '15 mar 2025', svc: 'Polimento leve',          prov: 'Maria Lima',    price: 200, nota: 5, status: 'completed', foto: true  },
      { id: 3, date: '10 fev 2025', svc: 'Troca de filtro de cabine', prov: 'Carlos Ribeiro', price: 80,  nota: 5, status: 'completed', foto: true  },
      { id: 4, date: '05 jan 2025', svc: 'Check-up geral',          prov: 'João Santos',   price: 120, nota: 4, status: 'completed', foto: false },
    ],
  },
};

// ─── Claims ───────────────────────────────────────────────────────────────────
let claims = [
  {
    id: 1,
    jobId: '#2044',
    service: 'Troca de palhetas',
    client: 'Fernanda Dias',
    provider: 'Carlos Ribeiro',
    providerId: 1,
    date: '03 mai',
    type: 'Serviço não foi realizado corretamente',
    desc: 'As palhetas ainda estão deixando marcas no vidro após a troca.',
    status: 'pending',
    resolution: null,
  },
  {
    id: 2,
    jobId: '#2039',
    service: 'Higienização interna',
    client: 'Roberto Andrade',
    provider: 'Lucas Prado',
    providerId: 5,
    date: '28 abr',
    type: 'Comportamento inadequado',
    desc: 'Prestador foi grosseiro durante o atendimento ao cliente.',
    status: 'pending',
    resolution: null,
  },
  {
    id: 3,
    jobId: '#2031',
    service: 'Troca de filtro de ar',
    client: 'Ana Lima',
    provider: 'João Santos',
    providerId: 2,
    date: '20 abr',
    type: 'Serviço não realizado corretamente',
    desc: 'Filtro não foi trocado, apenas limpo superficialmente.',
    status: 'resolved',
    resolution: 'Score reduzido. Prestador notificado via app.',
  },
];

// ─── Payments ─────────────────────────────────────────────────────────────────
const payments = [
  { id: 1, jobId: '#2047', service: 'Troca de óleo + filtro',   client: 'Marcello Costa',  value: 240, status: 'released', method: 'Cartão', time: '11:54', provider: 'Carlos Ribeiro' },
  { id: 2, jobId: '#2046', service: 'Check-up geral',           client: 'Lúcia Carvalho',  value: 120, status: 'released', method: 'Pix',    time: '09:47', provider: 'Carlos Ribeiro' },
  { id: 3, jobId: '#2044', service: 'Higienização interna',     client: 'Fernanda Dias',   value: 150, status: 'released', method: 'Pix',    time: '08:30', provider: 'Maria Lima'     },
  { id: 4, jobId: '#2043', service: 'Calibragem',               client: 'Roberto Souza',   value: 20,  status: 'released', method: 'Cartão', time: '08:00', provider: 'João Santos'    },
  { id: 5, jobId: '#2048', service: 'Troca de bateria',         client: 'Ana Lima',        value: 440, status: 'waiting',  method: 'Cartão', time: '14:00', provider: 'Carlos Ribeiro' },
  { id: 6, jobId: '#2049', service: 'Scanner OBD',              client: 'Pedro Monteiro',  value: 80,  status: 'waiting',  method: 'Pix',    time: '15:30', provider: 'João Santos'    },
  { id: 7, jobId: '#2051', service: 'Troca de filtro de ar',    client: 'Roberto Andrade', value: 92,  status: 'pending',  method: 'Cartão', time: '09:00', provider: '—'              },
  { id: 8, jobId: '#2055', service: 'Martelinho PDR',           client: 'Pedro Lima',      value: 200, status: 'pending',  method: 'Pix',    time: '10:00', provider: '—'              },
];

// ─── Provider Agenda (Fix 1 & 2) ─────────────────────────────────────────────
/**
 * The currently logged-in provider's working schedule.
 * Each day entry: { on: boolean, start: "HH:MM", end: "HH:MM" }
 * Any hours are valid — nights, weekends, etc.
 * Saved via saveAgenda() which updates slot availability in real time.
 */
let providerAgenda = {
  dom: { on: false, start: '08:00', end: '18:00' },
  seg: { on: true,  start: '08:00', end: '18:00' },
  ter: { on: true,  start: '08:00', end: '18:00' },
  qua: { on: true,  start: '08:00', end: '18:00' },
  qui: { on: true,  start: '08:00', end: '18:00' },
  sex: { on: true,  start: '08:00', end: '18:00' },
  sab: { on: true,  start: '08:00', end: '13:00' },
};

// Simulated booked slots for the "Ver hoje" view (Fix 2)
const BOOKED_TODAY    = ['09:00', '09:30', '14:00', '14:30'];
const BOOKED_TOMORROW = ['10:00'];

// ─── Job Flow State ───────────────────────────────────────────────────────────
/**
 * Tracks the customer's current in-progress job request.
 * Populated step by step through the 6-step Job Flow.
 * Reset when a new job is started or after creation.
 */
let jobState = {
  service:      null,                           // Selected catalog service object
  vehicle:      { id: 1, label: 'VW Gol 2019', plate: 'ABC-1234' },
  description:  '',                             // Problem description (Step 2)
  bairro:       'Vila Madalena',                // Selected neighborhood (Step 4)
  addrLabel:    'Rua Harmonia, 120',            // Display label for address
  selectedDate: null,                           // "YYYY-MM-DD"
  selectedSlot: null,                           // "HH:MM"
  price:        0,                              // Final price (service + parts)
};

// ─── UI State ─────────────────────────────────────────────────────────────────
let calMonth = 4;          // Calendar: current month (0-indexed). 4 = May
let calYear  = 2025;       // Calendar: current year

let currentView   = 'admin';   // 'client' | 'provider' | 'admin'
let navHistory    = [];         // Screen navigation stack for Back button
let currentScreen = 'a-dashboard';

// Admin filter states
let activeFilter        = 'Todos';  // Service catalog filter
let provFilter          = 'Todos';  // Provider list filter
let dispatchFilterState = 'Todos';  // Dispatch list filter
let quotFilterState     = 'Todos';  // Quotations filter
let rankFilter          = 'Todos';  // Ranking filter
let claimsFilter        = 'Todos';  // Claims filter
let currentSupply       = 'q';      // Supply chain active tab: 'q' | 'p' | 's'
let payTab              = 'today';  // Payments active tab: 'today' | 'pending' | 'all'

// Provider state
let selectedVehicle     = 2;         // Which vehicle tab is active in history
let currentStar         = 0;         // Star rating selection (0 = not rated)
let chkState            = { 1: false, 2: false, 3: false, 4: false }; // Job checklist
let agendaViewOffset    = 0;         // Day offset in "Ver hoje" view (Fix 2)
let selectedReallocId   = null;      // Provider selected in realloc modal

// Dispatch countdown
let countdownInterval   = null;
let countdownSecs       = 900; // 15 * 60

// Admin CRUD
let nextSvcId = 26;  // Also defined in catalog.js — whichever loads last wins
let editingId = null; // Service being edited in catalog modal
