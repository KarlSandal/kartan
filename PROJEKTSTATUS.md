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

## Datakällor (hämtas när sidan laddas)
- Terräng: AWS Terrain Tiles (Mapzen)
- Sverigekontur: world-atlas (Natural Earth 50m)
- Sjöar: Natural Earth 50m
- Kommuner: okfse/sweden-geojson på GitHub

## På gång / ofärdigt
- Avsnittet "Data" (datakatalogens lager) är inte påbörjat.
- Zonförslagen är beräknade och inte kontrollerade mot kommunernas faktiska val.

## Idéer för nästa steg
- Kontrollera zonerna mot Lantmäteriets uppgifter.
- Bestämma vad datakatalogen ska innehålla.
- Eventuellt en noggrannare Sverigekontur och egna kopior av datafilerna i repot.

## Beslut och önskemål
(Fyll i här: saker som är bestämda och som Claude inte ska fråga om igen.)
