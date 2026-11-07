# Month-End Pack — Build Plan

This file lists exactly what will be included in the application. It is written in plain language so anyone can read it and understand what the product does and what we build.

---

## Demand basis

This tool is based on `content/research/next-micro-tool-demand-research-2026-11-07.md`:

- high search demand for small-business bookkeeping and receipt capture,
- repeated Reddit complaints about manual categorising and receipt chasing,
- G2 gaps in existing accounting tools around reconciliation, receipts, and bulk actions.

The category demand is validated. The exact product form still needs the small validation step described at the end of this file.

---

## What the application does

The application helps a small business owner turn one month of bank statement files and receipts into a clean package their accountant can use.

The user uploads bank statement files in CSV format and their receipts as images or PDFs. The application reads the data, extracts the key details from each receipt, matches receipts to bank transactions, and flags anything missing, duplicated, or unclear. The user reviews the flagged items, corrects what is needed, and exports a single ZIP file containing a clean spreadsheet, a one-page summary, and the receipts organised by date.

The core promise: **from a messy folder of bank files and receipts to an accountant-ready pack, locally, in under 10 minutes.**

---

## Who it is for

Solo owners and micro businesses (1–10 people) in the UK and Europe who:

- export bank statements as CSV files,
- keep receipts in a folder, an email inbox, or on their phone,
- do their own bookkeeping or hand it to an accountant,
- do not want another cloud accounting subscription.

---

## The one job

Turn a month of messy bank and receipt data into a clean handoff pack for an accountant.

It does **not** file taxes, submit VAT returns, or replace accounting software. It prepares the pack.

---

## Exact features

### 1. New month setup

- Choose the month and the currency (GBP or EUR).
- Choose "Start a new pack" or "Continue last month".
- Show the local folder where the data is stored.
- Show a clear "your data stays on this device" indicator.

### 2. Bank CSV import

- Drag and drop files onto the application, or browse to select them.
- Import one file or multiple files (for example, one per bank account).
- Auto-detect the delimiter, encoding, header row, date format, and amount columns.
- Show a column-mapping screen with a preview of the first rows.
- Let the user correct any auto-detected column.
- Validate the file: duplicate file, missing dates, invalid amounts, unsupported currency.
- Normalise every transaction into a clean table: date, description, amount, direction (money in or money out), account, source file, original row.
- Deduplicate transactions that appear in more than one file.
- Keep the original file unchanged for audit.

### 3. Receipt import

- Drag and drop images or PDFs, or select a folder.
- Support JPG, PNG, and PDF. Multi-page PDFs are supported.
- Show a queue with a status for each file: queued, processing, extracted, needs review, failed.
- Detect duplicate receipts using a file hash.
- Allow the user to skip receipts and work in bank-only mode.

### 4. AI receipt extraction

- Read each receipt and extract:
  - vendor name,
  - receipt date,
  - total amount,
  - tax or VAT amount,
  - currency,
  - payment method,
  - line items (optional, when readable).
- Give every extracted field a confidence score.
- Highlight low-confidence fields for review.
- Suggest a category for the receipt.
- Let the user correct any field.
- Save a vendor rule after a correction, so the same vendor is handled the same way next month.
- Keep the raw OCR text for audit.
- Default to local OCR. Make any external AI provider optional and off by default. No data leaves the device unless the user explicitly enables it.

### 5. Matching

- Match each receipt to a bank transaction using amount, date window, and vendor similarity.
- Match types:
  - exact match,
  - fuzzy match,
  - manual match.
- Support multiple receipts matched to one bank transaction (for example, one card payment covering several receipts).
- Flag the following exceptions:
  - bank transaction with no receipt,
  - receipt with no bank transaction,
  - duplicate receipt or duplicate transaction,
  - amount mismatch between receipt and bank transaction,
  - foreign currency,
  - possible personal expense.
- Show a match confidence score.
- Let the user manually match or unmatch any item.

### 6. Review and categorise

- Provide a default category list for small businesses:
  - Sales and income,
  - Cost of goods sold,
  - Subcontractors,
  - Rent,
  - Utilities,
  - Software and subscriptions,
  - Travel,
  - Meals and entertainment,
  - Office supplies,
  - Equipment,
  - Marketing,
  - Professional fees,
  - Bank fees,
  - Tax and VAT,
  - Owner drawings,
  - Personal or excluded,
  - Uncategorised.
- Show the AI-suggested category with a confidence score.
- Let the user accept, change, or clear the category.
- Bulk actions:
  - accept all high-confidence suggestions,
  - set a category for selected items,
  - mark selected items as personal or excluded.
- Filters:
  - all items,
  - needs review,
  - missing receipts,
  - unmatched receipts,
  - duplicates,
  - low confidence.
