/* Bygger data/landskap.geojson. Behöver bara köras om gränserna ska göras om.
   Källa: github.com/perliedman/svenska-landskap (svenska-landskap-klippt.geo.json),
   byggd på Lantmäteriets distriktskarta, licens CC0.
   Körs så här (kräver Node.js):
     npm i @turf/turf@7.1.0 mapshaper
     npx mapshaper svenska-landskap-klippt.geo.json -simplify 20% keep-shapes -filter-islands min-area=1km2 \
       -each 'lx=+this.innerX.toFixed(3), ly=+this.innerY.toFixed(3)' -o forenklad.json precision=0.0001
     node tools/landskap.mjs forenklad.json data/landskap.geojson
   Skriptet lägger till havsområden för djur som lever i vattnet (sälen i Bohuslän, laxen i Halland)
   och grova landområden utan de stora sjöarna (Natural Earth), så att djur som går inte vandrar på Vänern. */
import * as turf from '@turf/turf';
import fs from 'node:fs';
const [inp, out] = process.argv.slice(2);
const src = JSON.parse(fs.readFileSync(inp, 'utf8'));
const land = turf.union(turf.featureCollection(src.features.map(f => turf.feature(f.geometry))));
/* Havsområde: 14 km ut från landskapets kust, minus allt land. Klipps i norr så det inte går in i Norge. */
const HAV = { Bohuslän: { km: 14, maxLat: 59.08 }, Halland: { km: 14 } };
const sjoar = (await (await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_lakes.geojson')).json())
  .features.filter(x => { const b = turf.bbox(x); return b[0] > 10 && b[2] < 25 && b[1] > 55 && b[3] < 70.5; }).map(x => turf.feature(x.geometry));
const feats = src.features.map(f => {
  const p = f.properties;
  return { type: 'Feature', properties: { kod: p.landskapskod, namn: p.landskap, landsdel: p.landsdel, lx: p.lx, ly: p.ly }, geometry: f.geometry };
});
for (const [namn, o] of Object.entries(HAV)) {
  const f = feats.find(x => x.properties.namn === namn);
  let h = turf.difference(turf.featureCollection([turf.buffer(f, o.km, { units: 'kilometers' }), land]));
  if (o.maxLat) { const b = turf.bbox(h); h = turf.bboxClip(h, [b[0], b[1], b[2], o.maxLat]); }
  h = turf.truncate(turf.simplify(h, { tolerance: 0.002 }), { precision: 4 });
  feats.push({ type: 'Feature', properties: { hav: namn }, geometry: h.geometry });
}
for (const f of src.features) {
  let m = turf.difference(turf.featureCollection([turf.feature(f.geometry), ...sjoar])) || turf.feature(f.geometry);
  m = turf.truncate(turf.simplify(m, { tolerance: 0.01, highQuality: true }), { precision: 3 });
  feats.push({ type: 'Feature', properties: { mark: f.properties.landskap }, geometry: m.geometry });
}
fs.writeFileSync(out, JSON.stringify({ type: 'FeatureCollection', kalla: 'perliedman/svenska-landskap (CC0), från Lantmäteriets distriktskarta. Förenklad.', features: feats }));
console.log('skrev', out, feats.length, 'objekt');
