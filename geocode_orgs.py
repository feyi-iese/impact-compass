"""
Barcelona NGO Geocoder — run this on your own machine.

Requirements:
    pip install requests

Usage:
    python geocode_orgs.py

What it does:
    1. Reads the org data embedded in barcelona_ngo_v2.html
    2. Geocodes each address using Nominatim (free, no API key needed)
    3. Saves coordinates to coords.json
    4. Patches the HTML file to add lat/lon to every org

Rate limit: Nominatim requires max 1 request/second.
320 orgs will take ~6 minutes. Don't run this repeatedly —
cache the results in coords.json and reuse them.
"""

import json, time, re, sys
import requests

HTML_FILE = "barcelona_ngo_final.html"
COORDS_FILE = "coords.json"
HEADERS = {"User-Agent": "BarcelonaNGODirectory/1.0 (contact@yourorg.com)"}

def geocode(address, neighborhood):
    queries = []
    if address and address.strip():
        queries.append(f"{address.strip()}, Barcelona, Spain")
    if neighborhood and neighborhood.strip():
        queries.append(f"{neighborhood.strip()}, Barcelona, Spain")
    queries.append("Barcelona, Spain")

    for q in queries:
        try:
            r = requests.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": q, "format": "json", "limit": 1, "countrycodes": "es"},
                headers=HEADERS,
                timeout=10
            )
            data = r.json()
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"]), q
        except Exception as e:
            print(f"  Request error: {e}")
        time.sleep(1.1)

    return None, None, None

def main():
    # Load existing coords cache if available
    try:
        with open(COORDS_FILE) as f:
            coords = json.load(f)
        print(f"Loaded {len(coords)} cached coordinates from {COORDS_FILE}")
    except FileNotFoundError:
        coords = {}

    # Extract orgs from HTML
    with open(HTML_FILE, encoding="utf-8") as f:
        html = f.read()

    match = re.search(r"const RAW = (\[.+?\]);\n", html, re.DOTALL)
    if not match:
        sys.exit("Could not find org data in HTML. Make sure you're using barcelona_ngo_v2.html")

    orgs = json.loads(match.group(1))
    print(f"Found {len(orgs)} orgs in HTML\n")

    # Geocode missing ones
    new_coords = 0
    for i, org in enumerate(orgs):
        key = org["name"]
        if key in coords:
            print(f"[{i+1:3d}] cached  — {org['name'][:55]}")
            continue

        lat, lon, matched = geocode(org.get("address", ""), org.get("neighborhood", ""))
        coords[key] = {"lat": lat, "lon": lon, "via": matched}
        new_coords += 1

        status = "OK " if lat else "FAIL"
        print(f"[{i+1:3d}] {status} ({lat:.4f},{lon:.4f}) via '{matched}'" if lat
              else f"[{i+1:3d}] FAIL — {org['name'][:55]}")

        # Save after every 10 to avoid losing progress
        if new_coords % 10 == 0:
            with open(COORDS_FILE, "w") as f:
                json.dump(coords, f, ensure_ascii=False, indent=2)

        time.sleep(1.1)

    # Save final coords
    with open(COORDS_FILE, "w") as f:
        json.dump(coords, f, ensure_ascii=False, indent=2)
    print(f"\nSaved {len(coords)} coordinates to {COORDS_FILE}")

    # Patch orgs with coordinates
    for org in orgs:
        c = coords.get(org["name"], {})
        org["lat"] = c.get("lat")
        org["lon"] = c.get("lon")

    geocoded = sum(1 for o in orgs if o.get("lat"))
    print(f"Geocoded: {geocoded}/{len(orgs)} orgs")

    # Write patched HTML
    new_raw = json.dumps(orgs, ensure_ascii=False)
    patched = re.sub(r"const RAW = \[.+?\];", f"const RAW = {new_raw};", html, flags=re.DOTALL)

    out_file = HTML_FILE.replace(".html", "_with_map.html")
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(patched)
    print(f"\nPatched HTML saved to: {out_file}")
    print("You can now open this file in a browser or send it to others.")

if __name__ == "__main__":
    main()
