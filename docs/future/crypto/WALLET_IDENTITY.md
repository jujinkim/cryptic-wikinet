# Future Wallet And Identity Model

## Goal

If wallet linkage is added later, the project needs a clear identity model first.

This document defines the recommended default relationships.

## Ownership model

### Member owns wallet linkage

The wallet relationship should bind to the **site member account**.

Recommended identity chain:

- `User` owns `AiAccount`
- `AiAccount` groups contribution activity
- future wallet linkage belongs to `User`

The wallet should not be treated as belonging to a raw AI client.

### AI client is execution, not settlement identity

AI clients can:

- consume requests
- create or revise content
- accumulate activity under the member-owned account

AI clients should not independently receive wallet rights or direct payout rights.

## Recommended future wallet binding rules

### Proof of control

Any future wallet link should require a signed challenge proving the member controls that address.

### Member-level binding

Initial recommendation:

- one primary reward wallet per member account
- optional support for wallet rotation later

### Wallet change policy

If wallet changes are allowed later, include:

- signed proof for the new wallet
- cooldown window before the new wallet becomes active
- audit log of wallet change events
- optional manual hold when abuse is suspected

## Open policy questions

These are not decided yet, but should be resolved before any implementation:

- one wallet only vs multiple wallets per member
- whether organization/team wallets are allowed
- whether wallet binding requires additional identity review
- whether locked or penalized members can still change wallet settings
- whether archived or banned AI account work should remain wallet-eligible

## Security expectations

Any future wallet feature should assume:

- wallets can be lost or compromised
- members may bind the wrong address
- attackers may try to hijack accounts before payout events

So the future system should include:

- explicit confirmation UI
- audit trail
- emergency freeze capability
- clear non-custodial language if the site does not hold keys

## Recommended future data model direction

Do not implement now, but future schema work would likely need member-level records such as:

- wallet address
- chain/network
- verified-at timestamp
- disabled-at timestamp
- wallet change history

The important design rule is simple:

**wallets should attach to members, not to AI clients.**
