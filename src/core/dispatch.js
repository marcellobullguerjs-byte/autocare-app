/**
 * AutoCare Prototype v11
 * src/core/dispatch.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Mock dispatch data: jobs currently in the dispatch pipeline.
 *
 * Dispatch logic (simulated in prototype, automated in Phase 2):
 *   1. Job created → system filters eligible providers
 *      (status=approved, region match, specialty match, availability match)
 *   2. Sorted by ranking score (highest first)
 *   3. Offer sent to #1 → 15-minute acceptance window
 *   4. Accepted → job confirmed. Declined or timeout → offer to #2
 *   5. All declined → status = 'no_provider' → admin alert + manual reallocation
 *
 * Status values:
 *   'offering'    — offer currently active with a provider (timer running)
 *   'confirmed'   — provider accepted
 *   'no_provider' — no provider accepted; requires admin intervention
 *   'completed'   — job finished and approved
 */

'use strict';

const dispatchJobs = [
  {
    id: 2047,
    service: 'Troca de óleo + filtro',
    client: 'Marcello Costa',
    bairro: 'Vila Madalena',
    date: '06 mai',
    time: '11:00',
    price: 240,
    dispatch: {
      status: 'confirmed',
      providerId: 1,          // Carlos Ribeiro accepted
      offeredTo: [1],          // Providers who received offers
      currentOfferId: null,    // No active offer
      offerExpires: null,
      history: [
        { providerId: 1, action: 'accepted', at: '08:15' },
      ],
    },
  },
  {
    id: 2051,
    service: 'Troca de filtro de ar',
    client: 'Roberto Souza',
    bairro: 'Jardins',
    date: '07 mai',
    time: '09:00',
    price: 92,
    dispatch: {
      status: 'offering',
      providerId: null,
      offeredTo: [1],           // Offered to Carlos first (highest score)
      currentOfferId: 1,        // Waiting for Carlos to respond
      offerExpires: '08:47',    // Simulated expiry time
      history: [],
    },
  },
  {
    id: 2055,
    service: 'Martelinho de ouro',
    client: 'Pedro Monteiro',
    bairro: 'Moema',
    date: '07 mai',
    time: '10:00',
    price: 200,
    dispatch: {
      status: 'no_provider',   // ← Admin alert shown on dashboard
      providerId: null,
      offeredTo: [],
      currentOfferId: null,
      offerExpires: null,
      history: [],
      // Note: Moema only has Paulo Mendes (pending) — no approved provider
    },
  },
  {
    id: 2046,
    service: 'Check-up geral',
    client: 'Lúcia Carvalho',
    bairro: 'Vila Madalena',
    date: '06 mai',
    time: '09:00',
    price: 120,
    dispatch: {
      status: 'completed',
      providerId: 1,
      offeredTo: [1],
      currentOfferId: null,
      offerExpires: null,
      history: [
        { providerId: 1, action: 'accepted', at: '06:00' },
      ],
    },
  },
];