- Keyboard-first review: approve and move to the next item without using the mouse.
- Add a note to any transaction.
- Record VAT treatment: included, excluded, or not applicable.
- Show a simple VAT summary. This is not a VAT return.
- Show a progress indicator: reviewed X of Y items.

### 7. Month summary

- Show total money in, total money out, and net.
- Show totals by category.
- Show the VAT summary.
- Show the number and value of:
  - missing receipts,
  - unmatched receipts,
  - duplicates,
  - uncategorised transactions.
- Show a "pack readiness" score.
- List the blockers that stop the pack from being ready.

### 8. Export the accountant pack

Build one ZIP file containing:

- `transactions.xlsx` — the clean ledger with date, description, amount, direction, account, category, VAT, receipt file name, match status, and notes.
- `summary.pdf` — a one-page month summary with totals, category breakdown, VAT summary, and exceptions.
- `receipts/` — the receipt files renamed consistently by date, vendor, and amount.
- `exceptions.csv` — missing receipts, unmatched receipts, duplicates, and uncategorised items.
- `README.txt` — what is included and how to read it.
- `audit.json` — original file names, import timestamps, extraction confidence, and user corrections.

Export presets:

- **Accountant pack** — XLSX, PDF, receipts, exceptions, README, audit file.
- **Spreadsheet only** — CSV or XLSX.
- **Review only** — exceptions CSV.

Save the ZIP locally. Do not upload it anywhere.

### 9. Next month

- Start the next month without re-learning the app.
- Keep the vendor rules, category list, and settings.
- Archive the previous month locally.
- Show a month-over-month summary (optional).
- Let the user export or delete all local data.

### 10. Settings and trust

- Default currency, date format, and VAT registration status.
- Edit the category list.
- AI settings:
  - local OCR by default,
  - optional external AI provider, off by default,
  - clear explanation of what leaves the device if enabled.
- Show the local data folder path.
- Back up all data.
- Delete all data.
- No telemetry.
- No account, no login, no cloud sync.

---

## What is intentionally not included

To keep the application focused and useful, the following are excluded from the first version:

- No bank account linking or open banking.
- No account creation or login.
- No cloud storage or sync.
- No internet connection required for the core workflow.
- No full double-entry accounting.
- No tax filing or VAT return submission.
- No invoicing.
- No payroll.
- No multi-currency conversion. Foreign currency is flagged, not converted.
- No multi-user collaboration.
- No automatic posting without human approval.
- No mobile app.
- No subscription.
- No AI features that send data to a third party by default.

---

## Build order (flow, not timeline)

Build the features in this order:

1. **Bank CSV import** — get CSV files in, map columns, and produce a normalised transaction table.
2. **Receipt import** — get receipt images and PDFs into the app with a processing queue.
3. **Local OCR extraction** — read the receipt fields and show confidence scores.
4. **Human review of extracted fields** — correct vendor, date, amount, VAT, and category.
5. **Matching engine** — match receipts to transactions and flag exceptions.
6. **Categorisation and bulk review** — accept suggestions, set categories, mark personal, add notes.
7. **Month summary and readiness score** — show what is clean and what is blocking the pack.
8. **Export pack** — build the XLSX, PDF, receipts folder, exceptions CSV, README, and audit file as a ZIP.
9. **Next-month repeat** — keep rules and settings, archive the previous month.
10. **Optional external AI provider and German localisation** — only after the local workflow is solid.

---

## How the features work together

The user opens the application and starts a new month. They upload one or more bank CSV files. The app auto-detects the columns, asks for confirmation, and creates a clean transaction list. The user uploads their receipts. The app reads each receipt, extracts the fields, and matches it to a transaction.

Anything that cannot be matched or read confidently is flagged. The user reviews only the exceptions, corrects them, and assigns categories. When the month is clean enough, the app builds a ZIP with the spreadsheet, summary, receipts, exceptions, and audit file. The user sends that ZIP to their accountant and starts the next month.

That is the core loop: **import → extract → match → review → export → repeat next month.**

---

## Success criteria

- A user can go from bank CSV files and receipts to a finished ZIP in under 10 minutes.
- Every exported transaction has a clear status: matched, missing receipt, excluded, or reviewed.
- No data leaves the device by default.
- The accountant can open the XLSX and PDF without asking follow-up questions.
- The user can repeat the process next month without re-learning the app.

---

## Validation before the full build

The category demand is validated. The exact product still needs a small validation step:

1. Put up a one-page landing site with the promise and a waitlist.
2. Talk to 10 UK or German solo owners who currently use spreadsheets or a bookkeeper.
3. Manually produce the pack for 5 of them using a spreadsheet plus AI.
4. Build the full tool only if they ask for it again next month.

---

## Summary

Month-End Pack is a local, free, open-source tool for solo owners and micro businesses. It turns one month of bank CSV files and receipts into an accountant-ready package. It does one job, keeps data on the device, and never posts anything without human approval.
