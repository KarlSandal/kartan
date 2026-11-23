/* Bygger data/norden.geojson: bitar av Norden och grannländerna som kan byta ägare med tiden.
   Behöver bara köras om bitarnas gränser ska göras om. Vem som äger vilken bit vilket år står i index.html (NORDEN_TID).
   Källor: Natural Earth 10m (public domain) och data/landskap.geojson (Lantmäteriet via perliedman/svenska-landskap, CC0).
   Gränser som inte finns i Natural Earth (Finlands gräns före 1940, Petsamo, Ingermanland, Svenska Pommern med flera)
   är UNGEFÄRLIGT handritade här nedan.
   Körs så här (kräver Node.js):
     npm i @turf/turf@7.1.0 mapshaper
     hämta ne_10m_admin_0_countries.geojson, ne_10m_admin_1_states_provinces.geojson och ne_10m_lakes.geojson
       från github.com/nvkelso/natural-earth-vector (mappen geojson)
     npx mapshaper ne_10m_admin_1_states_provinces.geojson -clip bbox=-30,50,45,75 -simplify 6% keep-shapes -o a1.json
     npx mapshaper ne_10m_admin_0_countries.geojson -clip bbox=-30,47,45,75 -simplify 6% keep-shapes -o a0.json
     npx mapshaper ne_10m_lakes.geojson -clip bbox=-30,50,45,75 -simplify 15% keep-shapes -o sj.json
     node tools/norden.mjs a0.json a1.json sj.json data/landskap.geojson ra.json
     npx mapshaper ra.json -clean allow-overlaps -filter-islands min-area=15km2 -o data/norden.geojson precision=0.001  (allow-overlaps behövs, annars äter bakgrunden upp bitarna) */
import * as turf from '@turf/turf';
import fs from 'node:fs';
const [a0f, a1f, sjf, lskf, out] = process.argv.slice(2);
const las = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const A0 = las(a0f).features, A1 = las(a1f).features, SJ = las(sjf).features, LSK = las(lskf).features.filter(x => x.properties.kod);

const land = a3 => A0.filter(x => x.properties.ADM0_A3 === a3).map(x => turf.feature(x.geometry));
const reg = (a3, ...namn) => A1.filter(x => x.properties.adm0_a3 === a3 && namn.includes(x.properties.name)).map(x => turf.feature(x.geometry));
const lsk = (...namn) => LSK.filter(x => namn.includes(x.properties.namn)).map(x => turf.feature(x.geometry));
const ena = fs_ => fs_.length === 1 ? fs_[0] : turf.union(turf.featureCollection(fs_));
const klipp = (f, ring) => turf.intersect(turf.featureCollection([f, turf.polygon([[...ring, ring[0]]])]));
const utom = (f, ...andra) => turf.difference(turf.featureCollection([f, ...andra]));
const box = (f, b) => turf.intersect(turf.featureCollection([f, turf.bboxPolygon(b)]));

/* Rysslands regioner närmast Finland */
const RU_N = ena(reg('RUS', 'Leningrad', 'City of St. Petersburg', 'Karelia', 'Murmansk'));
/* Finlands östgräns före vinterkriget 1939, ungefärlig: allt mellan den och dagens gräns avträddes 1940/1944 */
const AVTRADD = klipp(RU_N, [[27, 59.9], [29.9, 60.05], [30.0, 60.17], [30.3, 60.32], [30.7, 60.5], [31.1, 60.65], [32.1, 61.33], [32.9, 61.6], [33.0, 62.05], [32.6, 62.4], [31.6, 62.9], [31.0, 63.3], [27, 63.3]]);
const VIBORG_RING = [[27, 59.8], [30.1, 59.8], [30.1, 60.35], [29.6, 60.9], [29.6, 61.5], [27, 61.5]];
const VIBORG = klipp(AVTRADD, VIBORG_RING), KEXHOLM = utom(AVTRADD, VIBORG);
const PETSAMO = klipp(RU_N, [[27, 68.7], [28.8, 68.75], [30.0, 68.9], [30.9, 69.3], [31.8, 69.6], [32.1, 69.9], [32.0, 70.2], [27, 70.2]]);
const INGER = utom(box(ena(reg('RUS', 'Leningrad', 'City of St. Petersburg')), [27.5, 58.85, 32.8, 60.4]), AVTRADD);

