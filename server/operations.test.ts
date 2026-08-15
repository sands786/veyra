import { describe, expect, it } from "vitest";
import { buildPayrollCron, isPublicProofSlug, nextPayrollRunAt } from "@shared/operations";

describe("operations primitives", () => {
  it("builds weekly Heartbeat cron expressions in UTC", () => {
    expect(buildPayrollCron(new Date("2026-08-15T09:07:00.000Z"), "weekly")).toBe("0 7 9 * * 6");
  });

  it("builds monthly Heartbeat cron expressions from the UTC day of month", () => {
    expect(buildPayrollCron(new Date("2026-08-15T09:07:00.000Z"), "monthly")).toBe("0 7 9 15 * *");
  });

  it("advances biweekly and monthly schedules deterministically", () => {
    const current = new Date("2026-08-15T09:07:00.000Z");
    expect(nextPayrollRunAt(current, "biweekly").toISOString()).toBe("2026-08-29T09:07:00.000Z");
    expect(nextPayrollRunAt(current, "monthly").toISOString()).toBe("2026-09-15T09:07:00.000Z");
  });

  it("uses the requested timezone when constructing cron fields", () => {
    expect(buildPayrollCron(new Date("2026-08-15T09:07:00.000Z"), "weekly", "America/Los_Angeles")).toBe("0 7 2 * * 6");
  });

  it("accepts only VeilPay public proof slugs", () => {
    expect(isPublicProofSlug("vp-0123456789abcdef0123")).toBe(true);
    expect(isPublicProofSlug("vp-0123456789abcdef01234")).toBe(false);
    expect(isPublicProofSlug("VP-0123456789ABCDEF0123")).toBe(false);
  });
});
