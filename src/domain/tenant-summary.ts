import type { LeaseRow, RentStatus } from "./rent";

/** Summarize each tenancy separately before combining amounts: credit on one lease does not pay another. */
export function tenantRentSummary(tenantId: string, rows: LeaseRow[]) {
  const leases = rows.filter((row) => row.tenant.id === tenantId);
  const rent = leases.reduce((sum, row) => sum + row.rent, 0);
  const paid = leases.reduce((sum, row) => sum + Math.min(row.paid, row.rent), 0);
  const status: RentStatus | null = !leases.length ? null
    : leases.every((row) => row.status === "paid") ? "paid"
    : leases.some((row) => row.status === "overdue") ? "overdue"
    : paid > 0 ? "partial" : "due";
  return { leases, rent, paid, balance: Math.max(0, rent - paid), status };
}
