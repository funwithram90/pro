import test from "node:test";
import assert from "node:assert/strict";
import { tenantRentSummary } from "./tenant-summary.ts";
import type { LeaseRow } from "./rent";

const row = (rent: number, paid: number, status: LeaseRow["status"], tenantId = "tenant-1") => ({
  tenant: { id: tenantId }, rent, paid, status,
}) as LeaseRow;

test("combines rent from every tenancy and excludes other tenants", () => {
  const result = tenantRentSummary("tenant-1", [row(10000, 10000, "paid"), row(7000, 0, "due"), row(9000, 0, "due", "tenant-2")]);
  assert.equal(result.rent, 17000);
  assert.equal(result.paid, 10000);
  assert.equal(result.balance, 7000);
  assert.equal(result.leases.length, 2);
  assert.equal(result.status, "partial");
});
test("credit on a paid lease cannot hide an overdue second lease", () => {
  const result = tenantRentSummary("tenant-1", [row(10000, 25000, "paid"), row(7000, 1000, "overdue")]);
  assert.equal(result.paid, 11000);
  assert.equal(result.balance, 6000);
  assert.equal(result.status, "overdue");
});
test("distinguishes tenants with no tenancy from paid tenants", () => {
  assert.equal(tenantRentSummary("missing", [row(10000, 10000, "paid")]).status, null);
  assert.equal(tenantRentSummary("tenant-1", [row(10000, 10000, "paid"), row(7000, 7000, "paid")]).status, "paid");
});
