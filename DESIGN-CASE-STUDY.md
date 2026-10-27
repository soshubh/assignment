# Shipway: clearer order management and account setup

## Scope and evidence

This assignment redesigns three connected post-login tasks: create an order, edit an existing order, and manage a user/business profile. The order list is included as the entry and return point for those tasks. Courier booking, billing transactions, and backend integrations remain outside the local prototype.

The supplied interface review and screenshots identify usability risks; they are not merchant interviews or measured usability-test findings. Severity scores and KPI improvements remain hypotheses to validate. The original research is preserved in the supplied attachment; this document describes the final implemented decisions.

## Design principles

1. One primary task per step. Buyer, Products, Payment, Packaging and Ship each have a distinct section.
2. Preserve work. New drafts autosave locally; edits to existing orders are deliberate, with a clear saved/unsaved state.
3. Explain recovery next to the error. Keep entered values and focus the first invalid field.
4. Separate saving from fulfilment. Save changes never initiates shipping. A review and confirmation are required to mark an order ready.
5. Reuse information. Catalogue products, saved pickup addresses, and package templates remove repeated entry.
6. Use Shipway’s brand through shared tokens, with accessible shadcn/ui controls and a responsive layout.

## Shared design system

| Role | Decision |
| --- | --- |
| Primary action | Shipway blue `#1E5EFF`; white text |
| Primary text | Deep navy `#050E24` |
| Supporting text | `#4B5876` |
| Selected / contextual surfaces | Pale blue `#EDF3FF` |
| Main surfaces | White cards; subtle cool borders; no shadows on buttons, controls, cards, menus or dialogs |
| Typography | Plus Jakarta Sans throughout; shared 28px semibold page titles, following the product typography refinement |
| Spacing | Shared 4px unit; 12–16px within groups; 20–24px between groups |
| Shape | Shared 12px base radius, with smaller radii derived from it |
| Feedback | Inline field errors, live save status, completeness and missing-section labels |
| Interaction | Visible keyboard focus; labelled controls; reduced-motion support |

Color, typography, and radius tokens are defined in `src/styles.css`. Form fields, section cards, summaries, and navigation patterns are reused across screens. The barcode stays black on white for contrast and is progressively disclosed to reduce distraction.

## Flow and layout specification

### Create order

Entry: Orders → Create order. An unfinished draft remains accessible from the list when a new order is started.

| Region | Structure |
| --- | --- |
| Header | Order ID, draft status, task title, autosave feedback |
| Progress | Buyer → Products → Payment → Packaging → Ship |
| Main column | Grouped cards for the active step; errors and recovery in context |
| Supporting column | Live summary of sender, recipient, products and total; expandable barcode |
| Action bar | Save draft / Save & exit; Back / Continue; Ship order only in the Ship section |

Buyer: optional address paste stays collapsed until requested. Parsing reports exactly what needs correction; unsupported cities remain editable. A compact pickup dialog saves and selects the new location without leaving the order.

Products: a searchable catalogue dropdown carries over prices without listing every catalogue item on the page. Custom products can be added to the order and optionally saved to the catalogue. Selected items use a bounded, scrollable table with quantity and removal controls.

Payment: COD/prepaid selection and visible shipping charges, other charges and discount fields. Packaging is a separate section with a template dropdown, dimensions, weight and pickup location. Weight guidance is available on demand.

Ship: selectable courier cards show the sample price, pickup, delivery and rating. A price/rating sort is available. The live right-hand summary is the only persistent review surface; there is no duplicate review panel. A final shipment confirmation distinguishes courier charge from the buyer’s payable amount.

### Edit existing order

Entry: Orders → order ID / View. There is one editor, with direct access to Buyer, Products, Payment, Packaging and Ship.

Save changes validates and persists the order without changing its fulfilment status. Unsaved edits are identified, and leaving through Back offers Save & leave, Discard changes, or Keep editing. Browser navigation also gets an unsaved-work guard. Orders already marked ready are shown read-only in this prototype.

