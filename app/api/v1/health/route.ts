import type { HealthResponse } from "@gohargeisa/api";
import { corsPreflight, jsonOk } from "../_lib/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return corsPreflight();
}

export function GET() {
  const body: HealthResponse = {
    ok: true,
    service: "gohargeisa-api",
    version: "v1",
    ts: new Date().toISOString(),
  };
  return jsonOk(body, { cache: false });
}
