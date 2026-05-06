# AutoCare · Guia de Implementação — Fase 2

Stack: **Next.js 14 + Supabase + PostgreSQL + Pagar.me**

---

## 1. Setup inicial

```bash
npx create-next-app@latest autocare --typescript --tailwind --app
cd autocare
npx supabase init
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install pagarme axios react-hook-form zod @hookform/resolvers
npm install date-fns react-hot-toast lucide-react
```

---

## 2. Estrutura de rotas (App Router)

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/
│       ├── customer/page.tsx
│       └── provider/page.tsx
├── (customer)/
│   ├── home/page.tsx
│   ├── services/[category]/page.tsx
│   ├── job/
│   │   ├── new/page.tsx          ← Job Flow wizard (6 steps)
│   │   └── [id]/page.tsx         ← Job status
│   ├── vehicles/page.tsx
│   └── profile/page.tsx
├── (provider)/
│   ├── dashboard/page.tsx
│   ├── offer/[jobId]/page.tsx    ← 15-min countdown
│   ├── job/[id]/execute/page.tsx ← Checklist
│   ├── agenda/page.tsx
│   └── ranking/page.tsx
├── (admin)/
│   ├── dashboard/page.tsx
│   ├── providers/page.tsx
│   ├── dispatch/page.tsx
│   ├── supply/page.tsx
│   ├── ranking/page.tsx
│   ├── claims/page.tsx
│   └── payments/page.tsx
└── api/
    ├── jobs/route.ts             ← POST /api/jobs (create job)
    ├── jobs/[id]/approve/route.ts
    ├── dispatch/offer/route.ts   ← Trigger offer to next provider
    └── webhooks/pagar-me/route.ts
```

---

## 3. Supabase schema (key tables)

```sql
-- Enable RLS on all tables
create table providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  specialties text[] not null,
  regions text[] not null,
  status text not null default 'pending',
  score numeric(4,2) default 0,
  stats jsonb default '{}',
  availability jsonb default '{}',  -- { dom: {on,start,end}, seg: ... }
  created_at timestamptz default now()
);

create table jobs (
  id bigserial primary key,
  customer_id uuid references customers not null,
  vehicle_id bigint references vehicles,
  service_id bigint references services not null,
  address_id bigint references addresses not null,
  status text not null default 'pending',
  scheduled_date date not null,
  scheduled_time time not null,
  total_price numeric(10,2) not null,
  payment_method text,
  payment_status text default 'pending',
  created_at timestamptz default now()
);

create table job_dispatch (
  id bigserial primary key,
  job_id bigint references jobs not null,
  provider_id uuid references providers not null,
  offered_at timestamptz default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  status text not null default 'offered'
);

create table quotations (
  id bigserial primary key,
  job_id bigint references jobs not null,
  service_id bigint references services not null,
  parts jsonb not null,
  total_parts numeric(10,2) not null,
  supplier_id bigint references suppliers,
  status text not null default 'pending',
  confirmed_at timestamptz,
  lead_time_h int,
  admin_id uuid references auth.users
);
```

---

## 4. Dispatch automático (Edge Function)

```typescript
// supabase/functions/dispatch-job/index.ts
import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

