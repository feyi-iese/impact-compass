# Barcelona NGO directory (static Pages site)

Single-page app: Leaflet map + embedded org data. Source of truth for content is [`../barcelona_ngo_final_with_map.html`](../barcelona_ngo_final_with_map.html); this folder is the **Cloudflare Pages publish root** (`index.html`).

## Deploy via Cloudflare dashboard

1. **Workers & Pages** → **Create** → **Pages** → Connect your Git repository.
2. **Build settings**
   - **Framework preset:** None
   - **Build command:** (empty)
   - **Build output directory:** `barcelona-pages`
3. Save and deploy. Open the `*.pages.dev` URL; the map should load tiles from OpenStreetMap and scripts from cdnjs.

## Deploy via Wrangler CLI

```bash
cd /path/to/impactCompass
npx wrangler pages deploy barcelona-pages --project-name=YOUR_PROJECT_NAME
```

First run: `npx wrangler login`.

## After changing the HTML

Copy the updated file into this folder:

```bash
cp ../barcelona_ngo_final_with_map.html ./index.html
```

## Optional: heavier traffic / OSM tile limits

OpenStreetMap’s public tile servers are for light use. If tiles fail or you outgrow [their usage policy](https://operations.osmfoundation.org/policies/tiles/), switch the `L.tileLayer(...)` URL in the HTML to a provider you subscribe to (Mapbox, MapTiler, Stadia, etc.) and update [`_headers`](_headers) `img-src` / `connect-src` if the provider needs extra hosts.
