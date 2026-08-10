import { createHash } from "crypto";
import { headers } from "next/headers";

export async function getRequestFingerprintHash(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ua = h.get("user-agent") || "unknown";
  const salt = process.env.FINGERPRINT_SALT || "dev-fingerprint-salt";
  return createHash("sha256").update(`${salt}:${ip}:${ua}`).digest("hex");
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
