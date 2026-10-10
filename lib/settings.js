import fs from "node:fs";
import path from "node:path";

/**
 * Explorer settings managed from Nadcab Console. The console writes branding/settings.json
 * (plus logo and favicon files) into DATA_DIR; changes apply on the next request, no restart.
 */

export const BRANDING_DIR = path.join(process.env.DATA_DIR || "./data", "branding");
const SETTINGS_FILE = path.join(BRANDING_DIR, "settings.json");

const HEX = /^#[0-9a-f]{6}$/i;
const ASSET = /^(logo|favicon)\.(png|jpg|jpeg|svg|webp|ico|gif)$/;

const text = (value, max = 200) => (typeof value === "string" ? value.replace(/[\r\n]+/g, " ").trim().slice(0, max) : "");
const url = (value) => {
  const raw = text(value, 300);
  return /^https?:\/\/[^\s"'<>]+$/i.test(raw) ? raw : "";
};

function sanitize(raw = {}) {
  const price = Number(raw.coinPriceUsd);
  return {
    chainName: text(raw.chainName, 60),
    heroTitle: text(raw.heroTitle, 120),
    heroSubtitle: text(raw.heroSubtitle, 160),
    hideNameWithLogo: raw.hideNameWithLogo === true,
    logo: ASSET.test(raw.logo || "") ? raw.logo : "",
    favicon: ASSET.test(raw.favicon || "") ? raw.favicon : "",
    version: text(String(raw.version ?? ""), 40),

    brandColor: HEX.test(raw.brandColor || "") ? raw.brandColor : "",
    heroColor: HEX.test(raw.heroColor || "") ? raw.heroColor : "",
    defaultTheme: ["light", "dark"].includes(raw.defaultTheme) ? raw.defaultTheme : "system",

    currencySymbol: text(raw.currencySymbol, 12),
    currencyName: text(raw.currencyName, 40),
    coinPriceUsd: Number.isFinite(price) && price > 0 ? price : null,

    website: url(raw.website),
    twitter: url(raw.twitter),
    telegram: url(raw.telegram),
    discord: url(raw.discord),
    github: url(raw.github),
    email: /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(raw.email || "") ? raw.email : "",
    footerAbout: text(raw.footerAbout, 400),
    copyright: text(raw.copyright, 120),

    metaTitle: text(raw.metaTitle, 80),
    metaDescription: text(raw.metaDescription, 300),
    metaKeywords: text(raw.metaKeywords, 300),
    announcementEnabled: raw.announcementEnabled === true,
    announcementText: text(raw.announcementText, 200),
    announcementLink: url(raw.announcementLink),
  };
}

let cache = { mtime: -1, value: sanitize() };

export function getSettings() {
  let mtime = 0;
  try {
    mtime = fs.statSync(SETTINGS_FILE).mtimeMs;
  } catch {
    mtime = 0;
  }
  if (mtime === cache.mtime) return cache.value;
  let raw = {};
  if (mtime) {
    try {
      raw = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
    } catch {
      raw = {};
    }
  }
  cache = { mtime, value: sanitize(raw) };
  return cache.value;
}

export function assetUrl(kind) {
  const settings = getSettings();
  if (!settings[kind]) return "";
  return `/branding/${kind}${settings.version ? `?v=${encodeURIComponent(settings.version)}` : ""}`;
}

/** CSS overriding the brand and hero palette; colour-mix derives the lighter and darker shades. */
export function themeCss() {
  const { brandColor: b, heroColor: h } = getSettings();
  const rules = [];
  if (b) {
    rules.push(`html:root{--color-brand-50:color-mix(in srgb,${b} 8%,#fff);--color-brand-100:color-mix(in srgb,${b} 18%,#fff);--color-brand-500:${b};--color-brand-600:color-mix(in srgb,${b} 88%,#000);--color-brand-700:color-mix(in srgb,${b} 72%,#000)}`);
    rules.push(`html.dark{--color-brand-50:color-mix(in srgb,${b} 16%,#111722);--color-brand-100:color-mix(in srgb,${b} 28%,#111722);--color-brand-500:color-mix(in srgb,${b} 85%,#fff);--color-brand-600:color-mix(in srgb,${b} 72%,#fff);--color-brand-700:color-mix(in srgb,${b} 55%,#fff)}`);
  }
  if (h) rules.push(`html:root,html.dark{--color-night:${h};--color-night-soft:color-mix(in srgb,${h} 88%,#fff)}`);
  return rules.join("");
}
