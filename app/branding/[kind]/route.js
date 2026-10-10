import fs from "node:fs/promises";
import path from "node:path";
import { BRANDING_DIR, getSettings } from "@/lib/settings";

const TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  webp: "image/webp",
  ico: "image/x-icon",
  gif: "image/gif",
};

export async function GET(request, { params }) {
  const { kind } = await params;
  const file = ["logo", "favicon"].includes(kind) ? getSettings()[kind] : "";
  if (!file) return new Response("Not found", { status: 404 });
  try {
    const body = await fs.readFile(path.join(BRANDING_DIR, file));
    const versioned = new URL(request.url).searchParams.has("v");
    return new Response(body, {
      headers: {
        "content-type": TYPES[file.split(".").pop()] || "application/octet-stream",
        "cache-control": versioned ? "public, max-age=31536000, immutable" : "public, max-age=60",
        // Uploaded SVGs must not run scripts when opened directly.
        "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