/* Baltikum */
const LIVLAND_LV = A1.filter(x => x.properties.adm0_a3 === 'LVA' && ['Vidzeme', 'Riga'].includes(x.properties.region) && turf.centroid(x).geometry.coordinates[1] > 56.9).map(x => turf.feature(x.geometry));
const LIVLAND = ena([...reg('EST', 'Viljandi', 'Pärnu', 'Valga', 'Võru', 'Põlva', 'Tartu', 'Jõgeva'), ...LIVLAND_LV]);
const LETTLAND = utom(ena(land('LVA')), LIVLAND);

/* Tyskland och Polen */
const MV = ena(reg('DEU', 'Mecklenburg-Vorpommern'));
const POMMERN_N = box(MV, [12.45, 53.93, 14.6, 54.8]);
const POMMERN_S = ena([utom(box(MV, [12.9, 53.3, 14.6, 53.93]), POMMERN_N), box(ena(reg('POL', 'West Pomeranian')), [14.1, 53.2, 15.0, 54.1])].filter(Boolean));
const WISMAR = box(MV, [11.25, 53.85, 11.6, 54.05]);
const BREMEN = utom(box(ena(reg('DEU', 'Niedersachsen')), [8.4, 53.05, 9.95, 53.9]), ...reg('DEU', 'Bremen'));
const SH = ena(reg('DEU', 'Schleswig-Holstein'));

/* Danmark */
const DK_ALLT = ena(reg('DNK', 'Syddanmark', 'Midtjylland', 'Nordjylland', 'Sjaælland', 'Hovedstaden'));
const BORNHOLM = box(DK_ALLT, [14.6, 54.9, 15.3, 55.4]);
const NORDSLESVIG = box(ena(reg('DNK', 'Syddanmark')), [8.0, 54.7, 10.1, 55.47]);
const DANMARK = utom(DK_ALLT, BORNHOLM, NORDSLESVIG);

/* Norge (utan Svalbard) */
/* Sveriges landskap ligger överst: grannarnas bitar klipps mot dem så att det inte blir spetsar in i Sverige */
const SVERIGE = ena(LSK.map(x => turf.feature(x.geometry)));
const TRONDELAG = utom(ena(reg('NOR', 'Nord-Trøndelag', 'Sør-Trøndelag')), SVERIGE);
const NORGE = utom(box(ena(land('NOR')), [3, 57, 32, 72]), TRONDELAG, SVERIGE);

