# AGENTS.md

> Standing rules for any agent (human or AI) working in this repository.

---

## The One Rule

**After every change, fix, or feature — no matter how small — you must update `BUILDSTATE.md` before the task is considered complete.**

If `BUILDSTATE.md` was not updated, **the task is not finished.** This is non-negotiable. A code change without a `BUILDSTATE.md` update is an incomplete task, the same as code that doesn't compile.

This applies to:
- New features
- Bug fixes
- Refactors
- Dependency upgrades / security patches
- Configuration or environment changes
- Documentation edits that affect architecture
- Anything that changes a file in this repo (other than `BUILDSTATE.md` itself)

---

## What to update in `BUILDSTATE.md` after every change

You must update **all of the following sections** that are affected:

### 1. Changelog — always
Prepend (newest first) a new entry at the top of the **Changelog** section using this exact format:

```
### YYYY-MM-DD HH:MM UTC — <one-line summary>
- **Files:** path/one.ts, path/two.tsx
- **What:** Concrete description of what changed.
- **Why:** The reason / motivation / ticket / advisory ID.
```

- Use UTC time.
- List every file that was created, modified, or deleted.
- "What" should be specific enough that a future agent can understand the change without reading the diff.
- "Why" should reference the user request, bug report, security advisory ID (e.g. `GHSA-…`), or design decision.

### 2. Feature Status table — if any feature changed state
- Move features between ✅ Done / 🔄 In Progress / ❌ Not Started as appropriate.
- Add new rows for new features.
- Update the "Notes" cell when behavior or scope changes.

### 3. Known Issues & Bugs — if anything was fixed or newly introduced
- Remove rows for issues that were fixed (and mention the removal in the changelog).
- Add rows for any new issues, regressions, or limitations introduced by the change, with a severity (Low / Medium / High / Critical).

### 4. Last Updated timestamp — always
- Update the **Last Updated** field in the Build Snapshot section to the current UTC date/time.

### 5. Other sections — when relevant
- **Build Snapshot / Key Dependencies** — when adding, removing, or version-bumping a dependency.
- **File & Folder Structure** — when adding, removing, renaming, or moving files/folders.
- **Next Steps** — re-prioritize, add, or strike through completed items.
- **App Overview** — only when the product's purpose or stage materially changes.

---

## Workflow checklist (run through this before claiming a task is done)

1. ✅ The code change works (verified by build / run / test as applicable).
2. ✅ A new entry is prepended to the **Changelog** in `BUILDSTATE.md`.
3. ✅ The **Last Updated** timestamp in `BUILDSTATE.md` is current.
4. ✅ The **Feature Status** table reflects the new state (if changed).
5. ✅ The **Known Issues** list reflects fixes and new issues (if any).
6. ✅ Other affected sections (dependencies, structure, next steps) are updated.
7. ✅ `replit.md` is updated **only** for long-term architectural decisions or user preferences (not for routine changes — those go in `BUILDSTATE.md`).

If you cannot tick all the relevant boxes above, **stop and finish them before reporting the task complete.**

---

## Notes on tooling

- Do **not** hand-edit `package.json`. Use the package-management tool (`installLanguagePackages`) to add or upgrade dependencies; the tool will update `package.json` and `package-lock.json` together. Then update `BUILDSTATE.md`.
- Do **not** modify `vite.config.ts`, `server/vite.ts`, or `drizzle.config.ts` unless absolutely necessary — they are pre-configured for this environment.
- Secrets and environment variables must be managed via the environment-secrets tooling, never committed.
- When in doubt about scope or behavior, prefer the smallest change that satisfies the request, and document trade-offs in the changelog "Why" line.

---

## Reminder

> A task without a `BUILDSTATE.md` update is an incomplete task.
