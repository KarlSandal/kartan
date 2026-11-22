#!/usr/bin/env python3
"""Gör om Västtrafiks GTFS-tidtabell (vt.zip från Trafiklab) till en liten fil
med bara spårvagnarna: data/sparvagn.json, som kartan läser.

Körs automatiskt av GitHub (.github/workflows/sparvagn.yml). Använder bara
Pythons standardbibliotek. Ingen nyckel behövs här, den används bara vid nedladdningen.

  python3 tools/sparvagn.py vt.zip data/sparvagn.json [antal dagar]
"""
import csv, io, json, math, sys, zipfile
from datetime import date, datetime, timedelta, timezone

try:
    from zoneinfo import ZoneInfo
    IDAG = datetime.now(ZoneInfo("Europe/Stockholm")).date()
except Exception:
    IDAG = datetime.now(timezone.utc).date()

SPARVAGN = {"0"} | {str(t) for t in range(900, 907)}  # GTFS: 0 = spårvagn, 900-906 = utökade spårvagnstyper
# Reservfärger om tidtabellen saknar linjefärg (påhittade, inte Västtrafiks).
RESERV = ["#e5484d", "#f2a24a", "#3b82f6", "#9be15d", "#c25bf0", "#2fd0c3", "#f5d547",
          "#ff6fae", "#7dd3fc", "#4ade80", "#fda4af", "#f0abfc", "#a3e635"]


def rader(z, namn):
    namn_i_zip = next((n for n in z.namelist() if n.split("/")[-1] == namn), None)
    if not namn_i_zip:
        return
    with z.open(namn_i_zip) as f:
        yield from csv.DictReader(io.TextIOWrapper(f, encoding="utf-8-sig"))


def sek(t):
    h, m, s = t.strip().split(":")
    return int(h) * 3600 + int(m) * 60 + int(s)


def farg(c, i):
    c = (c or "").strip().lstrip("#")
    return "#" + c.lower() if len(c) == 6 else RESERV[i % len(RESERV)]


def meter(a, b, lat0):
    kx = 111320 * math.cos(math.radians(lat0))
    return math.hypot((b[0] - a[0]) * kx, (b[1] - a[1]) * 110540)


def forenkla(pts, tol, lat0):
    """Douglas-Peucker i meter."""
    if len(pts) < 3:
        return pts
    kx = 111320 * math.cos(math.radians(lat0))
    xy = [(p[0] * kx, p[1] * 110540) for p in pts]
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (x1, y1), (x2, y2) = xy[a], xy[b]
        dx, dy = x2 - x1, y2 - y1
        L = math.hypot(dx, dy) or 1e-9
        best, bi = 0, -1
        for i in range(a + 1, b):
            d = abs(dy * (xy[i][0] - x1) - dx * (xy[i][1] - y1)) / L
            if d > best:
                best, bi = d, i
        if best > tol:
            keep[bi] = True
            stack += [(a, bi), (bi, b)]
    return [p for p, k in zip(pts, keep) if k]


def langs_linjen(line, stopp, lat0):
    """Avstånd (m) längs linjen för varje hållplats, alltid framåt."""
    kx = 111320 * math.cos(math.radians(lat0))
    xy = [(p[0] * kx, p[1] * 110540) for p in line]
    cum = [0.0]
    for i in range(1, len(xy)):
        cum.append(cum[-1] + math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]))
    ut, seg0 = [], 0
    for s in stopp:
        px, py = s[0] * kx, s[1] * 110540
        best, bd, bs = 1e18, 0.0, seg0
        for i in range(seg0, len(xy) - 1):
            (x1, y1), (x2, y2) = xy[i], xy[i + 1]
            dx, dy = x2 - x1, y2 - y1
            L2 = dx * dx + dy * dy
            t = 0 if L2 == 0 else max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / L2))
            d = math.hypot(x1 + t * dx - px, y1 + t * dy - py)
            if d < best - 0.01:
                best, bd, bs = d, cum[i] + t * math.sqrt(L2), i
        if ut and bd < ut[-1]:
            bd = ut[-1]
        ut.append(round(bd, 1))
        seg0 = bs
    return ut, cum[-1]


