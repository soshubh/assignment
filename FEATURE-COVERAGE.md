# Coverage of the six supplied order screenshots

Scope: visible controls in the supplied screenshots. Hidden “View more fields”, undisplayed dropdown values, and details below the captured area cannot be verified from these images. They are not silently assumed to be covered. The six-service fixture is sample data; only five service names/prices are clearly readable in the references.

The existing five-section flow and flat Shipway design system are retained. Prioritization changes presentation, not whether the visible capability is tracked.

| Priority | Visible capability | Redesigned location | Implementation / boundary |
| --- | --- | --- | --- |
| P0 | Buyer name, phone, optional email | Buyer, first row | Editable; validation and persistence |
| P0 | Delivery address, landmark, pincode, city, state | Buyer | Editable; inline recovery |
| P0 | Country | Buyer | India shown explicitly; prototype supports domestic orders. Other country options are not visible in the references |
| P0 | Billing same as shipping / different billing address | Buyer | Checked by default; separate validated billing form when unchecked |
| P1 | Save buyer details for next order | Buyer → Saved buyer details | Optional local buyer recall; keyed by phone |
| P1 | Paste full address | Buyer → Paste address | Local parser, editable results, recovery guidance |
| P0 | Saved pickup selection | Packaging | Separate from buyer/drop-off information |
| P1 | Add / edit pickup address | Packaging → Pickup location | Local dialog; default-address edits and additional locations persist |
| P0 | SKU, product name, unit price, quantity | Products | Search catalogue or custom product; click an item name to edit its order-level SKU/name/price/quantity |
| P0 | Add multiple products | Products | Scrollable selected-items table; bounded searchable catalogue dropdown |
| P1 | Save product to catalogue | Custom product | Opt-in catalogue save; existing order-item edits do not silently change catalogue prices |
| P1 | Per-item discount | Products → Item discounts | Monetary line discount; cannot exceed line total; reflected in totals |
| P0 | Prepaid / COD | Payment | Explicit selection |
| P1 | Shipping charges, other charges, order discount | Payment | Separate editable amounts; total reconciliation |
| P1 | Gift card amount | Payment | Separate from discounts; reduces the outstanding amount; validated against amount due |
| P1 | Seller notes, maximum 200 characters | Payment → Seller notes | Label-note text, counter, persistence, summary disclosure. No live shipping label is issued |
| P0 | Total order value | Right-hand summary and Payment | Gross subtotal, item discounts, charges, order discount, gift card, net total |
| P0 | Auto-generated order ID | Header / summary | Stable ID and downloadable barcode; also readable in Order details |
| P1 | Channel: Custom, Facebook, WhatsApp, Instagram, Website | Products → Order details | Optional metadata, separated from physical package measurements |
| P1 | Add/remove tags | Products → Order details | Optional chips; Enter or Add; persisted |
| P0 | Length, breadth, height, dead weight | Packaging | Editable, validated measurements |
| P0 | Flyer / Box type | Packaging | Independent type selector; custom dimensions retained |
| P1 | Saved dimensions / package reuse | Packaging → Save as template | Default and custom templates; custom templates persist |
| P1 | Actual, volumetric, applicable weight | Packaging → How is weight calculated? | Actual/volumetric values and calculation visible on demand; applicable value prominent |
| P2 | Packaging guidelines | Packaging → Packaging guidance | Expandable measuring and packing guidance |
| P2 | Upload product/package photo | Packaging → Package photo & assistance | Local JPG/PNG/WebP attachment, preview, removal, persistence; 500 KB cap |
| Integration | AI weight/dimension estimation | Packaging → Package photo & assistance | Entry retained, explicitly disabled until a measurement service is connected; no invented image-derived measurements |
| Integration | Mobile/WhatsApp photo upload QR | Packaging → Package photo & assistance | Entry retained, explicitly disabled. Requires shared upload storage, order pairing and a phone/WhatsApp integration. The order-ID barcode is a separate capability |
| P0 | Courier cards with name, price, rating, pickup and expected delivery | Ship | Sample courier cards; explicit selection and shipment confirmation |
| P1 | All / Air / Surface / Express Delivery | Ship | Working filters; Express is treated as a service capability, separately from transport mode |
| P1 | Cheapest / Fastest / Rating sort | Ship | Working three-way sort; fastest uses explicit sample delivery durations |
| P1 | Pickup/drop pincodes, weight and order value | Ship context row / summary | Available without introducing a duplicate review page |
| P1 | Service benefits and price information | Ship → Service benefits & rate details | Reference benefits explained as unverified sample terms; actual eligibility/taxes/surcharges require live quotes |
| P0 | Update order versus update and ship | Save changes / Ship order | Save does not ship. Shipping validates all sections and confirms the chosen courier |
| P1 | Single order versus bulk upload | Orders → Create order / Bulk upload | CSV template, bounded upload, preview with row errors, valid-row import into drafts; one order/product per CSV row |
| P0 | Sender, recipient, products, payment, date, barcode summary | Right-hand summary | Live updates; optional details disclosed; long product lists summarized with expansion |

## Prioritization

- **P0 — keep visible:** task-critical buyer, products, payment method, measurements, pickup and courier choices. Keep the single summary on the right.
- **P1 — available in context:** discounts, gift cards, notes, metadata, address editing, sorting, reusable templates and bulk entry. Optional fields are disclosed instead of removed.
- **P2 — secondary assistance:** packaging education and photo attachment. These do not block manual completion.
- **Integration-dependent:** actual courier availability/booking, AI measurements, synchronized mobile/WhatsApp QR upload, live benefit eligibility, wallet/billing transactions and shipping-label generation. No simulated financial or fulfilment action is represented as a live transaction.

## Verification

Store tests cover billing opt-in, discount/gift-card reconciliation, notes/tags/photo metadata persistence, saved buyers, pickup edits, custom templates, courier filtering/sorting, CSV parsing and row validation, and migration of older drafts. The prior draft/edit/shipping tests remain in place. UI checks cover the restored field groups and disclosures.

## Open evidence gaps

The content of the collapsed buyer “View more fields” is not shown. The full original bulk-upload workflow, live quote breakdown, service-benefit terms, AI estimator output and mobile handoff flow are not supplied. Those need the corresponding screenshots or a connected service before exact parity can be asserted. Existing unrelated modules in the source sidebar (analytics, returns, NDR, billing, services and tools) remain outside the agreed create/edit/profile assignment scope.
