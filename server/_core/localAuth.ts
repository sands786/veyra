import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import { COOKIE_NAME } from "@shared/const";
import * as db from "../db";
import { ENV } from "./env";

const PASSWORD_MEMORY_COST = 16_384;
const PASSWORD_BLOCK_SIZE = 8;
const PASSWORD_PARALLELISM = 1;
const PASSWORD_LENGTH = 64;
export const VEYRA_SESSION_MS = 30 * 24 * 60 * 60 * 1000;

type VeyraSessionPayload = {
  openId: string;
  auth: "veyra-password";
};

function secretKey() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

export function normalizeAccountEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createLocalOpenId(email: string) {
  return `local_${createHash("sha256").update(email).digest("hex").slice(0, 58)}`;
}

async function derivePasswordKey(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      PASSWORD_LENGTH,
      {
        N: PASSWORD_MEMORY_COST,
        r: PASSWORD_BLOCK_SIZE,
        p: PASSWORD_PARALLELISM,
        maxmem: 64 * 1024 * 1024,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(Buffer.from(derivedKey));
      },
    );
  });
}

export async function hashAccountPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derivePasswordKey(password, salt);
  return ["scrypt", PASSWORD_MEMORY_COST, PASSWORD_BLOCK_SIZE, PASSWORD_PARALLELISM, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function verifyAccountPassword(password: string, encodedHash: string) {
  const [algorithm, cost, blockSize, parallelism, saltValue, hashValue] = encodedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    Number(cost) !== PASSWORD_MEMORY_COST ||
    Number(blockSize) !== PASSWORD_BLOCK_SIZE ||
    Number(parallelism) !== PASSWORD_PARALLELISM ||
    !saltValue ||
    !hashValue
  ) return false;
  try {
    const expected = Buffer.from(hashValue, "base64url");
    const actual = await derivePasswordKey(password, Buffer.from(saltValue, "base64url"));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function createVeyraSessionToken(openId: string) {
  return new SignJWT({ openId, auth: "veyra-password" satisfies VeyraSessionPayload["auth"] })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + VEYRA_SESSION_MS) / 1000))
    .sign(secretKey());
}

export async function authenticateVeyraRequest(req: Request) {
  const sessionToken = parseCookieHeader(req.headers.cookie ?? "")[COOKIE_NAME];
  if (!sessionToken) return null;
  try {
    const { payload } = await jwtVerify(sessionToken, secretKey(), { algorithms: ["HS256"] });
    const session = payload as unknown as VeyraSessionPayload;
    if (session.auth !== "veyra-password" || typeof session.openId !== "string") return null;
    return (await db.getUserByOpenId(session.openId)) ?? null;
  } catch {
    return null;
  }
}