/* Finland */
const fi = (...n) => utom(ena(reg('FIN', ...n)), SVERIGE);
const BITAR = [
  ['se-svealand', 'Svealand och Götaland', ena(lsk('Uppland', 'Södermanland', 'Västmanland', 'Närke', 'Värmland', 'Dalarna', 'Östergötland', 'Västergötland', 'Småland', 'Öland', 'Dalsland'))],
  ['se-norrland', 'Norrland', ena(lsk('Gästrikland', 'Hälsingland', 'Medelpad', 'Ångermanland', 'Västerbotten', 'Norrbotten', 'Lappland'))],
  ['skane', 'Skåne och Blekinge', ena(lsk('Skåne', 'Blekinge'))],
  ['halland', 'Halland', ena(lsk('Halland'))],
  ['bohuslan', 'Bohuslän', ena(lsk('Bohuslän'))],
  ['jamtland', 'Jämtland och Härjedalen', ena(lsk('Jämtland', 'Härjedalen'))],
  ['gotland', 'Gotland', ena(lsk('Gotland'))],
  ['norge', 'Norge', NORGE],
  ['trondelag', 'Trøndelag (Trondheims län)', TRONDELAG],
  ['danmark', 'Danmark', DANMARK],
  ['bornholm', 'Bornholm', BORNHOLM],
  ['nordslesvig', 'Nordslesvig (Sønderjylland)', NORDSLESVIG],
  ['slesvig-holstein', 'Sydslesvig och Holstein', SH],
  ['island', 'Island', ena(land('ISL'))],
  ['faroarna', 'Färöarna', ena(land('FRO'))],
  ['aland', 'Åland', ena(land('ALD'))],
  ['fi-egentliga', 'Egentliga Finland och Satakunta', fi('Finland Proper', 'Satakunta')],
  ['fi-tavastland', 'Tavastland och Nyland', fi('Uusimaa', 'Tavastia Proper', 'Päijät-Häme', 'Pirkanmaa', 'Central Finland')],
  ['fi-kymmene', 'Kymmenedalen och Södra Karelen', fi('Kymenlaakso', 'South Karelia')],
  ['fi-osterbotten', 'Österbotten och Savolax', fi('Southern Savonia', 'Ostrobothnia', 'Southern Ostrobothnia', 'Central Ostrobothnia')],
  ['fi-norra', 'Norra Finland och Lappland', fi('Northern Savonia', 'Northern Ostrobothnia', 'Kainuu', 'Lapland')],
  ['fi-nordkarelen', 'Norra Karelen', fi('North Karelia')],
  ['viborg', 'Viborg och Karelska näset', VIBORG],
  ['kexholm', 'Kexholms län och Ladoga-Karelen', KEXHOLM],
  ['petsamo', 'Petsamo', PETSAMO],
  ['ingermanland', 'Ingermanland', INGER],
  ['estland-norra', 'Norra Estland (Harrien och Wierland)', ena(reg('EST', 'Harju', 'Lääne-Viru', 'Ida-Viru'))],
  ['estland-vast', 'Västra Estland och Dagö', ena(reg('EST', 'Lääne', 'Rapla', 'Järva', 'Hiiu'))],
  ['osel', 'Ösel (Saaremaa)', ena(reg('EST', 'Saare'))],
  ['livland', 'Livland', LIVLAND],
  ['lettland', 'Kurland och Lettgallen', LETTLAND],
  ['pommern-n', 'Vorpommern med Rügen och Stralsund', POMMERN_N],
  ['pommern-s', 'Stettin och södra Pommern', POMMERN_S],
  ['wismar', 'Wismar', WISMAR],
  ['bremen', 'Bremen-Verden', BREMEN]];

const feats = [];
/* Bakgrund: länder som inte byter ägare här (Ryssland för sig) */
const NORDISKA = ['NOR', 'SWE', 'FIN', 'DNK', 'ISL', 'FRO', 'ALD', 'EST', 'LVA', 'GRL', 'USA'];
for (const x of A0) {
  const a3 = x.properties.ADM0_A3; if (NORDISKA.includes(a3)) continue;
  let b = box(turf.feature(x.geometry), [-30, 47, 45, 75]); if (!b) continue;
  /* ta bort bitarna som ligger ovanpå (Karelen, Ingermanland, Pommern med flera) så att färgerna inte blandas */
  const bb = turf.bbox(b), over = BITAR.filter(([, , g]) => g && !turf.booleanDisjoint(turf.bboxPolygon(turf.bbox(g)), turf.bboxPolygon(bb))).map(([, , g]) => g);
  if (over.length) b = utom(b, ...over); if (!b) continue;
  if (a3 === 'RUS') { /* Kaliningrad var inte ryskt förrän 1945, så det ritas som annat land */
    const kal = box(b, [19, 54, 23, 56]); if (kal) feats.push({ type: 'Feature', properties: { typ: 'bakgrund', o: 'OT' }, geometry: kal.geometry });
    b = utom(b, turf.bboxPolygon([19, 54, 23, 56]));
  }
  feats.push({ type: 'Feature', properties: { typ: 'bakgrund', o: a3 === 'RUS' ? 'RU' : 'OT' }, geometry: b.geometry });
}
for (const [id, namn, g] of BITAR) {
  if (!g) { console.warn('saknas', id); continue; }
  feats.push({ type: 'Feature', properties: { typ: 'bit', id, namn }, geometry: g.geometry });
}
for (const x of SJ) {
  const b = turf.bbox(x); if (b[2] < -30 || b[0] > 45 || b[3] < 53 || b[1] > 72) continue;
  if (turf.area(x) < 150e6) continue; /* bara de större sjöarna */
  feats.push({ type: 'Feature', properties: { typ: 'sjo' }, geometry: x.geometry });
}
fs.writeFileSync(out, JSON.stringify({ type: 'FeatureCollection', features: feats }));
console.log('skrev', out, feats.length, 'objekt');
