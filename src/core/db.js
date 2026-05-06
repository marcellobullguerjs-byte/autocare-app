/**
 * AutoCare — Database Adapter
 * Converte rows do Supabase para o formato esperado pelo protótipo.
 */
import { supabase } from '../supabase.js'

// ─── SERVIÇOS ────────────────────────────────────────────────────────────────

export async function loadServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('legacy_id')

  if (error) {
    console.error('Erro ao carregar serviços:', error)
    return []
  }

  return data.map(row => ({
    id:        row.legacy_id,      // ← ID numérico para compatibilidade
    uuid:      row.id,             // ← UUID real para operações no Supabase
    name:      row.name,
    cat:       row.category,
    price:     Number(row.price),
    time:      row.duration_min,
    slots:     row.slots,
    parts:     row.requires_parts,
    provider:  row.provider_type,
    leadTimeH: row.part_lead_time_h || 0,
    active:    row.active
  }))
}

// ─── PRESTADORES ─────────────────────────────────────────────────────────────

export async function loadProviders() {
  const { data, error } = await supabase
    .from('providers')
    .select(`*, users (name, email, phone)`)

  if (error) {
    console.error('Erro ao carregar prestadores:', error)
    return []
  }

  return data.map(row => ({
    id:           row.id,
    userId:       row.user_id,
    name:         row.users?.name,
    email:        row.users?.email,
    phone:        row.users?.phone,
    specialties:  row.specialties || [],
    regions:      row.regions || [],
    status:       row.status,
    score:        Number(row.score || 0),
    stats:        row.stats || {},
    availability: row.availability || {},
    certified:    row.training_certified,
    joinedAt:     row.joined_at
  }))
}

// ─── FORNECEDORES ─────────────────────────────────────────────────────────────

export async function loadSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('active', true)

  if (error) {
    console.error('Erro ao carregar fornecedores:', error)
    return []
  }

  return data.map(row => ({
    id:         row.id,
    name:       row.name,
    contact:    row.contact,
    region:     row.region,
    categories: row.categories || [],
    leadTimeH:  row.lead_time_h,
    active:     row.active
  }))
}

// ─── VEÍCULOS DO CLIENTE ──────────────────────────────────────────────────────

export async function loadVehicles(customerId) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('customer_id', customerId)

  if (error) {
    console.error('Erro ao carregar veículos:', error)
    return []
  }

  return data.map(row => ({
    id:    row.id,
    brand: row.brand,
    model: row.model,
    year:  row.year,
    fuel:  row.fuel,
    plate: row.plate,
    color: row.color,
    alias: row.alias
  }))
}

// ─── JOBS ─────────────────────────────────────────────────────────────────────

export async function loadJobs(filters = {}) {
  let query = supabase
    .from('jobs')
    .select(`
      *,
      customers (user_id, neighborhood),
      vehicles (brand, model, year, plate),
      services (name, category, provider_type)
    `)
    .order('created_at', { ascending: false })

  if (filters.customerId) query = query.eq('customer_id', filters.customerId)
  if (filters.status)     query = query.eq('status', filters.status)

  const { data, error } = await query

  if (error) {
    console.error('Erro ao carregar jobs:', error)
    return []
  }

  return data
}

export async function createJob(jobData) {
  const { data, error } = await supabase
    .from('jobs')
    .insert([jobData])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar job:', error)
    return null
  }

  return data
}

// ─── PERFIL DO USUÁRIO LOGADO ─────────────────────────────────────────────────

export async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Erro ao carregar perfil:', error)
    return null
  }

  return data
}