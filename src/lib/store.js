const Store = {
  key: "shipway-redesign-v1",
  products: [
    { sku: "JSN789", name: "Everyday cotton T-shirt", price: 140 },
    { sku: "JSN987", name: "Canvas tote bag", price: 200 },
    { sku: "123-2343", name: "Everyday essentials bundle", price: 2000 },
  ],
  pickups: [
    {
      id: "primary",
      label: "Primary",
      line: "fsa2q34, Faridabad, 121000, Haryana",
      phone: "9229349234",
    },
    ...[
      ["demo-gurugram", "Gurugram warehouse · Demo", "12 Demo Warehouse Road", "Gurugram", "Haryana", "122001"],
      ["demo-delhi", "Delhi office · Demo", "24 Demo Office Road", "New Delhi", "Delhi", "110001"],
      ["demo-mumbai", "Mumbai warehouse · Demo", "36 Demo Warehouse Road", "Mumbai", "Maharashtra", "400001"],
      ["demo-bengaluru", "Bengaluru office · Demo", "48 Demo Office Road", "Bengaluru", "Karnataka", "560001"],
    ].map(([id, label, addressLine1, city, state, pincode]) => ({
      id, label, addressLine1, city, state, pincode, country: "India",
      line: [addressLine1, city, state, pincode, "India"].join(", "),
      phone: "9876543210",
    })),
  ],
  templates: [
    { id: "flyer", name: "Flyer", l: 10, b: 10, h: 2, w: 0.2, type: "Flyer" },
    { id: "small", name: "Small box", l: 15, b: 12, h: 8, w: 0.5, type: "Box" },
    {
      id: "medium",
      name: "Medium box",
      l: 25,
      b: 20,
      h: 8,
      w: 0.5,
      type: "Box",
    },
    { id: "custom", name: "Custom", l: 10, b: 10, h: 10, w: 0.5, type: "Box" },
  ],
  couriers: [
    {
      id: "xb-e",
      name: "Xpressbees Express",
      price: 81.66,
      eta: "28 Oct",
      deliveryDays: 2,
      pickup: "Tomorrow",
      mode: "Air",
      rating: 3.8,
      express: true,
    },
    {
      id: "xb-s",
      name: "Xpressbees Surface",
      price: 82.84,
      eta: "28 Oct",
      deliveryDays: 2,
      pickup: "Tomorrow",
      mode: "Surface",
      rating: 3.8,
      express: false,
    },
    {
      id: "sw-p",
      name: "Shipway Prime",
      price: 121.91,
      eta: "29 Oct",
      deliveryDays: 3,
      pickup: "Tomorrow",
      mode: "Air",
      rating: 4.6,
      express: true,
      benefit:
        "Sample reference: refund benefit for delays and RTO. Eligibility and terms require a live service.",
    },
    {
      id: "del-e",
      name: "Delhivery Express",
      price: 106.08,
      eta: "29 Oct",
      deliveryDays: 3,
      pickup: "Tomorrow",
      mode: "Air",
      rating: 4.7,
      express: true,
    },
    {
      id: "shadow-s",
      name: "Shadowfax Surface",
      price: 105.02,
      eta: "30 Oct",
      deliveryDays: 4,
      pickup: "Tomorrow",
      mode: "Surface",
      rating: 4.4,
      express: false,
    },
    {
      id: "del-s",
      name: "Delhivery Surface",
      price: 99.5,
      eta: "30 Oct",
      deliveryDays: 4,
      pickup: "Tomorrow",
      mode: "Surface",
      rating: 4.7,
      express: false,
    },
  ],
};

