/**
 * AutoCare Prototype v11
 * src/core/supply.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supply chain mock data: suppliers, parts catalog, and job quotations.
 *
 * V1 Supply Chain Flow:
 *   1. Job created with a service that requires parts
 *   2. System creates a Quotation (status: 'pending')
 *   3. Admin contacts supplier manually (phone/WhatsApp — outside the system)
 *   4. Admin confirms quotation in the app → selects supplier and lead time
 *   5. Customer's calendar slots are unlocked (Fix 6)
 *   6. Parts delivered to provider's base address before service time
 *   7. Provider confirms receipt on the execution checklist (item 4)
 *
 * NOTE: "delivery included" — the part price is the negotiated price with
 * delivery to the provider address already included. No markup by the platform.
 */

'use strict';

// ─── Suppliers ────────────────────────────────────────────────────────────────
/**
 * 3 active suppliers for the Vila Madalena trial.
 * leadTimeH: hours from order confirmation to delivery at provider address.
 */
const suppliers = [
  {
    id: 1,
    name: 'AutoPeças SP Centro',
    contact: '(11) 3001-1234',
    region: 'SP · Centro',
    cats: ['Filtros', 'Fluidos', 'Elétrica', 'Reparos'],
    leadTimeH: 2,
    active: true,
  },
  {
    id: 2,
    name: 'Distribuidora Norte SP',
    contact: '(11) 3002-5678',
    region: 'SP · Zona Norte',
    cats: ['Filtros', 'Fluidos', 'Pneus'],
    leadTimeH: 4,
    active: true,
  },
  {
    id: 3,
    name: 'Estética Auto Insumos',
    contact: '(11) 3003-9012',
    region: 'SP · Vila Madalena',
    cats: ['Estética', 'Ar-condicionado'],
    leadTimeH: 1,
    active: true,
  },
];

// ─── Parts Catalog ─────────────────────────────────────────────────────────────
/**
 * Parts currently stocked by the platform.
 * price: negotiated unit price including delivery to provider address.
 */
const parts = [
  {
    id: 1,
    name: 'Óleo motor 5W30 (1L)',
    cat: 'Fluidos',
    supplierId: 1,
    price: 38,
    unit: 'litro',
    available: true,
  },
  {
    id: 2,
    name: 'Filtro de óleo universal',
    cat: 'Filtros',
    supplierId: 1,
    price: 25,
    unit: 'unid',
    available: true,
  },
  {
    id: 3,
    name: 'Filtro de ar (pequeno)',
    cat: 'Filtros',
    supplierId: 1,
    price: 32,
    unit: 'unid',
    available: true,
  },
  {
    id: 4,
    name: 'Bateria 60Ah selada',
    cat: 'Elétrica',
    supplierId: 1,
    price: 320,
    unit: 'unid',
    available: true,
  },
  {
    id: 5,
    name: 'Palheta dianteira (par)',
    cat: 'Reparos',
    supplierId: 1,
    price: 42,
    unit: 'par',
    available: true,
  },
];

// ─── Quotations ───────────────────────────────────────────────────────────────
/**
 * Active parts quotations linked to jobs.
 *
 * Status transitions:
 *   pending    → admin has not yet confirmed with supplier → calendar LOCKED (Fix 6)
 *   confirmed  → admin confirmed → calendar UNLOCKED, parts in transit
 *   unavailable → supplier cannot fulfill → admin must find alternative
 *
 * Key business rule: a job's time slots stay LOCKED (shown as 🔒 to customer)
 * until the admin marks this quotation as 'confirmed'.
 */
let quotations = [
  {
    id: 1,
    jobId: '#2047',
    service: 'Troca de óleo + filtro',
    client: 'Marcello Costa',
    bairro: 'Vila Madalena',
    scheduledDate: '06 mai · 11:00',
    parts: [
      { partId: 1, qty: 4, unitPrice: 38, total: 152 }, // 4L óleo 5W30
      { partId: 2, qty: 1, unitPrice: 25, total: 25  }, // filtro de óleo
    ],
    status: 'confirmed', // ← Calendar UNLOCKED for this job
    supplierId: 1,
    totalParts: 177,
    confirmedAt: '05 mai · 09:30',
    leadTimeH: 2,
  },
  {
    id: 2,
    jobId: '#2048',
    service: 'Troca de bateria',
    client: 'Ana Lima',
    bairro: 'Pinheiros',
    scheduledDate: '06 mai · 14:00',
    parts: [
      { partId: 4, qty: 1, unitPrice: 320, total: 320 }, // bateria 60Ah
    ],
    status: 'pending', // ← Calendar LOCKED — admin must confirm
    supplierId: null,
    totalParts: 320,
    confirmedAt: null,
    leadTimeH: null,
  },
  {
    id: 3,
    jobId: '#2051',
    service: 'Troca de filtro de ar',
    client: 'Roberto Souza',
    bairro: 'Jardins',
    scheduledDate: '07 mai · 09:00',
    parts: [
      { partId: 3, qty: 1, unitPrice: 32, total: 32 }, // filtro de ar
    ],
    status: 'pending', // ← Calendar LOCKED
    supplierId: null,
    totalParts: 32,
    confirmedAt: null,
    leadTimeH: null,
  },
];
