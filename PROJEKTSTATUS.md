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
- Historia, Skånska kriget 1676 (panelen "Historia", släckt som standard): svensk mark, omstridd mark (Skåne, Blekinge, Halland, Bohuslän) och Danmark–Norge. Egenritade arméer (ryttare med svensk eller dansk flagga). Spelet går i turer: varje svensk armé får gå (högst 80 km), anfalla eller slå ihop sig en gång per tur, sedan gör datorn danskarnas drag. Striden avgörs med tärningar (knappen Slå tärningarna), en tärning per 1 000 man. Segerruta när alla danska arméer är besegrade, förlustruta (på skoj, historien ändrad) om alla svenska är det. Regelsiffrorna (RACKVIDD, DK_MOD, DK_CHANS) står i början av spelkoden. När lagret är på byter kartan till en gammal pergamentstil: bläckrelief, egenritade skogar, berg och kullar (ungefärliga platser), städer från 1676 med torn, havsnamn, vindros, rubrikram och ett sjöodjur. Typsnitt: IM Fell English (Google Fonts, OFL). Färjor, spårvagnar, zoner och landskapsdjur släcks medan lagret är på. Kort text om slaget vid Lund. Arméernas platser och storlek är ungefärliga, texten är skriven ur minnet och inte kontrollerad mot källa.
- Historia, Nordens gränser 1200–idag (panelen "Historia", släckt som standard): Norden och grannländerna i färg efter vem som äger dem, med ett tidsreglage under kartan och en uppspelningsknapp. Streck betyder "under en annan kung eller i union" (till exempel Norge under Danmark, Finland under ryske tsaren) och svarta streck betyder ockuperat av Tyskland 1940–45. Områden som nyss bytt ägare lyser upp. 38 krig och händelser (från Danmarks erövring av Estland 1219 till Baltikums frihet 1991) visas som svärd eller prickar i kartan och som text i panelen. Klick på ett område visar dess historia år för år. Sverigemasken, zoner, djur, färjor, spårvagnar och landskapsgränser släcks medan lagret är på, och bara ett historielager kan vara på åt gången. Allt är ungefärligt: gränserna följer dagens län och regioner, årtal och texter är skrivna ur minnet och inte kontrollerade mot källa. Grönland och Svalbard visas inte. Vem som äger vad står i NORDEN_TID och krigen i NKRIG i index.html, lätta att ändra.

## Datakällor (hämtas när sidan laddas)
- Terräng: AWS Terrain Tiles (Mapzen)
- Sverigekontur: world-atlas (Natural Earth 50m)
- Sjöar: Natural Earth 50m
- Kommuner: okfse/sweden-geojson på GitHub
- Spårvagnar: `data/sparvagn.json` i repot. Den skapas automatiskt av GitHub Actions (`.github/workflows/sparvagn.yml`) varje måndag och torsdag från Trafiklabs GTFS Regional (Västtrafik). Nyckeln ligger som GitHub-hemlighet `TRAFIKLAB_KEY`, aldrig i koden.
- Landskap: `data/landskap.geojson` i repot, från perliedman/svenska-landskap (Lantmäteriets distriktskarta, licens CC0), förenklad med `tools/landskap.mjs`.
- Nordens gränser 1200–idag: `data/norden.geojson`, byggd med `tools/norden.mjs` av Natural Earth 10m (public domain) och landskapen ovan. Gränser som inte finns där (Finland före 1940, Petsamo, Ingermanland, Svenska Pommern, Bremen-Verden) är handritade och ungefärliga.
- Historiska gränser 1676: byggda av landskapen ovan (CC0) och Danmark/Norge ur world-atlas. Ungefärliga.
- Landskapsdjur: Världsnaturfondens omröstning 1988, listan kontrollerad mot nordicperspective.com (en källa).

## På gång / ofärdigt
- Avsnittet "Data" (datakatalogens lager) är inte påbörjat.
- Zonförslagen är beräknade och inte kontrollerade mot kommunernas faktiska val.

## Idéer för nästa steg
- Kontrollera zonerna mot Lantmäteriets uppgifter.
- Bestämma vad datakatalogen ska innehålla.
- Eventuellt en noggrannare Sverigekontur och egna kopior av datafilerna i repot.

## Beslut och önskemål
- Arméerna ritas som egna figurer (ryttare med flagga), inte som landskapsdjur. Grafiken ska vara enkel.
- Landskapsdjuren ritas som egna enkla siluetter, inte bilder eller emoji. Djur som lever i vatten ska simma i vattnet, inte på land.
- Västtrafik har inga öppna fordonspositioner utan nyckel, därför går spårvagnarna efter tidtabell.
- Nycklar läggs bara som GitHub-hemligheter eller i webbläsarens localStorage, aldrig i koden.

(Fyll i här: saker som är bestämda och som Claude inte ska fråga om igen.)