function defaultDraft() {
  return {
    id: `ORD${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    step: 1,
    status: "Draft",
    channel: "Manual",
    tags: [],
    billingSameAsShipping: true,
    billing: {
      name: "",
      line: "",
      pincode: "",
      city: "",
      state: "",
      country: "India",
    },
    rememberBuyer: true,
    sellerNotes: "",
    buyer: {
      phone: "",
      name: "",
      email: "",
      paste: "",
      line: "",
      landmark: "",
      pincode: "",
      city: "",
      state: "",
      country: "India",
    },
    pickup: "primary",
    products: [],
    payment: { mode: "COD", shipping: 0, other: 0, discount: 0, giftCard: 0 },
    pack: { template: "small", l: 15, b: 12, h: 8, w: 0.5, type: "Box" },
    courier: null,
    saved: false,
  };
}

function load() {
  const raw = localStorage.getItem(Store.key);
  if (raw) {
    const data = JSON.parse(raw);
    data.draft = normalizeOrder(data.draft);
    data.orders = (data.orders || []).map(normalizeOrder);
    return data;
  }
  const data = {
    draft: defaultDraft(),
    profile: {
      name: "Shubh Singh",
      email: "shubh228171singh@gmail.com",
      phone: "9140386605",
      company: "Test",
      brand: "Test",
      gst: "",
      billing: "Prepaid",
      address: "",
      volume: "New Business Startup",
      goal: "On-time Delivery",
      website: "",
      ecommerce: "",
      instagram: "",
      apiMasked: true,
      showCustomer: false,
    },
  };
  save(data);
  return data;
}

function save(data) {
  localStorage.setItem(Store.key, JSON.stringify(data));
}

function completeness(order) {
  const errors = validateOrder(order);
  const groups = [
    [
      "name",
      "phone",
      "email",
      "line",
      "pincode",
      "city",
      "state",
      "billing_name",
      "billing_line",
      "billing_city",
      "billing_state",
      "billing_pincode",
    ],
    ["products"],
    ["payment", "shipping", "other", "discount", "giftCard", "sellerNotes"],
    ["l", "b", "h", "w", "pickup"],
  ];
  const bits = groups.map((keys) => keys.every((key) => !errors[key]));
  const labels = ["Buyer & address", "Products", "Payment", "Package"];
  return {
    pct: Math.round((bits.filter(Boolean).length / 4) * 100),
    bits,
    missing: labels.filter((_, i) => !bits[i]),
  };
}

function money(n) {
  return (
    "₹" +
    Number(n).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function productTotal(order) {
  return grossProductTotal(order) - itemDiscountTotal(order);
}

function orderTotal(order) {
  return (
    productTotal(order) +
    Number(order.payment.shipping || 0) +
    Number(order.payment.other || 0) -
    Number(order.payment.discount || 0) -
    Number(order.payment.giftCard || 0)
  );
}

function parseAddress(text) {
  const pin = (text.match(/\b\d{6}\b/) || [])[0];
  const cities = {
    Gurgaon: "Haryana",
    Gurugram: "Haryana",
    Faridabad: "Haryana",
    Delhi: "Delhi",
    Mumbai: "Maharashtra",
  };
  const city = Object.keys(cities).find((c) =>
    text.toLowerCase().includes(c.toLowerCase()),
  );
  if (!pin) {
    return {
      ok: false,
      message:
        "No 6-digit pincode found. Add a pincode so we can service the destination.",
    };
  }
  return {
    ok: true,
    line: text
      .replace(/\b\d{6}\b/, "")
      .replace(/India/i, "")
      .trim(),
    pincode: pin,
    city: city || "",
    state: city ? cities[city] : "",
    country: "India",
  };
}

export const Shipway = {
  Store,
  load,
  save,
  completeness,
  money,
  productTotal,
  orderTotal,
  parseAddress,
  defaultDraft,
};

export function existingOrder(id) {
  const saved = localStorage.getItem("shipway-edited-" + id);
  if (saved) return normalizeOrder(JSON.parse(saved));
  if (id.startsWith("DEMO-")) {
    const sample = sampleOrders().find((order) => order.id === id);
    if (sample) return sample;
  }
  const product =
    id === "TESTOCT0005"
      ? Store.products[0]
      : id === "TESTOCT0003"
        ? Store.products[1]
        : Store.products[2];
  return {
    ...defaultDraft(),
    id,
    createdAt: "2026-10-26T05:30:00.000Z",
    status: "New",
    buyer: {
      phone: "9293492340",
      name: id.startsWith("TEST") ? "Demo customer" : "test",
      email: "customer@example.com",
      line: "Demo delivery address",
      pincode: "122000",
      city: "Gurugram",
      state: "Haryana",
      country: "India",
    },
    products: [{ ...product, qty: 1 }],
  };
}

// Stable demo fixtures enrich every status without overwriting saved user orders.
function sampleOrders() {
  return [
    ["DEMO-1001", "New", 0, 2, "2026-10-26", "Mira Shah"],
    ["DEMO-1002", "New", 1, 3, "2026-10-25", "Arjun Mehta"],
    ["DEMO-1003", "Ready for Pickup", 2, 1, "2026-10-26", "Neha Rao"],
    ["DEMO-1004", "Ready for Pickup", 0, 4, "2026-10-25", "Kabir Das"],
    ["DEMO-1005", "In Transit", 1, 2, "2026-10-24", "Riya Kapoor"],
    ["DEMO-1006", "In Transit", 2, 2, "2026-10-23", "Dev Sharma"],
    ["DEMO-1007", "Draft", 0, 1, "2026-10-26", "Anaya Patel"],
    ["DEMO-1008", "Draft", 1, 2, "2026-10-25", "Ishaan Roy"],
  ].map(([id, status, product, qty, date, name]) => {
    const base = defaultDraft();
    return {
      ...base,
      id,
      status,
      createdAt: `${date}T05:30:00.000Z`,
      flowVersion: 2,
      step: status === "Draft" ? 2 : 5,
      saved: true,
      buyer: {
        ...base.buyer,
        name,
        email: "demo@example.com",
        phone: "9876543210",
        line: "Demo delivery address",
        city: "Gurugram",
        state: "Haryana",
        pincode: "122000",
      },
      products: [{ ...Store.products[product], qty }],
      payment: {
        mode: "Prepaid",
        shipping: 0,
        other: 0,
        discount: 0,
        giftCard: 0,
      },
      pack: { template: "small", l: 15, b: 12, h: 8, w: 0.5, type: "Box" },
      pickup: "primary",
      courier: ["Ready for Pickup", "In Transit"].includes(status)
        ? "xb-s"
        : null,
      ...(status === "Draft"
        ? {
            pack: {
              template: "custom",
              l: "",
              b: "",
              h: "",
              w: "",
              type: "Box",
            },
          }
        : {}),
    };
  });
}

// One validation model powers field errors, completeness, and the shipping guard.
export function validateOrder(order) {
  const errors = {};
  const b = order.buyer;
  if (!b.name.trim()) errors.name = "Enter the buyer’s full name.";
  if (!/^[6-9]\d{9}$/.test(b.phone))
    errors.phone = "Enter a 10-digit Indian mobile number starting with 6–9.";
  if (b.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email))
    errors.email = "Enter a valid email address, or leave it blank.";
  if (!b.line.trim()) errors.line = "Add a house, building, or street address.";
  if (!/^[1-9]\d{5}$/.test(b.pincode))
    errors.pincode = "Enter a 6-digit pincode that does not start with 0.";
  if (!b.city.trim()) errors.city = "Enter the delivery city.";
  if (!b.state.trim()) errors.state = "Enter the delivery state.";
  if (!order.pickup) errors.pickup = "Select a pickup address.";
  if (!order.products.length)
    errors.products = "Add at least one product from your catalogue.";
  if (order.products.some((p) => !Number.isInteger(p.qty) || p.qty < 1))
    errors.products = "Product quantities must be whole numbers of at least 1.";
  if (!["COD", "Prepaid"].includes(order.payment.mode))
    errors.payment = "Select a payment method.";
  for (const key of ["shipping", "other", "discount", "giftCard"])
    if (
      !Number.isFinite(Number(order.payment[key] || 0)) ||
      Number(order.payment[key] || 0) < 0
    )
      errors[key] = "Enter an amount of 0 or more.";
  if (
    Number(order.payment.discount) >
    productTotal(order) +
      Number(order.payment.shipping) +
      Number(order.payment.other)
  )
    errors.discount = "Discount cannot exceed the order value.";
  if (
    Number(order.payment.giftCard || 0) >
    productTotal(order) +
      Number(order.payment.shipping || 0) +
      Number(order.payment.other || 0) -
      Number(order.payment.discount || 0)
  )
    errors.giftCard = "Gift card cannot exceed the amount due.";
  if (
    order.products.some(
      (p) =>
        !Number.isFinite(Number(p.price)) ||
        Number(p.price) < 0 ||
        !Number.isFinite(Number(p.discount || 0)) ||
        Number(p.discount || 0) < 0 ||
        Number(p.discount || 0) > Number(p.price) * Number(p.qty),
    )
  )
    errors.products =
      "Check item prices and discounts. A discount cannot exceed its line total.";
  if (order.billingSameAsShipping === false) {
    for (const key of ["name", "line", "city", "state"])
      if (!order.billing?.[key]?.trim())
        errors["billing_" + key] = "Complete the billing " + key + ".";
    if (!/^[1-9]\d{5}$/.test(order.billing?.pincode || ""))
      errors.billing_pincode = "Enter a valid 6-digit billing pincode.";
  }
  if ((order.sellerNotes || "").length > 200)
    errors.sellerNotes = "Keep seller notes within 200 characters.";
  for (const key of ["l", "b", "h", "w"])
    if (
      !Number.isFinite(Number(order.pack[key])) ||
      Number(order.pack[key]) <= 0
    )
      errors[key] = "Enter a value greater than 0.";
  return errors;
}
export function stepErrors(order, step) {
  const keys = [
    [
      "name",
      "phone",
      "email",
      "line",
      "pincode",
      "city",
      "state",
      "billing_name",
      "billing_line",
      "billing_city",
      "billing_state",
      "billing_pincode",
    ],
    ["products"],
    ["payment", "shipping", "other", "discount", "giftCard", "sellerNotes"],
    ["l", "b", "h", "w", "pickup"],
  ][step - 1];
  const errors = validateOrder(order);
  return Object.fromEntries(
    Object.entries(errors).filter(([key]) => !keys || keys.includes(key)),
  );
}
export function getOrders() {
  const data = load();
  const shipped = JSON.parse(localStorage.getItem("shipway-shipped") || "[]");
  const map = new Map(
    ["TESTOCT0005", "TESTOCT0003", "ORD10000748"].map((id) => [
      id,
      { ...existingOrder(id), status: "New" },
    ]),
  );
  for (const order of sampleOrders()) map.set(order.id, order);
  for (const order of data.orders || []) map.set(order.id, order);
  map.set(data.draft.id, {
    ...data.draft,
    status: data.draft.status || "Draft",
  });
  return [...map.values()].map((order) => ({
    ...order,
    status: shipped.includes(order.id)
      ? "Ready for Pickup"
      : order.status || "Draft",
  }));
}
export function saveOrder(order) {
  const data = load();
  const next = {
    ...normalizeOrder(order),
    updatedAt: new Date().toISOString(),
    saved: true,
  };
  data.orders = [...(data.orders || []).filter((o) => o.id !== next.id), next];
  if (data.draft.id === next.id) data.draft = next;
  if (next.rememberBuyer !== false && next.buyer.name && next.buyer.phone)
    data.buyers = [
      ...(data.buyers || []).filter((b) => b.phone !== next.buyer.phone),
      next.buyer,
    ];
  save(data);
  localStorage.setItem("shipway-edited-" + next.id, JSON.stringify(next));
  window.dispatchEvent(new Event("shipway:updated"));
  return next;
}
export function startDraft() {
  const data = load();
  if (data.draft.saved || data.draft.buyer.name || data.draft.products.length) {
    data.orders = [
      ...(data.orders || []).filter((o) => o.id !== data.draft.id),
      data.draft,
    ];
    data.draft = defaultDraft();
    save(data);
  }
  return data.draft;
}
export function getPickups() {
  const data = load();
  return [
    ...Store.pickups.map((p) => ({
      ...p,
      ...(data.pickupOverrides || {})[p.id],
    })),
    ...(data.pickups || []),
  ];
}
export function addPickup(address) {
  const data = load();
  const entry = { ...address, id: crypto.randomUUID() };
  data.pickups = [...(data.pickups || []), entry];
  save(data);
  return entry;
}

export function getCatalogue() {
  return [...Store.products, ...(load().catalogue || [])];
}
export function saveCatalogueProduct(product) {
  const data = load();
  data.catalogue = [...(data.catalogue || []), product];
  save(data);
}

export function normalizeOrder(order) {
  return {
    ...order,
    tags: order.tags || [],
    billingSameAsShipping: order.billingSameAsShipping !== false,
    billing: {
      name: "",
      line: "",
      pincode: "",
      city: "",
      state: "",
      country: "India",
      ...order.billing,
    },
    rememberBuyer: order.rememberBuyer !== false,
    sellerNotes: order.sellerNotes || "",
    payment: { giftCard: 0, ...order.payment },
    products: order.products.map((p) => ({ discount: 0, ...p })),
  };
}
export function grossProductTotal(order) {
  return order.products.reduce(
    (sum, p) => sum + Number(p.price) * Number(p.qty),
    0,
  );
}
export function itemDiscountTotal(order) {
  return order.products.reduce((sum, p) => sum + Number(p.discount || 0), 0);
}
export function getBuyers() {
  return load().buyers || [];
}
export function updatePickup(id, address) {
  const data = load();
  if (Store.pickups.some((p) => p.id === id)) {
    data.pickupOverrides = { ...data.pickupOverrides, [id]: address };
  } else
    data.pickups = (data.pickups || []).map((p) =>
      p.id === id ? { ...p, ...address } : p,
    );
  save(data);
}
export function filterCouriers(couriers, mode = "All", sort = "price") {
  return couriers
    .filter((c) =>
      mode === "All" || mode === "Express"
        ? mode === "All" || c.express
        : c.mode === mode,
    )
    .sort((a, b) =>
      sort === "rating"
        ? b.rating - a.rating
        : sort === "fastest"
          ? a.deliveryDays - b.deliveryDays
          : a.price - b.price,
    );
}

export function getPackageTemplates() {
  return [...Store.templates, ...(load().packageTemplates || [])];
}
export function savePackageTemplate(name, pack) {
  const data = load();
  const template = { ...pack, id: crypto.randomUUID(), name: name.trim() };
  data.packageTemplates = [...(data.packageTemplates || []), template];
  save(data);
  return template;
}
