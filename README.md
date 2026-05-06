# AutoCare · Protótipo v11

**On-demand automotive services — "iFood do carro"**
Vila Madalena Trial · Confidencial

---

## 🚀 Como abrir

```bash
# Sem servidor — abre direto no browser:
open index.html
```

---

## 📁 Estrutura do projeto

```
autocare-v11/
│
├── index.html                   ← Protótipo standalone (abre no browser, tudo inline)
├── README.md
│
├── src/
│   ├── styles.css               ← Design system completo (variáveis CSS, componentes)
│   │
│   ├── core/                    ← Dados, constantes e lógica de negócio
│   │   ├── constants.js         ← Categorias, ícones, MODELS_BY_BRAND, SCREEN_TITLES
│   │   ├── catalog.js           ← 25 serviços em 9 categorias
│   │   ├── providers.js         ← 5 prestadores mockados (availability, stats, booked)
│   │   ├── supply.js            ← 3 fornecedores, 5 peças, 3 cotações
│   │   ├── dispatch.js          ← 4 jobs no pipeline de dispatch
│   │   ├── state.js             ← vehicles, vehicleHistory, claims, payments, UI state
│   │   └── engine.js            ← calcScore, slot engine, agenda engine (Fix 1/2/6)
│   │
│   ├── client/                  ← Lógica da área do cliente
│   │   ├── jobflow.js           ← Wizard de 6 steps (veículo→problema→peça→endereço→horário→confirmação)
│   │   ├── vehicles.js          ← Adicionar veículo (Fix 5), lista, histórico
│   │   └── approval.js          ← Aprovação, rating, reclamação, cancelamento, reagendamento
│   │
│   ├── provider/                ← Lógica da área do prestador
│   │   └── provider.js          ← Countdown 15min, checklist execução, agenda, nav
│   │
│   ├── admin/                   ← Lógica do painel admin
│   │   ├── catalog.js           ← CRUD de serviços
│   │   ├── providers.js         ← Aprovação/suspensão de prestadores
│   │   ├── dispatch.js          ← Monitoramento e realocação manual
│   │   ├── supply.js            ← Cotações, confirmação de peças (Fix 6), fornecedores
│   │   ├── ranking.js           ← Score breakdown, tiers, dispatch priority
│   │   ├── claims.js            ← Reclamações e garantias
│   │   └── payments.js          ← Dashboard de pagamentos (Fix 3)
│   │
│   └── shared/
│       └── nav.js               ← showScreen, goScreen, goBack, doLogin, navTo, buildCatGrid
│
└── docs/
    ├── CHANGELOG.md             ← Histórico v1 → v11 + 6 fixes
    ├── ARCHITECTURE.md          ← Decisões de produto, data model, regras de negócio
    └── PHASE2_GUIDE.md          ← Guia de implementação do backend (Supabase + Next.js)
```

---

## 👥 Perfis demo

| Aba no topo | Perfil | Dados |
|-------------|--------|-------|
| **Cliente** | Marcello Costa | 2 veículos, Vila Madalena |
| **Prestador** | Carlos Ribeiro | Mecânico/Eletricista, Score 8.7, Ouro |
| **Admin** | Admin Panel | Painel completo |

---

## ✅ Fixes v11

| # | Fix |
|---|-----|
| 1 | Agenda do prestador: horários **flexíveis** por dia (`input type=time`) |
| 2 | Aba "Ver hoje": slots **ocupados/livres** com navegação entre dias |
| 3 | Admin Pagamentos: tela funcional com lista e filtros |
| 4 | Onboarding prestador: botão **← Voltar** em todos os 5 passos |
| 5 | Adicionar veículo: formulário completo com 14 marcas + modelos dinâmicos |
| 6 | Slots respeitam **confirmação manual de peças** pelo admin |

---

## 🔑 Fluxo de demonstração completo

### Ciclo do cliente:
1. Aba **Cliente** → Home → Manutenção → Troca de óleo + filtro
2. Seleciona veículo → Descreve problema → *Valida peça* (Fix 6 — vê aviso de bloqueio)
3. Seleciona endereço (Vila Madalena) → Abre calendário
4. Percebe slots 🔒 → Vai para Admin → Supply Chain → Cotações → **Confirmar peça**
5. Volta para Cliente → Calendário agora tem slots azuis → Seleciona horário → Paga

### Ciclo do prestador:
1. Aba **Prestador** → Dashboard → toca notificação (Nova oferta)
2. Vê countdown de 15min → **Aceitar job**
3. Nav "Job" → Preenche checklist: foto antes → inicia → foto depois → confirma peças
4. **Finalizar** → "Aguardando aprovação"

### Ciclo do admin:
1. Aba **Admin** → Supply Chain → Cotações → **Confirmar peça** com fornecedor
2. Dispatch → Ver jobs → Realocar prestador em job "Sem prestador"
3. Reclamações → Analisar → Escolher ação
4. Pagamentos → Ver lista do dia / pendentes

---

## 🏗 Fase 2 — Stack

```
Frontend:    Next.js 14 (App Router) + Tailwind CSS
Backend:     Supabase (PostgreSQL + Auth + Realtime + Storage)
Dispatch:    Supabase Edge Functions + pg_cron
Payments:    Pagar.me
WhatsApp:    Z-API / Evolution API
Mobile:      React Native (Expo) — Fase 3
```

Ver `docs/PHASE2_GUIDE.md` para detalhes completos de implementação.
