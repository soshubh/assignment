import { Shipway as S, validateOrder, normalizeOrder } from "./store.js";
export const bulkColumns = [
  "buyer_name",
  "phone",
  "email",
  "address",
  "pincode",
  "city",
  "state",
  "sku",
  "product_name",
  "unit_price",
  "quantity",
  "payment_mode",
];
export function parseCsv(text) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (ch === "," || ch === "\n" || ch === "\r")) {
      row.push(cell);
      cell = "";
      if (ch !== ",") {
        if (row.some((c) => c.trim())) rows.push(row);
        row = [];
        if (ch === "\r" && text[i + 1] === "\n") i++;
      }
    } else cell += ch;
  }
  if (quoted) throw Error("A quoted field is not closed.");
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}
export function previewBulkOrders(text) {
  const rows = parseCsv(text.replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw Error("Add a header and at least one order row.");
  if (rows.length > 101) throw Error("Import up to 100 orders per file.");
  const headers = rows[0].map((v) => v.trim().toLowerCase());
  const missing = bulkColumns.filter((k) => !headers.includes(k));
  if (missing.length) throw Error("Missing columns: " + missing.join(", "));
  if (new Set(headers).size !== headers.length)
    throw Error("Remove duplicate column names.");
  return rows.slice(1).map((cells, index) => {
    const values = Object.fromEntries(
      headers.map((key, i) => [key, (cells[i] || "").trim()]),
    );
    const base = S.defaultDraft();
    const draft = normalizeOrder({
      ...base,
      buyer: {
        ...base.buyer,
        name: values.buyer_name,
        phone: values.phone,
        email: values.email,
        line: values.address,
        pincode: values.pincode,
        city: values.city,
        state: values.state,
      },
      products: [
        {
          sku: values.sku || `IMPORT-${index + 1}`,
          name: values.product_name,
          price: Number(values.unit_price),
          qty: Number(values.quantity),
          discount: 0,
        },
      ],
      payment: { ...base.payment, mode: values.payment_mode },
      status: "Draft",
      flowVersion: 2,
    });
    const errors = Object.values(validateOrder(draft));
    if (cells.length !== headers.length)
      errors.push("Column count does not match the header.");
    if (!values.product_name) errors.push("Product name is required.");
    if (
      values.unit_price === "" ||
      !Number.isFinite(Number(values.unit_price)) ||
      Number(values.unit_price) < 0
    )
      errors.push("Enter a valid unit price.");
    return { row: index + 2, order: draft, errors };
  });
}