### User profile

| Region | Structure |
| --- | --- |
| Header | Account title |
| Setup guidance | Compact checklist progress and next action within Business |
| Navigation | Personal, Business, Plans, Security & API, Privacy |
| Main column | Relevant grouped settings and contextual help |
| Layout | One content column; no internal sidebar or duplicate checklist |
| Action bar | Unsaved/saved status and explicit Save changes |

Personal details contain name, phone and email. Business contains company, brand, GST preference, billing address, billing method and sales channels. GST preference supports an explicit unregistered choice. Credentials remain masked by default and are hidden again when leaving their section. Customer-name visibility is a browser-only preference, clearly distinguished from API permissions.

## Traceability to the findings

| Research concern | Implemented response |
| --- | --- |
| Too many fields compete at once | Grouped steps and progressive disclosure |
| Pickup creation interrupts the task | Small in-context dialog; saved address selected immediately |
| Address errors lack recovery | Inline parsing guidance, editable results, retained values |
| Product/payment clutter | Catalogue-focused product step; payment in its own section |
| Package distractions | Reusable templates; barcode collapsed in summary |
| Courier comparison overload | Price/rating sorting and reasoned highlights on sample data |
| Quick vs complete edit ambiguity | One section-based editor |
| Excess scrolling to edit a field | Direct section navigation and review edit links |
| Save/ship confusion | Separate actions, explicit confirmation and persistent order status |
| Settings hard to locate | Personal/business/security/privacy grouping |
| Completion without direction | Named next action linked to the relevant field |
| Business/sensitive settings mixed | Dedicated credential and privacy areas |
| Unfamiliar terminology | Explanations for COD, billing methods, RTO and applicable weight |

## Success metrics: proposed evaluation

Targets below come from the supplied research. They are goals, not demonstrated results. Establish a baseline with the current product and evaluate the same tasks and merchant cohorts in the redesigned prototype.

| KPI | Operational definition | Proposed target |
| --- | --- | --- |
| Unassisted task completion | Successful create/edit/profile task completions ÷ valid task starts | 15–20% relative increase |
| Task completion time | Median elapsed time per successful task, excluding researcher interruptions | 20–30% reduction |
| Form error rate | Attempts with one or more validation errors ÷ all attempts; report errors per attempt separately | 25–30% relative reduction |

Use a counterbalanced usability study with new and experienced merchants. Tasks: create a COD order; recover from an incomplete pasted address; save and resume a draft; correct a buyer detail without shipping; find the next incomplete business setting. Record assistance, misclicks, backtracking and accidental ship attempts. Check that faster completion does not increase incorrect address, package or payment submissions.

Suggested production events, not live analytics in this prototype: `order_started`, `step_completed`, `validation_error` (field name only), `draft_saved`, `draft_resumed`, `edit_saved`, `shipping_confirmation_opened`, `order_marked_ready`, `profile_setup_action`, `profile_saved`. Exclude customer values and credentials from analytics.

## Validation and limitations

Automated store tests exercise validation/completeness, saved-draft recovery, independent new orders, edits versus fulfilment status, reusable pickup locations, parsing recovery and deduplication. Build and TypeScript checks cover the application. Browser checks exercise core task paths and desktop/mobile presentation.

Data is persisted in localStorage, not shared across devices or accounts. Sample courier prices are not recalculated from parcel details or serviceability. Pincode checks validate format, not courier coverage. Address parsing is a limited convenience rather than a geocoding service. The barcode encodes the order ID and does not open public tracking. Plan changes, actual courier booking, authentication and credential rotation are outside scope.

## Final simplification

The app uses a left sidebar with Orders, Help and Profile. Help and Profile are anchored at the bottom. The breadcrumb/wallet bar and duplicate profile checklist sidebar remain removed. Order contact fields share one desktop row, with the delivery address in the same Buyer card. Generic helper sentences and step subtitles are removed. Existing drafts migrate from the previous four-section flow without losing their data.