def main(zip_path, ut_path, dagar=14):
    z = zipfile.ZipFile(zip_path)

    routes = {}
    for r in rader(z, "routes.txt"):
        if r.get("route_type", "").strip() in SPARVAGN:
            routes[r["route_id"]] = r
    if not routes:
        sys.exit("Hittade inga spårvagnslinjer (route_type 0/900) i tidtabellen.")

    trips = {}
    for t in rader(z, "trips.txt"):
        if t["route_id"] in routes:
            trips[t["trip_id"]] = t

    st = {}
    for r in rader(z, "stop_times.txt"):
        if r["trip_id"] in trips:
            st.setdefault(r["trip_id"], []).append(
                (int(r["stop_sequence"]), r["stop_id"], sek(r["arrival_time"] or r["departure_time"]),
                 sek(r["departure_time"] or r["arrival_time"])))

    stop_ids = {s[1] for v in st.values() for s in v}
    stops = {}
    for s in rader(z, "stops.txt"):
        if s["stop_id"] in stop_ids:
            stops[s["stop_id"]] = (float(s["stop_lon"]), float(s["stop_lat"]), s["stop_name"].strip())

    shape_ids = {t.get("shape_id") for t in trips.values() if t.get("shape_id")}
    shapes = {}
    for s in rader(z, "shapes.txt"):
        if s["shape_id"] in shape_ids:
            shapes.setdefault(s["shape_id"], []).append(
                (int(s["shape_pt_sequence"]), float(s["shape_pt_lon"]), float(s["shape_pt_lat"])))
    shapes = {k: [(x, y) for _, x, y in sorted(v)] for k, v in shapes.items()}

    # Trafikdagar
    fram = [IDAG + timedelta(days=i) for i in range(-1, dagar)]
    services = {t["service_id"] for t in trips.values()}
    aktiv = {d: set() for d in fram}
    vd = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for c in rader(z, "calendar.txt"):
        if c["service_id"] not in services:
            continue
        a, b = datetime.strptime(c["start_date"], "%Y%m%d").date(), datetime.strptime(c["end_date"], "%Y%m%d").date()
        for d in fram:
            if a <= d <= b and c[vd[d.weekday()]] == "1":
                aktiv[d].add(c["service_id"])
    for c in rader(z, "calendar_dates.txt"):
        if c["service_id"] not in services:
            continue
        d = datetime.strptime(c["date"], "%Y%m%d").date()
        if d in aktiv:
            (aktiv[d].add if c["exception_type"] == "1" else aktiv[d].discard)(c["service_id"])

    used = set().union(*aktiv.values())
    svc_idx = {s: i for i, s in enumerate(sorted(used))}

    route_list = sorted(routes.values(), key=lambda r: (len(r.get("route_short_name", "")), r.get("route_short_name", "")))
    route_idx = {r["route_id"]: i for i, r in enumerate(route_list)}
    out_routes = [{"n": r.get("route_short_name") or r.get("route_long_name", "?"),
                   "c": farg(r.get("route_color"), i),
                   "t": ("#" + r["route_text_color"].lower()) if len(r.get("route_text_color", "")) == 6 else None}
                  for i, r in enumerate(route_list)]

    names, name_idx = [], {}
    def nidx(n):
        if n not in name_idx:
            name_idx[n] = len(names)
            names.append(n)
        return name_idx[n]

    patterns, pat_idx, profiles, prof_idx, out_trips = [], {}, [], {}, []
    for tid, t in trips.items():
        if t["service_id"] not in used or tid not in st:
            continue
        seq = sorted(st[tid])
        if len(seq) < 2 or any(s[1] not in stops for s in seq):
            continue
        sids = tuple(s[1] for s in seq)
        key = (route_idx[t["route_id"]], t.get("shape_id") or "", sids)
        if key not in pat_idx:
            spts = [stops[s][:2] for s in sids]
            lat0 = spts[0][1]
            line = shapes.get(t.get("shape_id") or "") or spts
            line = [(round(x, 5), round(y, 5)) for x, y in forenkla(line, 2.0, lat0)]
            sd, total = langs_linjen(line, spts, lat0)
            pat_idx[key] = len(patterns)
            patterns.append({"r": route_idx[t["route_id"]], "g": line, "sd": sd, "s": [nidx(stops[s][2]) for s in sids]})
        p = pat_idx[key]
        start = seq[0][3]
        a = [s[2] - start for s in seq]
        d = [s[3] - start for s in seq]
        pk = (p, tuple(a), tuple(d))
        if pk not in prof_idx:
            prof_idx[pk] = len(profiles)
            profiles.append({"p": p, "a": a, "d": d})
        head = (t.get("trip_headsign") or "").strip() or stops[sids[-1]][2]
        out_trips.append([prof_idx[pk], start, svc_idx[t["service_id"]], nidx(head)])

    out_trips.sort(key=lambda x: x[1])
    data = {
        "skapad": IDAG.isoformat(),
        "kalla": "Västtrafik via Trafiklab (GTFS Regional)",
        "dagar": {d.isoformat(): sorted(svc_idx[s] for s in aktiv[d]) for d in fram},
        "linjer": out_routes,
        "namn": names,
        "monster": patterns,
        "profiler": profiles,
        "turer": out_trips,
    }
    with open(ut_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{len(out_routes)} linjer, {len(patterns)} körvägar, {len(out_trips)} turer, "
          f"{len(fram)} dagar -> {ut_path}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 14)
