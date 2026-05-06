/**
 * AutoCare Prototype v11
 * src/core/constants.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Application-wide constants: service categories, icon maps, calendar labels,
 * slot timing, brand/model catalog, and key configuration values.
 */

'use strict';

// ─── Service Categories ────────────────────────────────────────────────────────
const CATEGORIES = [
  'Manutenção', 'Elétrica', 'Pneus', 'Funilaria', 'Estética',
  'Ar-condicionado', 'Inspeção', 'Reparos Rápidos', 'Lavagem',
];

const CAT_ICONS = {
  'Manutenção': '🔧', 'Elétrica': '⚡', 'Pneus': '🛞',
  'Funilaria': '🎨', 'Estética': '✨', 'Ar-condicionado': '❄️',
  'Inspeção': '🔍', 'Reparos Rápidos': '🔩', 'Lavagem': '🛁',
};

// ─── Calendar Labels ───────────────────────────────────────────────────────────
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Internal day keys used to index provider availability objects.
 * Index matches Date.getDay() (0 = Sunday).
 */
const DAY_KEYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

// ─── Scheduling ────────────────────────────────────────────────────────────────
/** All time slots are 30 minutes wide. */
const SLOT_MIN = 30;

/** How long a provider has to accept a job offer (seconds). */
const DISPATCH_TIMEOUT_SECONDS = 15 * 60; // 15 minutes

// ─── Provider Types ────────────────────────────────────────────────────────────
const PROV_TYPES = [
  'Mecânico', 'Eletricista', 'Eletricista/Mecânico', 'Funileiro', 'Detailer', 'Lavador',
];

// ─── Screens in the auth/onboarding flow (no topbar / nav shown) ──────────────
const AUTH_SCREENS = [
  's-splash', 's-reg1', 's-reg2', 's-reg3',
  'p-splash', 'p-reg1', 'p-reg2', 'p-reg3', 'p-reg4', 'p-reg5', 'p-pending',
];

// ─── Vehicle Brands & Models (Fix 5) ─────────────────────────────────────────
/**
 * 14 brands with their available models.
 * The model dropdown in Add Vehicle is dynamically populated from this map.
 * To add new brands: add an entry here and it appears automatically in the form.
 */
const MODELS_BY_BRAND = {
  'Chevrolet':  ['Onix', 'Onix Plus', 'Tracker', 'Cruze', 'S10', 'Spin', 'Montana', 'Equinox'],
  'Fiat':       ['Pulse', 'Fastback', 'Cronos', 'Argo', 'Mobi', 'Toro', 'Strada', 'Doblo'],
  'Ford':       ['Territory', 'Bronco Sport', 'Ranger', 'Ka', 'EcoSport', 'Maverick'],
  'Honda':      ['Civic', 'HR-V', 'CR-V', 'City', 'Fit', 'WR-V', 'Accord'],
  'Hyundai':    ['HB20', 'HB20S', 'Creta', 'Tucson', 'Santa Fe', 'Azera'],
  'Jeep':       ['Compass', 'Renegade', 'Commander', 'Wrangler', 'Gladiator'],
  'Kia':        ['Sportage', 'Stonic', 'Carnival', 'Cerato', 'Seltos'],
  'Mitsubishi': ['Eclipse Cross', 'Outlander', 'ASX', 'L200 Triton', 'Pajero'],
  'Nissan':     ['Kicks', 'Frontier', 'Sentra', 'Versa'],
  'Peugeot':    ['208', '2008', '3008', '5008', 'Partner'],
  'Renault':    ['Kwid', 'Sandero', 'Logan', 'Duster', 'Oroch', 'Captur'],
  'Suzuki':     ['Jimny', 'Vitara', 'S-Cross', 'Swift'],
  'Toyota':     ['Corolla', 'Corolla Cross', 'Hilux', 'SW4', 'Yaris', 'RAV4', 'Prius'],
  'Volkswagen': ['Gol', 'Polo', 'Virtus', 'T-Cross', 'Nivus', 'Tiguan', 'Amarok', 'Saveiro'],
};

// ─── Screen Titles (shown in top navigation bar) ──────────────────────────────
const SCREEN_TITLES = {
  's-splash': 'AutoCare', 's-reg1': 'Criar conta', 's-reg2': 'Endereço',
  's-reg3': 'Trabalho', 's-home': 'AutoCare', 's-svc-list': 'Serviços',
  'jf-vehicle': 'Veículo', 'jf-problem': 'Problema', 'jf-parts': 'Validar peça',
  'jf-address': 'Local', 'jf-schedule': 'Horário', 'jf-confirm': 'Confirmar',
  'jf-created': 'Job criado!', 's-job-status': 'Status do job',
  's-approve': 'Aprovar serviço', 's-approved': 'Aprovado!',
  's-cancel-client': 'Cancelar job', 's-reschedule': 'Reagendar',
  's-vehicle-history': 'Histórico', 's-add-vehicle': 'Adicionar veículo',
  's-vehicles': 'Meus veículos', 's-profile': 'Perfil',
  'p-splash': 'AutoCare Parceiros', 'p-reg1': 'Cadastro', 'p-reg2': 'Especialidades',
  'p-reg3': 'Bairros', 'p-reg4': 'Documentos', 'p-reg5': 'Certificados',
  'p-pending': 'Cadastro enviado', 'p-dashboard': 'AutoCare Parceiros',
  'p-offer': 'Nova oferta', 'p-offer-accepted': 'Job aceito',
  'p-offer-rejected': 'Oferta recusada', 'p-job-exec': 'Executando Job',
  'p-job-done': 'Aguardando aprovação', 'p-cancel': 'Cancelar job',
  'p-ranking': 'Meu ranking', 'p-agenda': 'Minha Agenda', 'p-profile': 'Meu Perfil',
  'a-dashboard': 'AutoCare · Admin', 'a-services': 'Catálogo',
  'a-providers': 'Prestadores', 'a-provider-detail': 'Detalhe',
  'a-dispatch': 'Dispatch · Jobs', 'a-dispatch-detail': 'Detalhe do Job',
  'a-supply': 'Supply Chain', 'a-ranking': 'Ranking',
  'a-provider-rank': 'Ranking · Detalhe', 'a-claims': 'Reclamações',
  'a-claim-detail': 'Analisar Reclamação', 'a-jobs': 'Jobs', 'a-payments': 'Pagamentos',
};
