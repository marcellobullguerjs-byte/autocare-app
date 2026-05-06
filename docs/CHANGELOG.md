# AutoCare · Changelog

---

## v11 (2025-05-06) — Current

### 6 Fixes

**Fix 1 — Agenda flexível do prestador**
- Substituiu a agenda fixa (08:00–18:00) por campos `input type=time` editáveis por dia
- O prestador pode configurar qualquer horário: noturno (13:00–20:00), domingo, etc.
- O slot engine usa esses horários como janela de disponibilidade real
- Arquivo: `src/core/engine.js` → `buildAgendaConfig()`, `toggleAgendaDay()`, `updateAgendaTime()`

**Fix 2 — Visão de slots do dia ("Ver hoje")**
- Nova aba "Ver hoje" na tela de Agenda do prestador
- Mostra cada slot de 30min como: 🟢 Livre ou ⬜ "Job confirmado"
- Stats: livres, ocupados, ganhos estimados do dia
- Navegação entre dias com ‹ ›
- Arquivo: `src/core/engine.js` → `buildAgendaDayView()`, `changeAgendaDay()`

**Fix 3 — Admin Pagamentos funcional**
- Tela completa com 8 transações mockadas
- Filtros: Hoje / Pendentes / Todos
- Status: Liberado (verde) / Aguard. aprovação (laranja) / Sem prestador (amarelo)
- Total liberado no rodapé de cada lista
- Arquivo: `src/admin/payments.js`

**Fix 4 — Botão ← Voltar no onboarding do prestador**
- Todos os 5 passos do cadastro têm botão "← Voltar" funcional
- Passo 1 volta para a splash do prestador
- Arquivo: `index.html` (HTML dos passos p-reg1 a p-reg5)

**Fix 5 — Adicionar veículo funcional**
- Formulário completo com validação de campos obrigatórios (marca, modelo, ano, placa)
- 14 marcas com modelos dinâmicos (popula automaticamente ao selecionar marca)
- Campos: marca, modelo, ano (2015–2025), combustível, placa (auto-uppercase), cor, apelido
- Veículo adicionado aparece na lista e nas opções do Job Flow imediatamente
- Arquivo: `src/client/vehicles.js` → `updateModels()`, `saveVehicle()`

**Fix 6 — Slots respeitam confirmação manual de peças**
- Serviços com peça mostram 🔒 slots bloqueados até admin confirmar no Supply Chain
- Após confirmação: slots liberados respeitando lead time do fornecedor
- Step 3 do Job Flow mostra banner de aviso correto baseado no status da cotação
- Calendário mostra legenda: Disponível / Aguard. peça / Bloqueado
- Arquivo: `src/core/engine.js` → `isPartsConfirmed()`, `getAvailableSlots()`
- Arquivo: `src/admin/supply.js` → `doConfirmQuot()`

---

## v10 (2025-05-05)

- Admin: telas de dispatch com monitoramento e realocação manual
- Admin: supply chain com cotações, catálogo de peças, fornecedores
- Admin: ranking com score breakdown e tiers (Diamante/Ouro/Prata/Bronze)
- Admin: reclamações com fluxo completo de resolução (4 ações)
- Score engine: fórmula de 4 componentes (nota, conclusão, pontualidade, reclamações)

## v9 (2025-05-04)

- Cliente: fluxo de cancelamento com seleção de motivo
- Cliente: reagendamento com novo calendário
- Cliente: histórico do veículo com troca de abas
- Prestador: execução do job com checklist obrigatório de 4 itens
- Prestador: upload simulado de fotos antes/depois
- Prestador: validação de finalização (todos os itens obrigatórios)

## v8 (2025-05-03)

- Cliente: aprovação do serviço com rating 1–5 estrelas
- Cliente: modal de reclamação/garantia com tipos e descrição
- Prestador: oferta com countdown animado (anel SVG, 15 min)
- Prestador: telas de aceite e recusa com motivo

## v7 (2025-05-02)

- Job flow completo: 6 steps
- Slot engine: cálculo de disponibilidade com lead time de peças
- Calendário com dias coloridos por disponibilidade
- Step 3: validação de peças com animação de loading

## v6 (2025-05-01)

- Home com grid de categorias (9 categorias, 25 serviços)
- Catálogo admin com CRUD completo
- Splash, login, registro cliente (3 passos)

## v1–v5 (2025-04-28 — 2025-04-30)

- Decisões de produto: matching por bairro, dispatch por ranking, supply chain manual
- Data model: 15 entidades, score engine, 14 status do job
- Primeiras telas: splash, home, serviços, perfil básico
- Provider onboarding: 5 passos com upload de documentos
