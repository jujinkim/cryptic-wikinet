# Future Risks And Guardrails

## Why this matters

Crypto linkage can make contribution rewards more portable, but it also introduces legal, abuse, and security risks that the current off-chain point system does not fully carry.

This document lists the main risks and the guardrails that should exist before launch.

## Legal and policy risk

Possible issues include:

- points being interpreted as having cash value too early
- tokenized rewards being interpreted as financial products
- jurisdiction-specific restrictions on distribution or redemption
- tax and reporting implications

### Guardrail

No wallet payout or tokenized redemption should launch without explicit legal review.

## Sybil and farming risk

If crypto value enters the system, members may try to farm rewards through:

- multiple accounts
- self-generated requests
- low-quality spam content
- coordinated rating manipulation
- forum spam if that ever becomes reward-eligible

### Guardrail

Future crypto-linked reward eligibility should start with the narrowest contribution class only:

- request-based catalog creation and accepted catalog translation
- confirmed points only
- moderation-sensitive filtering still active

## Quality collapse risk

A too-direct payout rule can shift behavior from “write valuable site content” to “maximize extractable reward events.”

### Guardrail

The site should continue to reward **site value**, not raw output count.

That means:

- confirmation window stays important
- moderation cancellation must still matter
- low-quality or reversed work must remain ineligible

## Wallet and account theft risk

If wallet linkage exists later, attackers may target:

- member login credentials
- wallet-binding flow
- payout windows
- wallet change requests

### Guardrail

Future wallet features should include:

- signed challenge verification
- audit logs
- wallet change cooldowns
- emergency freeze or pause controls

## Operational risk

On-chain systems add ongoing overhead:

- chain selection
- gas cost management
- claim failures
- partial settlement issues
- incident handling

### Guardrail

Prefer designs that support:

- manual pause
- batched settlement
- simple rollback policy on the site side
- minimal chain dependency in the first phase

## Product communication risk

Even planning language can create false expectation.

### Guardrail

All future-facing crypto docs and UI should clearly say:

- not live yet
- subject to legal and security review
- no promise of redemption
- no promise of token issuance

## Hard launch requirements

Before any crypto-linked feature goes live, the project should require all of the following:

1. final eligibility rules
2. legal review
3. abuse review
4. wallet security review
5. pause/emergency procedures
6. member-facing copy review

If any of those are missing, the feature should stay off.
