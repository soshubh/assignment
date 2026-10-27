# Shipway workspace

A light-theme shipping prototype built with React, Vite, Tailwind CSS 4, and official shadcn/ui components, themed with Shipway’s blue and navy palette.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:5173. The existing URLs remain available: `/index.html`, `/order-new.html`, `/order-edit.html`, and `/profile.html`.

## Check

```sh
npm run build
npm run check
npm test
```

Brand typography follows Shipway’s homepage: Plus Jakarta Sans throughout, with a shared 28px semibold page-title style for a consistent product interface. Fonts load from Google Fonts; the official wordmark loads from Shipway’s CDN. Blue `#1E5EFF` and navy `#050E24` anchor the shared light theme.

Components live in `src/components/ui`; semantic theme tokens live in `src/styles.css`. To add another official component, run `npx shadcn@latest add <component>`.

This is a local prototype. Drafts and profile settings persist in browser localStorage. Courier rates are sample data; confirmations do not create live shipments. Funding and plan changes are informational placeholders.

The research-to-design rationale, flow specifications, KPI hypotheses, and validation plan are documented in [DESIGN-CASE-STUDY.md](./DESIGN-CASE-STUDY.md). New drafts autosave; existing-order edits require Save changes. Multiple saved orders and pickup locations persist locally.

The simplified flow is Buyer → Products → Payment → Packaging → Ship. Pickup lives in Packaging; custom products can be saved to the catalogue. A left sidebar contains Orders, Help and Profile; Profile is anchored at the bottom. The breadcrumb bar remains removed. All surfaces are shadow-free, with outline-based keyboard focus.

See [FEATURE-COVERAGE.md](./FEATURE-COVERAGE.md) for the screenshot-by-screenshot capability inventory, prioritization, prototype coverage and explicit integration boundaries. Bulk upload supports up to 100 CSV order rows with validation before draft import.
