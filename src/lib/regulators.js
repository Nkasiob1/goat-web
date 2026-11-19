// src/lib/regulators.js
// NEW: official financial regulators by country, so Company Check can point people OUTSIDE Nigeria to the right
// warning lists. GOAT only states what an official page says; it never calls a platform a scam itself.
// "site" is the regulator's own website (used for a site-restricted search). Keep this list to official domains only.

export const REGULATORS = {
  NG: { country: "Nigeria", list: [{ name: "SEC Nigeria", site: "sec.gov.ng" }] },
  GH: { country: "Ghana", list: [{ name: "SEC Ghana", site: "sec.gov.gh" }] },
  KE: { country: "Kenya", list: [{ name: "Capital Markets Authority", site: "cma.or.ke" }] },
  ZA: { country: "South Africa", list: [{ name: "FSCA", site: "fsca.co.za" }] },
  GB: { country: "the UK", list: [{ name: "FCA Warning List", site: "fca.org.uk" }] },
  US: { country: "the US", list: [{ name: "SEC", site: "sec.gov" }, { name: "CFTC RED List", site: "cftc.gov" }] },
  CA: { country: "Canada", list: [{ name: "Canadian Securities Administrators", site: "securities-administrators.ca" }] },
  AU: { country: "Australia", list: [{ name: "ASIC Moneysmart", site: "moneysmart.gov.au" }] },
  IN: { country: "India", list: [{ name: "SEBI", site: "sebi.gov.in" }, { name: "RBI Alert List (unauthorised forex platforms)", site: "rbi.org.in" }] },
  PK: { country: "Pakistan", list: [{ name: "SECP", site: "secp.gov.pk" }] },
  PH: { country: "the Philippines", list: [{ name: "SEC Philippines", site: "sec.gov.ph" }] },
  AE: { country: "the UAE", list: [{ name: "SCA", site: "sca.gov.ae" }, { name: "VARA (Dubai)", site: "vara.ae" }, { name: "DFSA", site: "dfsa.ae" }] },
  SA: { country: "Saudi Arabia", list: [{ name: "Capital Market Authority", site: "cma.org.sa" }] },
  EG: { country: "Egypt", list: [{ name: "Financial Regulatory Authority", site: "fra.gov.eg" }] },
  ES: { country: "Spain", list: [{ name: "CNMV", site: "cnmv.es" }] },
  MX: { country: "Mexico", list: [{ name: "CNBV", site: "gob.mx/cnbv" }] },
  CO: { country: "Colombia", list: [{ name: "Superintendencia Financiera", site: "superfinanciera.gov.co" }] },
  AR: { country: "Argentina", list: [{ name: "CNV", site: "argentina.gob.ar/cnv" }] },
  PE: { country: "Peru", list: [{ name: "SMV", site: "smv.gob.pe" }] },
  CL: { country: "Chile", list: [{ name: "CMF", site: "cmfchile.cl" }] },
  BR: { country: "Brazil", list: [{ name: "CVM", site: "gov.br/cvm" }] },
  PT: { country: "Portugal", list: [{ name: "CMVM", site: "cmvm.pt" }] },
  FR: { country: "France", list: [{ name: "AMF", site: "amf-france.org" }] },
};

// Alerts from 150+ regulators in one place (IOSCO's I-SCAN). Shown for every country.
export const GLOBAL_ALERTS = { name: "IOSCO I-SCAN (alerts from regulators worldwide)", site: "iosco.org" };

// A search of one official site for a platform's name (works even when a regulator moves its pages around)
export const siteSearchUrl = (site, query) =>
  `https://www.google.com/search?q=${encodeURIComponent(`site:${site} "${String(query).trim().slice(0, 80)}"`)}`;

// The regulators to check for a country (ISO code like "IN"), plus the global alerts list.
export function regulatorsFor(country, query) {
  const entry = REGULATORS[String(country || "").toUpperCase()];
  const list = [...(entry?.list || []), GLOBAL_ALERTS];
  return {
    country: entry ? String(country).toUpperCase() : null,
    countryName: entry?.country || null,
    list: list.map((r) => ({ ...r, searchUrl: query ? siteSearchUrl(r.site, query) : null })),
  };
}

// WhatsApp numbers start with the country calling code. We read it for this one message and never store it.
const CALLING_CODES = [
  ["234", "NG"], ["233", "GH"], ["254", "KE"], ["27", "ZA"], ["44", "GB"], ["1", "US"], ["61", "AU"],
  ["91", "IN"], ["92", "PK"], ["63", "PH"], ["971", "AE"], ["966", "SA"], ["20", "EG"], ["34", "ES"],
  ["52", "MX"], ["57", "CO"], ["54", "AR"], ["51", "PE"], ["56", "CL"], ["55", "BR"], ["351", "PT"], ["33", "FR"],
].sort((a, b) => b[0].length - a[0].length);               // longest first, so "234" wins over "2..."
export function countryFromPhone(waId) {
  const digits = String(waId || "").replace(/\D/g, "");
  return CALLING_CODES.find(([code]) => digits.startsWith(code))?.[1] || null;
}
