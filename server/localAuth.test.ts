import { describe, expect, it } from "vitest";
import { createLocalOpenId, hashAccountPassword, normalizeAccountEmail, verifyAccountPassword } from "./_core/localAuth";

describe("Veyra-owned local account credentials", () => {
  it("normalizes account email and derives a stable non-email external identifier", () => {
    const email = normalizeAccountEmail("  Operator@Veyra.Test ");
    expect(email).toBe("operator@veyra.test");
    expect(createLocalOpenId(email)).toMatch(/^local_[a-f0-9]{58}$/);
    expect(createLocalOpenId(email)).not.toContain(email);
  });

  it("stores a memory-hard verifier and rejects an incorrect password", async () => {
    const passwordHash = await hashAccountPassword("correct horse battery staple");
    expect(passwordHash).toMatch(/^scrypt\$16384\$8\$1\$/);
    await expect(verifyAccountPassword("correct horse battery staple", passwordHash)).resolves.toBe(true);
    await expect(verifyAccountPassword("wrong password value", passwordHash)).resolves.toBe(false);
  });
});
