# Projektstatus – Sverigekartan

Senast uppdaterad: 2026-11-22

## Om projektet
En stiliserad, interaktiv Sverigekarta som webbsida.
- Teknik: MapLibre GL (version 4.7.1), allt ligger i `index.html`.
- Stil: mörk och teknisk, med lagerpanel till höger.
- Repo: https://github.com/KarlSandal/kartan
- Hemsida: https://karlsandal.github.io/kartan
- Regel: inga API-nycklar i koden, eftersom repot är publikt.

## Detta fungerar
- Mörk bakgrund med reliefskuggning (styrkan går att ställa in) och 3D-terräng.
- OpenStreetMap som kontrollager, med reglage för genomskinlighet.
- Sverigekontur med glöd. Allt utanför Sverige är mörklagt.
- Sjöar och kommungränser som lager som går att slå av och på.
- SWEREF 99: alla 12 lokala zoner (EPSG 3007–3018) i egna färger, med mittmeridianer och ett 100 km-rutnät i SWEREF 99 TM.
- Varje kommun får ett beräknat zonförslag. Gränsen mellan den södra och den norra zonserien ställs in med ett reglage (standard 62,5° N). Gotland är låst till 18 45.
- Klick på kartan visar kommun och koordinater (WGS 84, SWEREF 99 TM och den lokala zonen).
- Göteborgs spårvagnar (panelen "Levande"): spårnät och vagnar efter Västtrafiks tidtabell, syns från zoomnivå 10,5. Inte riktiga positioner.
- Landskap: alla 25 landskapsgränser med namn (panelen "Geografi"). Klick i kartan visar också landskapet.
- Landskapsdjur (panelen "Levande"): ett egenritat djur per landskap som vandrar slumpmässigt inom sitt landskap. Fåglar flyger över hela landskapet, andra djur går på land men inte på de stora sjöarna, sälen (Bohuslän) och laxen (Halland) simmar i havet utanför kusten.

## Datakällor (hämtas när sidan laddas)
- Terräng: AWS Terrain Tiles (Mapzen)
- Sverigekontur: world-atlas (Natural Earth 50m)
- Sjöar: Natural Earth 50m
- Kommuner: okfse/sweden-geojson på GitHub
- Spårvagnar: `data/sparvagn.json` i repot. Den skapas automatiskt av GitHub Actions (`.github/workflows/sparvagn.yml`) varje måndag och torsdag från Trafiklabs GTFS Regional (Västtrafik). Nyckeln ligger som GitHub-hemlighet `TRAFIKLAB_KEY`, aldrig i koden.
- Landskap: `data/landskap.geojson` i repot, från perliedman/svenska-landskap (Lantmäteriets distriktskarta, licens CC0), förenklad med `tools/landskap.mjs`.
- Landskapsdjur: Världsnaturfondens omröstning 1988, listan kontrollerad mot nordicperspective.com (en källa).

## På gång / ofärdigt
- Avsnittet "Data" (datakatalogens lager) är inte påbörjat.
- Zonförslagen är beräknade och inte kontrollerade mot kommunernas faktiska val.

## Idéer för nästa steg
- Kontrollera zonerna mot Lantmäteriets uppgifter.
- Bestämma vad datakatalogen ska innehålla.
- Eventuellt en noggrannare Sverigekontur och egna kopior av datafilerna i repot.

## Beslut och önskemål
- Landskapsdjuren ritas som egna enkla siluetter, inte bilder eller emoji. Djur som lever i vatten ska simma i vattnet, inte på land.
- Västtrafik har inga öppna fordonspositioner utan nyckel, därför går spårvagnarna efter tidtabell.
- Nycklar läggs bara som GitHub-hemligheter eller i webbläsarens localStorage, aldrig i koden.

(Fyll i här: saker som är bestämda och som Claude inte ska fråga om igen.)
