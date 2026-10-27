const Store = {
  key: "shipway-redesign-v1",
  products: [
    { sku: "JSN789", name: "My Product 1", price: 140 },
    { sku: "JSN987", name: "My Product 1", price: 200 },
    { sku: "123-2343", name: "test", price: 2000 }
  ],
  pickups: [
    { id: "primary", label: "Primary", line: "fsa2q34, Faridabad, 121000, Haryana", phone: "9229349234" }
  ],
  templates: [
    { id: "flyer", name: "Flyer", l: 10, b: 10, h: 2, w: 0.2, type: "Flyer" },
    { id: "small", name: "Small box", l: 15, b: 12, h: 8, w: 0.5, type: "Box" },
    { id: "medium", name: "Medium box", l: 25, b: 20, h: 8, w: 0.5, type: "Box" },
    { id: "custom", name: "Custom", l: 10, b: 10, h: 10, w: 0.5, type: "Box" }
  ],
  couriers: [
    { id: "xb-s", name: "Xpressbees Surface", price: 82.84, eta: "28 Oct", pickup: "Tomorrow", mode: "Surface", rating: 3.8, why: "Lowest cost for this 0.5 kg COD order" },
    { id: "sw-p", name: "Shipway Prime", price: 121.91, eta: "29 Oct", pickup: "Today", mode: "Air", rating: 4.8, why: "Same-day pickup" },
    { id: "del-e", name: "Delhivery Express", price: 106.08, eta: "29 Oct", pickup: "Today", mode: "Air", rating: 4.7, why: "Air option with strong rating" }
  ]
};

function defaultDraft() {
  return {
    id: "ORD10000820",
    step: 1,
    channel: "WhatsApp",
    buyer: { phone: "", name: "", email: "", paste: "", line: "", landmark: "", pincode: "", city: "", state: "", country: "India" },
    pickup: "primary",
    products: [],
    payment: { mode: "COD", shipping: 0, other: 0, discount: 0 },
    pack: { template: "small", l: 15, b: 12, h: 8, w: 0.5, type: "Box" },
    courier: null,
    saved: false
  };
}

function load() {
  const raw = localStorage.getItem(Store.key);
  if (raw) return JSON.parse(raw);
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
      showCustomer: false
    }
  };
  save(data);
  return data;
}

function save(data) {
  localStorage.setItem(Store.key, JSON.stringify(data));
}

function completeness(order) {
  const bits = [
    !!(order.buyer.name && order.buyer.phone && order.buyer.pincode),
    order.products.length > 0,
    !!order.payment.mode,
    !!(order.pack.w && order.pack.l)
  ];
  const pct = Math.round((bits.filter(Boolean).length / 4) * 100);
  const missing = [];
  if (!bits[0]) missing.push("Buyer & address");
  if (!bits[1]) missing.push("Products");
  if (!bits[2]) missing.push("Payment");
  if (!bits[3]) missing.push("Package");
  return { pct, missing, bits };
}

function money(n) {
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function productTotal(order) {
  return order.products.reduce((s, p) => s + p.price * p.qty, 0);
}

function orderTotal(order) {
  return productTotal(order) + Number(order.payment.shipping || 0) + Number(order.payment.other || 0) - Number(order.payment.discount || 0);
}

function parseAddress(text) {
  const pin = (text.match(/\b\d{6}\b/) || [])[0];
  const cities = { Gurgaon: "Haryana", Gurugram: "Haryana", Faridabad: "Haryana", Delhi: "Delhi", Mumbai: "Maharashtra" };
  const city = Object.keys(cities).find((c) => text.toLowerCase().includes(c.toLowerCase()));
  if (!pin) {
    return { ok: false, message: "No 6-digit pincode found. Add a pincode so we can service the destination." };
  }
  return {
    ok: true,
    line: text.replace(/\b\d{6}\b/, "").replace(/India/i, "").trim(),
    pincode: pin,
    city: city || "",
    state: city ? cities[city] : "",
    country: "India"
  };
}

function icon(name) {
  const icons = {
    orders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 7h10M7 12h10M7 17h6"/><rect x="4" y="3" width="16" height="18" rx="3"/></svg>',
    create: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>',
    profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.2"/><path d="M5 19c1.5-3.2 4-5 7-5s5.5 1.8 7 5"/></svg>'
  };
  return icons[name] || "";
}

function mountShell(active) {
  const shell = document.querySelector("[data-shell]");
  if (!shell) return;
  shell.innerHTML = `
    <aside class="rail">
      <a class="brand" href="index.html" title="Orders">S</a>
      <nav>
        <a href="index.html" class="${active === "orders" ? "active" : ""}">${icon("orders")}<span>Orders</span></a>
        <a href="order-new.html" class="${active === "create" ? "active" : ""}">${icon("create")}<span>New</span></a>
        <a href="profile.html" class="${active === "profile" ? "active" : ""}">${icon("profile")}<span>Profile</span></a>
      </nav>
      <div class="spacer"></div>
    </aside>
    <div class="workspace">
      <header class="topbar">
        <label class="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
          <input placeholder="Search by order ID, AWB, phone number..." />
        </label>
        <div class="top-actions">
          <span class="pill warn">Unlock Reward</span>
          <span class="pill">₹0</span>
          <a class="funds" href="#">+ ADD FUNDS</a>
          <a class="account" href="profile.html">
            <span class="avatar">SS</span>
            <strong>Shipway</strong>
          </a>
        </div>
      </header>
      <div id="view"></div>
    </div>
  `;
}

function rationale(text) {
  return `
    <div class="note">
      <div class="card note-panel" id="rationale">${text}</div>
      <button class="btn btn-quiet" type="button" id="toggle-note">Design notes</button>
    </div>
  `;
}

function bindRationale() {
  const btn = document.getElementById("toggle-note");
  const panel = document.getElementById("rationale");
  if (!btn) return;
  btn.addEventListener("click", () => panel.classList.toggle("show"));
}

function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.style.cssText = "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#1b2433;color:#fff;padding:10px 14px;border-radius:8px;z-index:80;font-weight:650";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => (el.style.display = "none"), 1800);
}

window.Shipway = { Store, load, save, completeness, money, productTotal, orderTotal, parseAddress, mountShell, rationale, bindRationale, toast, defaultDraft };
