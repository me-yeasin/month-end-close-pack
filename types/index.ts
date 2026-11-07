/**
 * Shared TypeScript types for Month-End Pack.
 */

// ---------------------------------------------------------------------------
// Core data models
// ---------------------------------------------------------------------------

/** A bank transaction (normalised). */
export interface Transaction {
  id: string;
  monthId: string;
  date: string; // ISO date YYYY-MM-DD
  description: string;
  amount: number; // signed: positive = money in, negative = money out
  direction: "in" | "out";
  account?: string;
  sourceFile: string; // original file name on disk
  originalRow: number; // 1-based row number in the source file
  rawRow: Record<string, string | number>; // original row values for audit
  categoryId?: string;
  category?: string;
  vatTreatment?: VatTreatment;
  note?: string;
  personal?: boolean;
  foreignCurrency?: string; // currency symbol seen, if not GBP/EUR
  matchId?: string;
  updatedAt: string; // ISO timestamp
}

/** A receipt (image/PDF) uploaded by the user. */
export interface Receipt {
  id: string;
  monthId: string;
  originalName: string;
  fileName: string; // renamed output name
  hash: string; // sha256 for dedupe
  size: number;
  mimeType: string;
  uploadedAt: string; // ISO timestamp
  status: ReceiptStatus;
  extracted?: ReceiptFields;
  pageCount?: number;
  matchId?: string;
}

export type ReceiptStatus =
  | "queued"
  | "processing"
  | "extracted"
  | "needs_review"
  | "failed";

/** Extracted receipt fields with confidence scores. */
export interface ReceiptFields {
  vendor: { value: string; confidence: number };
  date: { value: string | null; confidence: number }; // ISO date or null
  amount: { value: number | null; confidence: number };
  currency: { value: string; confidence: number };
  vatAmount: { value: number | null; confidence: number };
  paymentMethod: { value: string | null; confidence: number };
  lineItems: { value: ReceiptLineItem[]; confidence: number };
}

/** A single line item on a receipt. */
export interface ReceiptLineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
}

export type FieldValue<T> = T extends { value: infer V; confidence: number }
  ? V
  : never;

/** A suggested receipt category. */
export interface CategorySuggestion {
  categoryId: string;
  score: number; // 0–1
}

/** A receipt review record: links a receipt to a bank transaction. */
export interface ReceiptMatch {
  id: string;
  monthId: string;
  transactionIds: string[];
  receiptIds: string[];
  matchType: "exact" | "fuzzy" | "manual";
  confidence: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Matching / exceptions
// ---------------------------------------------------------------------------

export type MatchStatus =
  | "matched"
  | "missing_receipt"
  | "unmatched_receipt"
  | "duplicate"
  | "amount_mismatch"
  | "foreign_currency"
  | "possible_personal"
  | "unreviewed";

export interface Exception {
  id: string;
  monthId: string;
  type: ExceptionType;
  severity: "high" | "medium" | "low";
  message: string;
  transactionId?: string;
  receiptId?: string;
  relatedTransactionIds?: string[];
  relatedReceiptIds?: string[];
  value?: number;
  createdAt: string;
}

export type ExceptionType =
  | "missing_receipt"
  | "unmatched_receipt"
  | "duplicate_transaction"
  | "duplicate_receipt"
  | "amount_mismatch"
  | "foreign_currency"
  | "possible_personal"
  | "uncategorised"
  | "low_confidence";

// ---------------------------------------------------------------------------
// Setup / settings
// ---------------------------------------------------------------------------

export type Currency = "GBP" | "EUR";
export type DateParser = "yyyy-mm-dd" | "dd-mm-yyyy" | "mm-dd-yyyy" | "dd/mm/yyyy" | "mm/dd/yyyy";
export type VatRegistration = "registered" | "unregistered" | "unknown";

export interface AppSettings {
  currency: Currency;
  dateFormat: DateParser;
  vatRegistration: VatRegistration;
  externalAiEnabled: boolean;
  externalAiProvider?: string;
  externalAiToken?: string; // stored encrypted in practice
  categories: Category[];
  vendorRules: VendorRule[];
  noTelemetry: boolean;
}

export interface Category {
  id: string;
  name: string;
  taxDeductible: boolean;
}

export interface VendorRule {
  id: string;
  vendorPattern: string; // case-insensitive substring
  categoryId: string;
  automaticCategory: boolean;
  createdAt: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "sales", name: "Sales and income", taxDeductible: false },
  { id: "cogs", name: "Cost of goods sold", taxDeductible: true },
  { id: "subcontractors", name: "Subcontractors", taxDeductible: true },
  { id: "rent", name: "Rent", taxDeductible: true },
  { id: "utilities", name: "Utilities", taxDeductible: true },
  { id: "software", name: "Software and subscriptions", taxDeductible: true },
  { id: "travel", name: "Travel", taxDeductible: true },
  { id: "meals", name: "Meals and entertainment", taxDeductible: true },
  { id: "office", name: "Office supplies", taxDeductible: true },
  { id: "equipment", name: "Equipment", taxDeductible: true },
  { id: "marketing", name: "Marketing", taxDeductible: true },
  { id: "professional", name: "Professional fees", taxDeductible: true },
  { id: "bank_fees", name: "Bank fees", taxDeductible: true },
  { id: "tax", name: "Tax and VAT", taxDeductible: true },
  { id: "drawings", name: "Owner drawings", taxDeductible: false },
  { id: "personal", name: "Personal or excluded", taxDeductible: false },
  { id: "uncategorised", name: "Uncategorised", taxDeductible: false },
];

export type VatTreatment = "included" | "excluded" | "not_applicable";

export const DEFAULT_SETTINGS: AppSettings = {
  currency: "GBP",
  dateFormat: "dd-mm-yyyy",
  vatRegistration: "unknown",
  externalAiEnabled: false,
  categories: DEFAULT_CATEGORIES,
  vendorRules: [],
  noTelemetry: true,
};

// ---------------------------------------------------------------------------
// Workspace / month
// ---------------------------------------------------------------------------

export interface Month {
  id: string;
  name: string; // e.g. "2026-11"
  displayName: string; // e.g. "November 2026"
  currency: Currency;
  startDate: string; // ISO date
  endDate: string; // ISO date
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface MonthSummary {
  monthId: string;
  totalIn: number;
  totalOut: number;
  net: number;
  byCategory: Record<string, number>;
  vatSummary: VatSummary;
  counts: {
    transactions: number;
    receipts: number;
    missingReceipts: number;
    unmatchedReceipts: number;
    duplicates: number;
    uncategorised: number;
    flagged: number;
  };
  readinessScore: number; // 0–100
  blockers: string[];
  generatedAt: string;
}

export interface VatSummary {
  totalVatIncluded: number; // VAT amount included in amounts
  totalVatExcluded: number; // VAT amount excluded from amounts
  vatRate: number; // implied rate, 0–100
  totalNet: number;
}

export type PackExportFormat = "xlsx" | "csv";
export type ExportPreset = "accountant" | "spreadsheet" | "review";

/** Audit record for a user correction. */
export interface AuditEntry {
  id: string;
  monthId: string;
  action:
    | "transaction_imported"
    | "transaction_updated"
    | "receipt_uploaded"
    | "receipt_extracted"
    | "receipt_field_edited"
    | "category_set"
    | "vat_updated"
    | "note_added"
    | "match_created"
    | "match_updated"
    | "match_removed"
    | "month_created"
    | "month_archived"
    | "settings_changed";
  timestamp: string;
  details: Record<string, unknown>;
}
