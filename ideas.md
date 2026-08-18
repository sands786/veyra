# Veyra Private Sprint — Design and Product Direction

## Three stylistic approaches

### Theme Name: Copper Veil
Very dark editorial fintech with a single ownable vermilion-copper privacy accent, asymmetric layouts, and tactile cryptographic textures. The product should feel like a serious privacy instrument rather than a generic crypto dashboard.
**Probability:** 0.06

### Theme Name: Paper Circuit
Warm ivory canvas, ink-black typography, and diagrammatic payment notes treated like physical documents moving through a secure system. The mood is calm, legible, and quietly technical.
**Probability:** 0.03

### Theme Name: Signal Garden
A lighter Starknet-native interface using red, cobalt, and soft cream with animated signal paths and modular cards. Friendly and accessible, but still grounded in privacy primitives.
**Probability:** 0.08

## Selected approach: Copper Veil

### Design Movement
Contemporary editorial brutalism fused with high-end fintech product design: strong type, controlled contrast, visible structure, and a single expressive material accent.

### Core Principles
1. Privacy should feel tangible: encrypted notes, receipts, and payment routes are represented as visible objects rather than abstract jargon.
2. The interface should reduce cognitive load around private transfers by making the state machine obvious: draft, shielded, routed, settled.
3. One strong accent color carries action and trust; everything else is graphite, smoke, and paper-white.
4. The visual system should feel built in public: evidence panels, transaction provenance, and open implementation notes stay visible.

### Color Philosophy
Graphite is the private room; ivory is the readable surface; vermilion-copper is the deliberate act of moving value. The signature brand color is **Veil Vermilion `#F0563A`**, used sparingly for actions, proof states, and the core veil mark.

### Layout Paradigm
Use a split editorial composition instead of a centered SaaS grid. A persistent left rail carries identity and product state, while the main canvas alternates between an oversized narrative statement, a live payment-intent workspace, and a proof ledger. On mobile, the rail becomes a compact top strip and the narrative becomes a horizontal sequence.

### Signature Elements
The product uses a copper veil ribbon as a recurring divider, encrypted-note tiles with punched corner details, and small monospaced evidence labels such as `PRIVATE ROUTE / 03` and `PROOF READY`.

### Interaction Philosophy
Every action should explain what becomes private and what remains visible. Buttons use precise verbs such as “Create private route” and “Preview proof,” while successful states surface the next safe step instead of a vague toast. Destructive or irreversible actions require a visible state explanation.

### Animation
Use 160–220ms transitions for hover and state changes. Payment notes slide along a copper route when a private intent is created. The hero veil drifts subtly only when motion is allowed. Respect reduced-motion preferences by keeping all state transitions instantaneous but preserving color and label changes.

### Typography System
Use Space Grotesk for display headlines and IBM Plex Mono for evidence labels, transaction IDs, and small metadata. Body copy uses a readable system sans stack. Headlines are compact and occasionally break across lines to create editorial tension; labels use uppercase, 0.12em tracking, and never compete with the main action.

### Brand Essence
Veyra is a private payroll and split-payment workspace for teams that need to move Starknet assets without exposing every recipient and amount in public transaction history. Personality: **measured, protective, exact**.

### Brand Voice
Headlines are direct and quietly confident. CTAs describe an action and its privacy outcome. Microcopy states what is public versus shielded.

Example lines:
- “Move the money. Keep the roster private.”
- “A payment route you can prove without publishing the whole story.”

### Wordmark & Logo
The mark is a folded geometric veil forming a compact V-shaped shield with an ivory slit through the center. The wordmark is set in a custom-tracked Space Grotesk treatment with the final “y” clipped by a copper diagonal, but the symbol remains the primary identity.

### Signature Brand Color
**Veil Vermilion — `#F0563A`**.

## Product concept for the STRK20 Private Sprint

Veyra is a demo-first private payroll and split-payment app. A user creates a payment intent, chooses a recipient set, previews which fields are shielded, and produces a shareable proof card. The interface includes a STRK20 integration surface with explicit shielded-balance, private-transfer, and mainnet-transaction placeholders wired to a real adapter boundary. The frontend is honest about what is connected: local demo mode is clearly labeled until the user supplies a wallet and deployed contract addresses.

The strongest hackathon differentiators are the privacy-state explanation, proof-oriented payment receipts, and a workflow designed for recurring teams rather than a generic token transfer screen. The submission package will include a README, `strk20.json` metadata file, and a public-repo-ready integration boundary.
