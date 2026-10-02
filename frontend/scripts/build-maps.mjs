// Builds src/data/maps.json (SVG paths) from Natural Earth data in world-atlas (public domain).
// Run with `npm run maps` only when the places change; the output is committed.
import { readFileSync, writeFileSync } from "node:fs";
import { geoNaturalEarth1, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { DISTRICTS, COUNTRIES } from "../src/data/places.js";

const load = (f) => JSON.parse(readFileSync(new URL(`../node_modules/world-atlas/${f}`, import.meta.url)));
const round = (d) => d.replace(/\d+\.\d+/g, (n) => (+n).toFixed(1));

// World: every country as a faint shape, growers highlighted by name
const world = feature(load("countries-110m.json"), "countries");
const W = 960, H = 470;
const wProj = geoNaturalEarth1().fitSize([W, H], { type: "Sphere" });
const wPath = geoPath(wProj);
const names = new Set(COUNTRIES.map((c) => c.name));
const worldOut = {
  w: W, h: H,
  land: round(wPath({ type: "FeatureCollection", features: world.features.filter((f) => !names.has(f.properties.name)) })),
  growers: Object.fromEntries(world.features.filter((f) => names.has(f.properties.name))
    .map((f) => [f.properties.name, round(wPath(f))])),
};
const missing = [...names].filter((n) => !worldOut.growers[n]);
if (missing.length) throw new Error(`Not in world-atlas: ${missing}`);

// Bangladesh: detailed outline and district points
const bd = feature(load("countries-50m.json"), "countries").features.find((f) => f.properties.name === "Bangladesh");
const BW = 420, BH = 520;
const bProj = geoMercator().fitExtent([[20, 20], [BW - 20, BH - 20]], bd);
const bdOut = {
  w: BW, h: BH,
  outline: round(geoPath(bProj)(bd)),
  points: Object.fromEntries(DISTRICTS.map((d) => [d.id, bProj([d.lon, d.lat]).map((v) => +v.toFixed(1))])),
};

writeFileSync(new URL("../src/data/maps.json", import.meta.url), JSON.stringify({ world: worldOut, bd: bdOut }));
console.log("maps.json written");
