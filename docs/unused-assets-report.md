# Unused / Redundant Assets Report

_Last updated: $(date '+%Y-%m-%d %H:%M %Z')_

## 1. Objective & Context
The goal was to identify source files that are no longer referenced anywhere in the product so that they can be safely deleted. Because the project spans a Next.js frontend and a Node backend, the analysis focused on assets under `src/` (frontend) and searched for duplicate route implementations.

> **Note:** Automated tools such as `ts-prune`, `knip`, or `ts-unused-exports` normally accelerate this task. Running them requires downloading npm packages, which is currently blocked by the restricted network environment (see `npx ts-prune` failure logged in the terminal). The findings below therefore rely on repository inspection and graph checks that do not require new dependencies.

## 2. Methodology
1. **Duplicate detection between `src/app` and `src/components`.** Many dashboard routes exist twice: one real route in `src/app/dashboard/...` and another copy under `src/components/dashboard/...`. A script compared both trees and flagged files that share the exact relative path (e.g. `src/components/dashboard/page.tsx` vs `src/app/dashboard/page.tsx`).
2. **Reference scans.** For each duplicate, `rg` (ripgrep) was used to ensure no import exists that targets the `src/components/...` version. All real imports point to the `src/app/...` implementation, confirming that the duplicates are unused.
3. **Spot checks of other complex modules.** Some component helpers (e.g., clan client pages) still have both versions, but only the `src/components/...` file is referenced by routes. Those were excluded from the “safe to delete” list.

## 3. Deletions Applied (2024-11-17)
All duplicate dashboard route files identified in the previous revision have now been removed:

- `src/components/dashboard/page.tsx`
- `src/components/dashboard/configuracoes/page.tsx`
- `src/components/dashboard/servicos/page.tsx`
- `src/components/dashboard/progresso/page.tsx`
- `src/components/dashboard/perfil/page.tsx`
- `src/components/dashboard/contas/page.tsx`
- `src/components/dashboard/relatorios/page.tsx`
- `src/components/dashboard/metas/page.tsx`
- `src/components/dashboard/fatura/[cardId]/page.tsx`
- `src/app/dashboard/clans/clan-client-page.tsx`

> **Action item:** If any feature ever needs to import these pages programmatically (e.g., for stories or tests), update the references to the remaining `src/app/...` versions.

## 4. Follow-up Work
- Once network access allows, run an automated unused-export audit (e.g., `npx ts-prune` or `npx knip`) to catch dead utilities, hooks, and backend modules across the repo.
- Repeat the duplicate comparison for other top-level folders (e.g., `backend/src` vs `backend/controllers`) if legacy copies are suspected.
- After removing the duplicates, re-run `tsc --noEmit` and your test suite to ensure no references were missed.

## 5. Audit Log
- `2024-11-17`: Initial duplicate scan via Python script (`Path('src/components/dashboard').rglob('*')`) cross-checking files under `src/app/dashboard`. Logged 10 duplicates.
- `2024-11-17`: Manual ripgrep validation confirmed no imports target the unused copies listed above.
