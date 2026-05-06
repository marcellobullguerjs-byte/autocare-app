/**
 * AutoCare Prototype v11
 * src/core/catalog.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Service catalog: 25 services across 9 categories.
 * Each service defines: name, category, required provider type, price,
 * duration in minutes, number of 30-min slots required, whether it needs a
 * physical part, and the part lead time (hours from supplier to provider address).
 *
 * Admin CRUD operations on this data are in src/admin/catalog.js.
 * To add a service: append an entry here. The UI rebuilds dynamically.
 */

'use strict';

import { loadServices } from './db.js'

let catalog = [
  // ─── Manutenção ─────────────────────────────────────────────────────────────
  {
    id: 1,
    name: 'Troca de óleo + filtro',
    cat: 'Manutenção',
    price: 180,
    time: 60,
    slots: 2,
    parts: true,
    provider: 'Mecânico',
    leadTimeH: 2,
    active: true,
  },
  {
    id: 2,
    name: 'Troca de filtro de ar',
    cat: 'Manutenção',
    price: 60,
    time: 20,
    slots: 1,
    parts: true,
    provider: 'Mecânico',
    leadTimeH: 2,
    active: true,
  },
  {
    id: 3,
    name: 'Troca de filtro de cabine',
    cat: 'Manutenção',
    price: 50,
    time: 20,
    slots: 1,
    parts: true,
    provider: 'Mecânico',
    leadTimeH: 2,
    active: true,
  },
  {
    id: 4,
    name: 'Troca de fluido de freio',
    cat: 'Manutenção',
    price: 90,
    time: 60,
    slots: 2,
    parts: true,
    provider: 'Mecânico',
    leadTimeH: 2,
    active: true,
  },
  // ─── Elétrica ────────────────────────────────────────────────────────────────
  {
    id: 5,
    name: 'Troca de bateria',
    cat: 'Elétrica',
    price: 120,
    time: 30,
    slots: 1,
    parts: true,
    provider: 'Eletricista/Mecânico',
    leadTimeH: 3,
    active: true,
  },
  {
    id: 6,
    name: 'Troca de lâmpadas',
    cat: 'Elétrica',
    price: 60,
    time: 15,
    slots: 1,
    parts: true,
    provider: 'Eletricista',
    leadTimeH: 2,
    active: true,
  },
  {
    id: 7,
    name: 'Troca de fusíveis',
    cat: 'Elétrica',
    price: 40,
    time: 15,
    slots: 1,
    parts: false,
    provider: 'Eletricista',
    leadTimeH: 0,
    active: true,
  },
  {
    id: 8,
    name: 'Scanner / diagnóstico OBD',
    cat: 'Elétrica',
    price: 80,
    time: 30,
    slots: 1,
    parts: false,
    provider: 'Mecânico',
    leadTimeH: 0,
    active: true,
  },
  // ─── Pneus ───────────────────────────────────────────────────────────────────
  {
    id: 9,
    name: 'Reparo de furo',
    cat: 'Pneus',
    price: 50,
    time: 30,
    slots: 1,
    parts: false,
    provider: 'Mecânico',
    leadTimeH: 0,
    active: true,
  },
  {
    id: 10,
    name: 'Troca de pneu',
    cat: 'Pneus',
    price: 80,
    time: 45,
    slots: 2,
    parts: true,
    provider: 'Mecânico',
    leadTimeH: 4,
    active: true,
  },
  {
    id: 11,
    name: 'Calibragem',
    cat: 'Pneus',
    price: 20,
    time: 10,
    slots: 1,
    parts: false,
    provider: 'Mecânico',
    leadTimeH: 0,
    active: true,
  },
  // ─── Funilaria ───────────────────────────────────────────────────────────────
  {
    id: 12,
    name: 'Reparo de risco superficial',
    cat: 'Funilaria',
    price: 150,
    time: 90,
    slots: 3,
    parts: false,
    provider: 'Funileiro',
    leadTimeH: 0,
    active: true,
  },
  {
    id: 13,
    name: 'Martelinho de ouro (PDR)',
    cat: 'Funilaria',
    price: 200,
    time: 90,
    slots: 3,
    parts: false,
    provider: 'Funileiro',
    leadTimeH: 0,
    active: true,
  },
  {
    id: 14,
    name: 'Reparo leve de para-choque',
    cat: 'Funilaria',
    price: 250,
    time: 120,
    slots: 4,
    parts: false,
    provider: 'Funileiro',
    leadTimeH: 0,
    active: true,
  },
  // ─── Estética ────────────────────────────────────────────────────────────────
  {
    id: 15,
    name: 'Higienização interna',
    cat: 'Estética',
    price: 150,
    time: 120,
    slots: 4,
    parts: false,
    provider: 'Detailer',
    leadTimeH: 0,
    active: true,
  },
  {
    id: 16,
    name: 'Polimento leve',
    cat: 'Estética',
    price: 200,
    time: 180,
    slots: 6,
    parts: false,
    provider: 'Detailer',
    leadTimeH: 0,
    active: true,
  },
  {
    id: 17,
    name: 'Limpeza técnica',
    cat: 'Estética',
    price: 120,
    time: 90,
    slots: 3,
    parts: false,
    provider: 'Detailer',
    leadTimeH: 0,
    active: true,
  },
  // ─── Ar-condicionado ─────────────────────────────────────────────────────────
  {
    id: 18,
    name: 'Higienização do ar-condicionado',
    cat: 'Ar-condicionado',
    price: 130,
    time: 45,
    slots: 2,
    parts: false,
    provider: 'Mecânico',
    leadTimeH: 0,
    active: true,
  },
  // ─── Inspeção ────────────────────────────────────────────────────────────────
  {
    id: 19,
    name: 'Check-up geral',
    cat: 'Inspeção',
    price: 120,
    time: 45,
    slots: 2,
    parts: false,
    provider: 'Mecânico',
    leadTimeH: 0,
    active: true,
  },
  {
    id: 20,
    name: 'Inspeção pré-compra',
    cat: 'Inspeção',
    price: 150,
    time: 60,
    slots: 2,
    parts: false,
    provider: 'Mecânico',
    leadTimeH: 0,
    active: true,
  },
  // ─── Reparos Rápidos ─────────────────────────────────────────────────────────
  {
    id: 21,
    name: 'Troca de palhetas',
    cat: 'Reparos Rápidos',
    price: 45,
    time: 10,
    slots: 1,
    parts: true,
    provider: 'Mecânico',
    leadTimeH: 2,
    active: true,
  },
  {
    id: 22,
    name: 'Ajustes simples',
    cat: 'Reparos Rápidos',
    price: 50,
    time: 20,
    slots: 1,
    parts: false,
    provider: 'Mecânico',
    leadTimeH: 0,
    active: true,
  },
  // ─── Lavagem ─────────────────────────────────────────────────────────────────
  {
    id: 23,
    name: 'Lavagem tradicional',
    cat: 'Lavagem',
    price: 50,
    time: 45,
    slots: 2,
    parts: false,
    provider: 'Lavador',
    leadTimeH: 0,
    active: true,
  },
  {
    id: 24,
    name: 'Lavagem a seco',
    cat: 'Lavagem',
    price: 60,
    time: 45,
    slots: 2,
    parts: false,
    provider: 'Lavador',
    leadTimeH: 0,
    active: true,
  },
  {
    id: 25,
    name: 'Lavagem premium',
    cat: 'Lavagem',
    price: 100,
    time: 90,
    slots: 3,
    parts: false,
    provider: 'Lavador',
    leadTimeH: 0,
    active: true,
  },
];

