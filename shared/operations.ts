export type PayrollFrequency = "weekly" | "biweekly" | "monthly";

function zonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour12: false, weekday: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const weekdays: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { minute: Number(values.minute), hour: Number(values.hour) % 24, dayOfMonth: Number(values.day), dayOfWeek: weekdays[values.weekday] ?? 0 };
}

export function buildPayrollCron(nextRunAt: Date, frequency: PayrollFrequency, timezone = "UTC"): string {
  const { minute, hour, dayOfMonth, dayOfWeek } = zonedParts(nextRunAt, timezone);
  return frequency === "monthly"
    ? `0 ${minute} ${hour} ${dayOfMonth} * *`
    : `0 ${minute} ${hour} * * ${dayOfWeek}`;
}

export function nextPayrollRunAt(current: Date, frequency: PayrollFrequency): Date {
  const next = new Date(current);
  if (frequency === "monthly") next.setUTCMonth(next.getUTCMonth() + 1);
  else next.setUTCDate(next.getUTCDate() + (frequency === "biweekly" ? 14 : 7));
  return next;
}

export function isPublicProofSlug(value: string): boolean {
  return /^vp-[a-f0-9]{20}$/.test(value);
}
