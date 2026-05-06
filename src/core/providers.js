/**
 * AutoCare Prototype v11
 * src/core/providers.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Mock provider data for the V1 Vila Madalena trial.
 *
 * 5 providers total:
 *   - Carlos Ribeiro: Mecânico/Eletricista · approved · Score ~8.7
 *   - João Santos:    Mecânico · approved · Score ~7.8
 *   - Maria Lima:     Detailer/Lavador · approved · Score ~9.3
 *   - Paulo Mendes:   Funileiro · pending (awaiting admin review)
 *   - Lucas Prado:    Mecânico · suspended (recurrent complaints)
 *
 * Each provider has:
 *   - Personal info and status
 *   - Specialties list (determines which jobs they can receive)
 *   - Region list (determines which neighborhoods they serve)
 *   - availability: per-day config { on, start, end } (Fix 1: flexible hours)
 *   - booked: { "YYYY-MM-DD": ["HH:MM", ...] } — slots already taken
 *   - stats: raw numbers used by the score engine
 */

'use strict';

const PROVIDERS = [
  {
    id: 1,
    name: 'Carlos Ribeiro',
    initials: 'CR',
    color: 'av-b', // CSS class for avatar background
    email: 'carlos@email.com',
    specialty: ['Mecânico', 'Eletricista'],
    region: ['Vila Madalena', 'Pinheiros', 'Jardins'],
    status: 'approved', // approved | pending | suspended | rejected
    joinDate: '10 mar 2025',
    rating: 5.0,
    jobs: 48,
    available: true,
    docs: { rg: true, endereco: true, selfie: true, banco: true },
    suspendReason: null,
    stats: {
      notaMedia: 4.7,
      jobsConcluidos: 48,
      jobsTotal: 50,
      pontualidade: 82,      // percentage 0-100
      reclamacoes: 1,        // total upheld complaints
      cancelamentos: 2,
    },
    // Fix 1: flexible schedule — provider sets their own hours per day
    availability: {
      dom: { on: false, start: '08:00', end: '18:00' },
      seg: { on: true,  start: '08:00', end: '18:00' },
      ter: { on: true,  start: '08:00', end: '18:00' },
      qua: { on: true,  start: '08:00', end: '18:00' },
      qui: { on: true,  start: '08:00', end: '18:00' },
      sex: { on: true,  start: '08:00', end: '18:00' },
      sab: { on: true,  start: '08:00', end: '13:00' },
    },
    // Booked slots: date string → array of start times (30-min blocks)
    booked: {
      '2025-05-06': ['08:00', '08:30', '11:00', '11:30'],
      '2025-05-07': ['09:00', '09:30'],
    },
  },
  {
    id: 2,
    name: 'João Santos',
    initials: 'JS',
    color: 'av-g',
    email: 'joao@email.com',
    specialty: ['Mecânico'],
    region: ['Pinheiros', 'Jardins', 'Itaim Bibi'],
    status: 'approved',
    joinDate: '22 jan 2025',
    rating: 4.2,
    jobs: 31,
    available: true,
    docs: { rg: true, endereco: true, selfie: true, banco: true },
    suspendReason: null,
    stats: {
      notaMedia: 4.2,
      jobsConcluidos: 31,
      jobsTotal: 33,
      pontualidade: 76,
      reclamacoes: 0,
      cancelamentos: 2,
    },
    availability: {
      dom: { on: false, start: '09:00', end: '17:00' },
      seg: { on: true,  start: '09:00', end: '17:00' },
      ter: { on: true,  start: '09:00', end: '17:00' },
      qua: { on: false, start: '09:00', end: '17:00' },
      qui: { on: true,  start: '09:00', end: '17:00' },
      sex: { on: true,  start: '09:00', end: '17:00' },
      sab: { on: false, start: '09:00', end: '17:00' },
    },
    booked: {
      '2025-05-06': ['10:00', '10:30'],
    },
  },
  {
    id: 3,
    name: 'Maria Lima',
    initials: 'ML',
    color: 'av-o',
    email: 'maria@email.com',
    specialty: ['Detailer', 'Lavador'],
    region: ['Vila Madalena', 'Pinheiros', 'Moema'],
    status: 'approved',
    joinDate: '05 fev 2025',
    rating: 4.9,
    jobs: 22,
    available: true,
    docs: { rg: true, endereco: true, selfie: true, banco: true },
    suspendReason: null,
    stats: {
      notaMedia: 4.9,
      jobsConcluidos: 22,
      jobsTotal: 22,
      pontualidade: 95,
      reclamacoes: 0,
      cancelamentos: 0,
    },
    availability: {
      dom: { on: false, start: '08:00', end: '17:00' },
      seg: { on: true,  start: '08:00', end: '17:00' },
      ter: { on: true,  start: '08:00', end: '17:00' },
      qua: { on: true,  start: '08:00', end: '17:00' },
      qui: { on: true,  start: '08:00', end: '17:00' },
      sex: { on: true,  start: '08:00', end: '17:00' },
      sab: { on: true,  start: '09:00', end: '14:00' },
    },
    booked: {
      '2025-05-06': ['08:00', '08:30', '09:00', '09:30'],
    },
  },
  {
    id: 4,
    name: 'Paulo Mendes',
    initials: 'PM',
    color: 'av-p',
    email: 'paulo@email.com',
    specialty: ['Funileiro'],
    region: ['Moema', 'Brooklin'],
    status: 'pending',   // Awaiting admin review — cannot receive jobs
    joinDate: '27 abr 2025',
    rating: 0,
    jobs: 0,
    available: false,
    docs: { rg: true, endereco: true, selfie: false, banco: false },
    suspendReason: null,
    stats: {
      notaMedia: 0,
      jobsConcluidos: 0,
      jobsTotal: 0,
      pontualidade: 0,
      reclamacoes: 0,
      cancelamentos: 0,
    },
    availability: {},
    booked: {},
  },
  {
    id: 5,
    name: 'Lucas Prado',
    initials: 'LP',
    color: 'av-r',
    email: 'lucas@email.com',
    specialty: ['Mecânico'],
    region: ['Brooklin', 'Vila Olímpia'],
    status: 'suspended', // Suspended — not eligible for dispatch
    joinDate: '15 dez 2024',
    rating: 3.8,
    jobs: 14,
    available: false,
    docs: { rg: true, endereco: true, selfie: true, banco: true },
    suspendReason: 'Reclamações recorrentes',
    stats: {
      notaMedia: 3.2,
      jobsConcluidos: 14,
      jobsTotal: 18,
      pontualidade: 60,
      reclamacoes: 4,
      cancelamentos: 4,
    },
    availability: {},
    booked: {},
  },
];