// Auto-increment counter for admin-created services
let nextSvcId = 26;

async function loadServicesFromDB() {
  const { data, error } = await supabase
    .from('services')
    .select('*')

  console.log('SERVICES FROM DB:', data)
  console.log('ERROR:', error)
}

async function loadServicesFromDB() {
  console.log("FUNCAO LOAD RODANDO")

const { data, error } = await supabase
    .from('services')
    .select('*')

  console.log('SERVICES FROM DB:', data)

  if (!data || data.length === 0) return

  // 🔥 converter dados do banco → formato do app
  catalog = data.map(row => ({
    id: row.id,
    name: row.name,
    cat: row.category,
    price: row.base_price,
    time: row.duration_min,
    slots: row.slots,
    parts: row.requires_parts,
    provider: row.provider_type,
    leadTimeH: 0,
    active: row.active
  }))

  console.log('CATALOG ATUALIZADO:', catalog)

  // 🔁 reconstruir telas
  if (typeof buildCatGrid === 'function') buildCatGrid()
  if (typeof buildAdminCatalog === 'function') buildAdminCatalog()
}

async function initializeCatalogFromDB() {
  const dbServices = await loadServices()

  if (dbServices.length > 0) {
    catalog = dbServices
    console.log('Catalog loaded from Supabase:', catalog)

    if (typeof buildCatGrid === 'function') buildCatGrid()
    if (typeof buildAdminCatalog === 'function') buildAdminCatalog()
  }
}

initializeCatalogFromDB()