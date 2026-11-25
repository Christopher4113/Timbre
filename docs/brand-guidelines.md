# Timbre Brand Guidelines v0.1

> Last updated: 2026-11-25 · Status: Draft (working name)

Timbre is the quality that makes one voice sound different from another at the same pitch. The brand should feel like that: warm, specific, human. Paper and ink, not neon and glass.

## Quick reference

| Element | Value |
|---|---|
| Primary color | Ember `#B8432C` |
| Background | Paper `#F6F3EC` |
| Text | Ink `#1B1A17` |
| Display font | Fraunces (variable, optical size) |
| Body font | Geist |
| Voice | Plain, specific, warm, honest |

## 1. Color

| Token | Light | Dark | Use |
|---|---|---|---|
| `paper` | `#F6F3EC` | `#15130F` | Page background |
| `surface` | `#FFFDF8` | `#1E1B16` | Cards, inputs |
| `ink` | `#1B1A17` | `#F1ECE2` | Headings, body |
| `muted` | `#5F5A50` | `#A39C8E` | Secondary text |
| `line` | `#E3DDD0` | `#2E2A23` | Borders, dividers |
| `ember` | `#B8432C` | `#E0775E` | Primary actions, highlights |
| `ember-ink` | `#FFFDF8` | `#15130F` | Text on ember |
| `moss` | `#3F6B4E` | `#86B394` | Success, "approved" |

Contrast: ink on paper 15.9:1, muted on paper 6.3:1, ember on paper 5.0:1 (AA). Never use ember for body text.

No gradients, glows or glassmorphism. One accent color per screen.

## 2. Typography

- Display: Fraunces, weight 400 to 500, tight tracking (-0.02em). Headlines only.
- Body and UI: Geist 400/500. 16px base, 1.6 line height for prose.
- Mono: Geist Mono for evidence quotes, rule ids and exports.

| Element | Desktop | Mobile |
|---|---|---|
| H1 | 64px / 1.05 | 40px |
| H2 | 36px / 1.15 | 28px |
| Body large | 19px / 1.6 | 17px |
| Body | 16px / 1.6 | 16px |
| Caption | 13px / 1.4 | 13px |

## 3. Logo

Lowercase wordmark `timbre` set in Fraunces 500 with an ember dot as a sound-wave hint. Minimum width 72px. No effects, no rotation.

## 4. Voice and tone

| We are | We are not |
|---|---|
| Plain: short sentences, real words | Corporate, "leverage", "synergy" |
| Specific: say what happens, with numbers | Vague promises |
| Warm: talk like a thoughtful friend | Cute, emoji-heavy |
| Honest: say exactly what goes to model providers | Hand-wavy about data |

Tone by context:
- Marketing: confident, concrete. "Teach AI how you write. Once."
- Product UI: instructional, brief. "Paste three to ten things you wrote."
- Errors: calm, what to do next. "That link expired. Send a new one."
- Privacy: precise, no reassurance words without facts.

Banned in copy: em dashes, "revolutionary", "seamless", "unlock", "supercharge", "AI-powered", "magic" (except "magic link"), exclamation marks in UI.

## 5. Imagery and icons

Product UI is the imagery: real rule cards, evidence quotes, side-by-side drafts. No stock photos, no 3D blobs, no robot or waveform clip art. Icons, if any: 1.5px outline, 20px grid.

## 6. Components

| Component | Spec |
|---|---|
| Primary button | ember bg, ember-ink text, 10px radius, 44px min height |
| Secondary button | transparent, ink text, 1px line border |
| Card | surface bg, 1px line border, 14px radius, no shadow |
| Input | surface bg, 1px line border, ember focus ring 2px |