serve(async (req) => {
  const { jobId } = await req.json()
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // 1. Get job details
  const { data: job } = await supabase.from('jobs').select('*, services(*)').eq('id', jobId).single()

  // 2. Find eligible providers (approved, region match, specialty match)
  const { data: providers } = await supabase
    .from('providers')
    .select('*')
    .eq('status', 'approved')
    .contains('regions', [job.neighborhood])
    .order('score', { ascending: false })

  // 3. Filter by specialty and availability
  const eligible = providers.filter(p =>
    p.specialties.some((s: string) => job.services.provider_type.includes(s)) &&
    isAvailable(p, job.scheduled_date, job.scheduled_time)
  )

  if (eligible.length === 0) {
    await supabase.from('jobs').update({ status: 'no_provider' }).eq('id', jobId)
    return new Response(JSON.stringify({ error: 'No providers' }))
  }

  // 4. Create offer for top provider
  const provider = eligible[0]
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await supabase.from('job_dispatch').insert({
    job_id: jobId,
    provider_id: provider.id,
    expires_at: expiresAt.toISOString(),
    status: 'offered',
  })

  await supabase.from('jobs').update({ status: 'offered' }).eq('id', jobId)

  // 5. Send push notification / WhatsApp to provider
  await notifyProvider(provider, job)

  return new Response(JSON.stringify({ offered_to: provider.id }))
})
```

---

## 5. Realtime: job aparece no prestador

```typescript
// In provider dashboard component
useEffect(() => {
  const channel = supabase
    .channel('provider-offers')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'job_dispatch',
      filter: `provider_id=eq.${providerId}`,
    }, (payload) => {
      // New offer! Show notification banner
      setNewOffer(payload.new)
      playNotificationSound()
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [providerId])
```

---

## 6. Fix 6 em produção: liberar agenda após confirmação de peça

```sql
-- Trigger: when quotation status changes to 'confirmed', notify via Realtime
create or replace function notify_quotation_confirmed()
returns trigger as $$
begin
  if new.status = 'confirmed' and old.status = 'pending' then
    perform pg_notify(
      'quotation_confirmed',
      json_build_object('job_id', new.job_id, 'lead_time_h', new.lead_time_h)::text
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_quotation_confirmed
  after update on quotations
  for each row execute function notify_quotation_confirmed();
```

---

## 7. Payments (Pagar.me)

```typescript
// app/api/jobs/[id]/checkout/route.ts
import pagarme from 'pagarme'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const client = await pagarme.client.connect({ api_key: process.env.PAGARME_KEY! })
  const { paymentMethod, cardToken } = await req.json()

  const transaction = await client.transactions.create({
    amount: jobTotal * 100, // centavos
    payment_method: paymentMethod === 'pix' ? 'pix' : 'credit_card',
    card_id: cardToken,
    customer: { /* ... */ },
    billing: { /* ... */ },
    items: [{ id: jobId, title: serviceName, unit_price: jobTotal * 100, quantity: 1 }],
    metadata: { job_id: params.id },
  })

  if (transaction.status === 'authorized' || transaction.status === 'waiting_payment') {
    await supabase.from('jobs').update({ payment_status: 'paid', status: 'confirmed' }).eq('id', params.id)
    // Trigger dispatch Edge Function
    await supabase.functions.invoke('dispatch-job', { body: { jobId: params.id } })
  }

  return Response.json({ transaction })
}
```

---

## 8. WhatsApp notifications (Z-API)

```typescript
async function notifyProvider(provider: Provider, job: Job) {
  await fetch(`https://api.z-api.io/instances/${Z_API_INSTANCE}/send-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Client-Token': Z_API_TOKEN },
    body: JSON.stringify({
      phone: provider.phone,
      message: `🔔 *Nova oferta de job!*\n\n`
        + `Serviço: ${job.service_name}\n`
        + `Endereço: ${job.neighborhood}\n`
        + `Data: ${job.scheduled_date} às ${job.scheduled_time}\n`
        + `Valor: R$ ${job.total_price}\n\n`
        + `Você tem *15 minutos* para aceitar.\n`
        + `👉 ${APP_URL}/provider/offer/${job.id}`,
    }),
  })
}
```

---

## 9. Estrutura de roles (Supabase RLS)

```sql
-- Customer pode ver apenas seus próprios jobs
create policy "customer_own_jobs" on jobs
  for select using (customer_id = auth.uid());

-- Provider pode ver apenas offers para ele
create policy "provider_own_offers" on job_dispatch
  for select using (provider_id = auth.uid());

-- Admin tem acesso total
create policy "admin_all" on jobs
  for all using (
    exists (select 1 from users where id = auth.uid() and role = 'admin')
  );
```

---

## 10. Roadmap

| Fase | Scope | Estimativa |
|------|-------|------------|
| 2a | Auth + Jobs + Dispatch básico | 6 semanas |
| 2b | Payments (Pagar.me) + WhatsApp | 3 semanas |
| 2c | Photos (Storage) + Realtime | 2 semanas |
| 2d | Admin completo + Analytics | 3 semanas |
| 3  | React Native (Expo) — iOS + Android | 8 semanas |
| 4  | GPS matching + Multi-cidade | TBD |
