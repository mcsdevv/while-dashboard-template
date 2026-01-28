/**
 * Setup API - Storage Status
 * GET: Check if Redis/Upstash is configured
 */

import { isRedisConfigured } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET() {
  const configured = isRedisConfigured();

  return NextResponse.json({
    configured,
  });
}
