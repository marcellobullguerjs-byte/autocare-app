# AutoCare · Architecture & Product Decisions

---

## Decisões de produto consolidadas

### Matching
- V1: por bairro (sem GPS). Cliente seleciona endereço → bairro extraído → filtro de prestadores.
- Fase 2: GPS com raio configurável por prestador.

### Preço
- Preço final = preço base serviço + peça (entrega incluída no preço da peça)
- **Prestador NÃO altera preço.** Admin define tudo no catálogo.
- Transparência total para o cliente: nenhuma surpresa no checkout.

### Dispatch
- 1 prestador por vez, ordenado por ranking score DESC
- Filtros: status=approved + região ∩ bairro do job + especialidade ∩ tipo do serviço
- 15 minutos para aceitar. Expirou → próximo na fila.
- Nenhum aceita → status `no_provider` → alerta no admin.

### Score Engine

```
score = (notaMedia/5 × 10) × 0.40
      + (jobsConcluidos/jobsTotal × 10) × 0.25
      + (pontualidade/100 × 10) × 0.20
      + max(0, 10 - reclamacoes × 1.5) × 0.15
```

Tiers: Diamante ≥9 · Ouro ≥8 · Prata ≥7 · Bronze <7

### Agenda do prestador
- Qualquer horário: noturno, domingo, etc.
- Slots de 30 minutos.
- Configuração por dia: on/off + start + end.

### Supply chain
- Manual no V1: admin confirma peças por fora (telefone/WhatsApp)
- Peças entregues no **endereço do prestador** (não do cliente)
- Slots bloqueados até confirmação da cotação → liberados automaticamente

### Garantia
- 30 dias. Reclamações analisadas manualmente.
- Exclusão de prestador = sempre decisão manual do admin.

### Cancelamento/Reagendamento
- Sem taxa no trial.

---

## Data Model (15 entidades)

```
users           id, email, role, name, phone, created_at
customers       id, user_id, address_home, address_work, neighborhood
providers       id, user_id, specialties[], regions[], status, score, joined_at
vehicles        id, customer_id, brand, model, year, fuel, plate, color, alias
addresses       id, customer_id, type, street, number, neighborhood, cep
services        id, name, category, provider_type, price, duration_min, slots,
                requires_parts, part_lead_time_h, active
parts           id, name, category, supplier_id, price_unit, unit, available
suppliers       id, name, contact, region, categories[], lead_time_h, active
jobs            id, customer_id, vehicle_id, service_id, address_id,
                status, scheduled_date, scheduled_time, total_price,
                payment_method, payment_status, created_at
job_dispatch    id, job_id, provider_id, offered_at, expires_at, accepted_at,
                rejected_at, rejection_reason, status
quotations      id, job_id, service_id, parts_json, total_parts, supplier_id,
                status, confirmed_at, lead_time_h, admin_id
checklists      id, job_id, provider_id, photo_before_url, started_at,
                photo_after_url, parts_confirmed, completed_at
approvals       id, job_id, customer_id, rating, comment, approved_at
claims          id, job_id, customer_id, provider_id, type, description,
                status, resolution, resolved_at, admin_id
payments        id, job_id, amount, method, gateway_id, status, released_at
```

---

## Job Status (14 estados)

```
pending              → job criado, pagamento confirmado, dispatch iniciando
offered              → oferta enviada para prestador (timer 15min ativo)
accepted             → prestador aceitou
parts_locked         → aguardando confirmação de peças pelo admin
confirmed            → peças confirmadas, job no calendário do prestador
in_progress          → prestador fez check-in (foto antes + iniciou execução)
awaiting_approval    → execução finalizada, aguardando aprovação do cliente
approved             → cliente aprovou, pagamento liberado
completed            → job encerrado com sucesso
claim_open           → reclamação aberta pelo cliente
closed               → encerrado após resolução de reclamação
cancelled            → cancelado pelo cliente
cancelled_by_provider → cancelado pelo prestador
no_provider          → nenhum prestador aceitou, admin deve intervir
```

---

## Prototype vs. Phase 2

| Feature | Protótipo | Fase 2 |
|---------|-----------|--------|
| Auth | Troca de contexto UI | Supabase Auth (JWT) |
| Job criado → aparece no prestador | ❌ Sessões independentes | Supabase Realtime |
| Dispatch automático | ❌ Manual/mockado | Edge Function + pg_cron |
| Confirmação de peça libera agenda | ✅ In-memory | DB trigger + Realtime |
| Countdown 15 min | ✅ Client-side | Server-side expiry |
| Pagamento | ❌ Simulado | Pagar.me |
| Fotos antes/depois | ❌ Simulado | Supabase Storage |
| Push/WhatsApp | ❌ Não implementado | FCM + Z-API |
| Score em tempo real | ✅ Calculado ao vivo | View materializada no DB |
| Login multiusuário | ❌ Hardcoded | Supabase Auth multi-role |
