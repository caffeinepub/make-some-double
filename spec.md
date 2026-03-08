# Make Some Double

## Current State
- Dark industrial UI with amber/orange primary on near-black background
- PIN-based lock screen (default PIN: 1234) with numeric inputMode
- ScanPrintTab: 3-step workflow — scan 1, scan 2, manual Print button confirms
- Scan input is a regular text input, keyboard can appear on mobile
- Error messages say things like "Unknown prefix", "Prefix mismatch", "Duplicate serial"
- No per-prefix print counter on the main scan page
- No wake lock — tablet will sleep
- diagnosticsStore has per-prefix counts but only shown in Diagnostics tab
- No daily reset of counters
- Password stored in localStorage key "app_password" with default "1234"

## Requested Changes (Diff)

### Add
- Wake Lock API: request `screen` wake lock on app open (and re-acquire on visibility change) to prevent Android tablet sleep
- Per-prefix print counters displayed on the ScanPrintTab main page (below step indicator or as a card), showing today's print count per prefix with a "Reset" button (both daily auto-reset and manual reset)
- Daily counter reset: store a `lastResetDate` in localStorage; on app load if date has changed, reset today's counters to 0
- Manual "Reset Counters" button on the ScanPrintTab counter section

### Modify
- **Password**: Change default password from `1234` to `shw1400`. Update `DEFAULT_PASSWORD` constant in `PasswordSessionProvider.tsx`. Update placeholder and hint text in `LockScreen.tsx` to say "Password" not "PIN"
- **LockScreen**: Change `inputMode` from `numeric` to `text` (it's a text password now, not a PIN). Change label from "Enter PIN" to "Enter Password". Remove "Default PIN: 1234" footer hint
- **Theme**: Shift background and card colors to dark navy. Update `index.css` CSS variables:
  - `--background`: increase blue hue (H≈240→250), keep very dark L≈0.10–0.12, add more chroma C≈0.025–0.035 to give clear navy feel
  - `--card`: slightly lighter navy, L≈0.14, C≈0.025, H≈245
  - `--popover`: L≈0.16, C≈0.025, H≈245
  - `--secondary`, `--muted`, `--accent`: shift hue to 245–250, increase chroma slightly for navy tint
  - `--border`: navy-tinted, H≈245, L≈0.24, C≈0.030
  - `--input`: dark navy, L≈0.16, C≈0.025, H≈245
  - `--sidebar`: L≈0.11, C≈0.025, H≈248
  - Keep amber primary and all status/success/error/warning colors unchanged
- **ScanPrintTab — scan input**: Set `readOnly` to prevent software keyboard from appearing on tablet. Use `inputMode="none"` to suppress the virtual keyboard. Scanner sends keystrokes as if physical keyboard — still fires `onKeyDown` events. Keep `autoFocus` and `ref.current.focus()` calls so scanner input lands in the field. Remove placeholder text that says "type"
- **ScanPrintTab — auto-print**: After step 2 valid scan (scan2 set), immediately call `handlePrint` automatically — remove the manual PRINT button flow. Step 3 becomes a "printing in progress / result" state. The "Confirm screen" becomes an auto-print result screen showing success/error with "Scan Next Label" button
- **ScanPrintTab — error messages**: 
  - Wrong prefix on scan 1: "Wrong barcode scanned" 
  - Wrong prefix on scan 2 (mismatch): "Wrong barcode scanned"
  - Duplicate serial (scan 2 same as scan 1): "Duplicate scan, please scan unique serial"
  - Unknown prefix: "Wrong barcode scanned"
  - All errors: play error sound + clear input box so user can scan again immediately (already clears input, confirm this works)
- **diagnosticsStore**: Add `dailyPrintCounts` field: `Record<string, number>` (keyed by prefix) and `lastResetDate: string` (YYYY-MM-DD). Add `resetDailyCounters()` action. `incrementPrints` also increments `dailyPrintCounts[prefix]`. On store hydration, check if `lastResetDate` is today; if not, reset `dailyPrintCounts` and update date

### Remove
- Manual PRINT button (auto-print replaces it)
- CANCEL button on confirm screen (no longer needed since print is automatic)
- "Default PIN: 1234" hint text from LockScreen

## Implementation Plan
1. Update `index.css` — shift palette to dark navy (background/card/muted/border/input/sidebar hue and chroma)
2. Update `PasswordSessionProvider.tsx` — change `DEFAULT_PASSWORD` to `"shw1400"`
3. Update `LockScreen.tsx` — change label to "Enter Password", `inputMode="text"`, `type="password"`, remove PIN hint
4. Update `diagnosticsStore.ts` — add `dailyPrintCounts`, `lastResetDate`, `resetDailyCounters()`, daily-auto-reset logic on hydration, increment daily count in `incrementPrints`
5. Update `ScanPrintTab.tsx`:
   - Add Wake Lock API hook (request on mount, re-request on `visibilitychange`)
   - Set scan input to `readOnly` + `inputMode="none"` to prevent soft keyboard
   - Fix error messages to match requested wording
   - After step 2 valid scan: auto-trigger `handlePrint` via `useEffect` watching `scan2`
   - Remove manual Print/Cancel buttons; show auto-print status (printing spinner → success/error result)
   - Add per-prefix daily counter display section (below step indicator) with manual Reset button
6. Validate (typecheck + lint + build)
