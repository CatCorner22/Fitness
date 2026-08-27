/** Allow-listed authority labels. Unknown sources are dropped. */

export const INSTRUMENT_SOURCE = "Instrument";

export const ALLOWED_SOURCES = new Set<string>([
  INSTRUMENT_SOURCE,
  "Household floor",
  "Garanimal registry",
  "ISSN",
  "ISSN protein position",
  "ACSM",
  "NSCA",
  "IOC REDs",
  "Helms 2014",
  "Helms 2016",
  "Zourdos 2016",
  "Schoenfeld 2017",
  "Garthe 2011",
  "Morton 2018",
  "Liu 2022 NEJM",
  "McKenzie 2022",
  "Schumann 2022",
  "Iversen 2021",
  "Maintz 2007",
  "Trexler 2014",
  "Kay 2012",
]);

const ALIASES: [string, string][] = [
  ["issn protein", "ISSN protein position"],
  ["international society of sports nutrition", "ISSN"],
  ["issn", "ISSN"],
  ["acsm", "ACSM"],
  ["nsca", "NSCA"],
  ["red-s", "IOC REDs"],
  ["reds", "IOC REDs"],
  ["ioc", "IOC REDs"],
  ["helms et al. 2014", "Helms 2014"],
  ["helms 2014", "Helms 2014"],
  ["helms et al. 2016", "Helms 2016"],
  ["helms 2016", "Helms 2016"],
  ["zourdos", "Zourdos 2016"],
  ["schoenfeld", "Schoenfeld 2017"],
  ["garthe", "Garthe 2011"],
  ["morton", "Morton 2018"],
  ["liu et al", "Liu 2022 NEJM"],
  ["nejm", "Liu 2022 NEJM"],
  ["mckenzie", "McKenzie 2022"],
  ["schumann", "Schumann 2022"],
  ["iversen", "Iversen 2021"],
  ["maintz", "Maintz 2007"],
  ["trexler", "Trexler 2014"],
  ["kay", "Kay 2012"],
  ["household floor", "Household floor"],
  ["instrument", INSTRUMENT_SOURCE],
  ["garanimal registry", "Garanimal registry"],
];

export function normalizeSource(
  raw: string,
  articleExists?: (id: string) => boolean,
): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (ALLOWED_SOURCES.has(t)) return t;

  const garanimal = /^Garanimal:([a-z0-9-]+)$/i.exec(t);
  if (garanimal) {
    const id = garanimal[1]!.toLowerCase();
    if (!articleExists || articleExists(id)) return `Garanimal:${id}`;
    return null;
  }

  if (articleExists?.(t)) return `Garanimal:${t}`;

  const lower = t.toLowerCase();
  for (const [alias, id] of ALIASES) {
    if (lower.includes(alias)) return id;
  }
  return null;
}
