import { AddressEntry } from "@/components/address-entry";
import {
  BuyerOptions,
  OrderMetadata,
  PhotoAssistance,
  PackagingGuidance,
  SavePackageTemplate,
} from "@/components/order-extras";
import { useState } from "react";
import { Plus, Search, X, Check, ChevronsUpDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Field, Panel, SelectField } from "@/components/form";
import { cn } from "@/lib/utils";
import {
  Shipway as S,
  addPickup,
  getPickups,
  getCatalogue,
  saveCatalogueProduct,
  updatePickup,
  filterCouriers,
  getPackageTemplates,
} from "@/lib/store";

type SectionProps = {
  order: any;
  setOrder: (value: any) => void;
  errors: Record<string, string>;
};
export function BuyerSection({ order, setOrder, errors }: SectionProps) {
  const [paste, setPaste] = useState("");
  const [message, setMessage] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const update = (key: string, value: string) =>
    setOrder((d: any) => ({ ...d, buyer: { ...d.buyer, [key]: value } }));
  function fill() {
    const result = S.parseAddress(paste);
    if (!result.ok) {
      setMessage("Add a 6-digit pincode, or enter the address below.");
      return;
    }
    const { ok: _, ...address } = result;
    setOrder((d: any) => ({
      ...d,
      buyer: {
        ...d.buyer,
        ...address,
        city: address.city || d.buyer.city,
        state: address.state || d.buyer.state,
      },
    }));
    setMessage("");
    setPasteOpen(false);
  }
  return (
    <Panel title="Buyer information">
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <Field
            label="Full name"
            id="buyer-name"
            required
            autoComplete="name"
            value={order.buyer.name}
            error={errors.name}
            onChange={(v: string) => update("name", v)}
            placeholder="Full name"
          />
          <Field
            label="Mobile number"
            id="buyer-phone"
            required
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={order.buyer.phone}
            error={errors.phone}
            onChange={(v: string) => update("phone", v.replace(/\D/g, ""))}
            placeholder="10-digit number"
          />
          <Field
            label="Email (optional)"
            id="buyer-email"
            type="email"
            autoComplete="email"
            value={order.buyer.email}
            error={errors.email}
            onChange={(v: string) => update("email", v)}
            placeholder="buyer@example.com"
          />
        </div>
        <div className="space-y-4 border-t pt-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium">Delivery address</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPasteOpen(!pasteOpen)}
            >
              {pasteOpen ? "Close" : "Paste address"}
            </Button>
          </div>
          {pasteOpen && (
            <div className="space-y-3 rounded-lg border p-3">
              <Label htmlFor="address-paste">Full address</Label>
              <Textarea
                id="address-paste"
                value={paste}
                onChange={(e) => {
                  setPaste(e.target.value);
                  setMessage("");
                }}
                placeholder="Street, city, state and pincode"
              />
              <div className="flex items-center justify-between gap-3">
                <p role="status" className="text-xs text-destructive">
                  {message}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!paste.trim()}
                  onClick={fill}
                >
                  Fill address
                </Button>
              </div>
            </div>
          )}
          <AddressEntry
            prefix="buyer"
            value={order.buyer}
            errors={errors}
            landmark
            onChange={(address) =>
              setOrder((d: any) => ({
                ...d,
                buyer: { ...d.buyer, ...address },
              }))
            }
          />
        </div>
        <BuyerOptions order={order} setOrder={setOrder} errors={errors} />
      </div>
    </Panel>
  );
}
export function ProductsSection({ order, setOrder, errors }: SectionProps) {
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [custom, setCustom] = useState({
    name: "",
    sku: "",
    price: "",
    qty: 1,
  });
  const [customError, setCustomError] = useState("");
  const [saveToCatalogue, setSaveToCatalogue] = useState(true);
  function add(product: any, qty = 1) {
    setOrder((d: any) => ({
      ...d,
      products: d.products.some((p: any) => p.sku === product.sku)
        ? d.products.map((p: any) =>
            p.sku === product.sku ? { ...p, qty: p.qty + qty } : p,
          )
        : [...d.products, { ...product, qty }],
    }));
    setOpen(false);
  }
  function addCustom() {
    if (
      !custom.name.trim() ||
      custom.price === "" ||
      !Number.isFinite(Number(custom.price)) ||
      Number(custom.price) < 0 ||
      !Number.isInteger(Number(custom.qty)) ||
      Number(custom.qty) < 1
    ) {
      setCustomError(
        "Enter a name, a valid price, and a whole-number quantity of at least 1.",
      );
      return;
    }
    const sku =
      custom.sku.trim() ||
      `CUSTOM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    if (
      [...getCatalogue(), ...order.products].some(
        (p) =>
          p.sku !== editingSku && p.sku.toLowerCase() === sku.toLowerCase(),
      )
    ) {
      setCustomError(
        "That SKU already exists. Select it from the catalogue or use another SKU.",
      );
      return;
    }
    const product = {
      name: custom.name.trim(),
      sku,
      price: Number(custom.price),
    };
    if (editingSku) {
      setOrder((d: any) => ({
        ...d,
        products: d.products.map((p: any) =>
          p.sku === editingSku
            ? { ...p, ...product, qty: Number(custom.qty) }
            : p,
        ),
      }));
    } else {
      if (saveToCatalogue) saveCatalogueProduct(product);
      add(product, Number(custom.qty));
    }
    setCustomOpen(false);
    setCustom({ name: "", sku: "", price: "", qty: 1 });
    setCustomError("");
  }
  return (
    <>
      <Panel title="Products">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  aria-label="Select product"
                  className="min-w-0 flex-1 justify-between sm:max-w-sm"
                >
                  <span className="flex items-center gap-2">
                    <Search className="size-4 text-muted-foreground" />
                    Select a product
                  </span>
                  <ChevronsUpDown className="size-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0"
              >
                <Command>
                  <CommandInput
                    aria-label="Search catalogue"
                    placeholder="Search by name or SKU…"
                  />
                  <CommandList className="max-h-60">
                    <CommandEmpty>No matching products.</CommandEmpty>
                    <CommandGroup>
                      {getCatalogue().map((p) => (
                        <CommandItem
                          key={p.sku}
                          value={`${p.name} ${p.sku}`}
                          onSelect={() => add(p)}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {p.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {S.money(p.price)}
                          </span>
                          <Plus className="size-3.5" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              onClick={() => {
                setEditingSku(null);
                setCustom({ name: "", sku: "", price: "", qty: 1 });
                setCustomError("");
                setCustomOpen(true);
              }}
            >
              <Plus className="size-4" />
              Custom product
            </Button>
          </div>
          {order.products.length ? (
            <div className="max-h-[420px] overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted">
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Unit price</TableHead>
                    <TableHead className="w-24">Qty</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.products.map((p: any) => (
                    <TableRow key={p.sku}>
                      <TableCell className="min-w-36 font-medium">
                        <button
                          className="text-left hover:text-primary hover:underline"
                          aria-label={`Edit item ${p.sku}`}
                          onClick={() => {
                            setEditingSku(p.sku);
                            setCustom({
                              name: p.name,
                              sku: p.sku,
                              price: String(p.price),
                              qty: p.qty,
                            });
                            setCustomError("");
                            setCustomOpen(true);
                          }}
                        >
                          {p.name}
                        </button>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {S.money(p.price)}
                      </TableCell>
                      <TableCell>
                        <Input
                          aria-label={`Quantity for ${p.sku}`}
                          type="number"
                          min={1}
                          step={1}
                          className="w-20"
                          value={p.qty}
                          onChange={(e) =>
                            setOrder((d: any) => ({
                              ...d,
                              products: d.products.map((a: any) =>
                                a.sku === p.sku
                                  ? {
                                      ...a,
                                      qty:
                                        e.target.value === ""
                                          ? ""
                                          : Number(e.target.value),
                                    }
                                  : a,
                              ),
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {S.money(p.qty * p.price - Number(p.discount || 0))}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${p.sku}`}
                          onClick={() =>
                            setOrder((d: any) => ({
                              ...d,
                              products: d.products.filter(
                                (a: any) => a.sku !== p.sku,
                              ),
                            }))
                          }
                        >
                          <X className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              No products added
            </div>
          )}
          {order.products.length > 0 && (
            <details className="rounded-lg border px-4 py-3">
              <summary className="cursor-pointer text-sm">
                Item discounts
              </summary>
              <div className="mt-4 max-h-64 space-y-3 overflow-auto">
                {order.products.map((p: any) => (
                  <Field
                    key={p.sku}
                    label={`${p.name} · discount (₹)`}
                    type="number"
                    min={0}
                    max={p.price * p.qty}
                    step="0.01"
                    value={p.discount || 0}
                    onChange={(v: string) =>
                      setOrder((d: any) => ({
                        ...d,
                        products: d.products.map((item: any) =>
                          item.sku === p.sku
                            ? { ...item, discount: Number(v) }
                            : item,
                        ),
                      }))
                    }
                  />
                ))}
              </div>
            </details>
          )}
          {errors.products && (
            <p role="alert" className="text-xs text-destructive">
              {errors.products}
            </p>
          )}
          {order.products.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {order.products.length}{" "}
                {order.products.length === 1 ? "product" : "products"}
              </span>
              <span className="font-medium">
                Subtotal {S.money(S.productTotal(order))}
              </span>
            </div>
          )}
        </div>
      </Panel>
      <OrderMetadata order={order} setOrder={setOrder} />
      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSku ? "Edit order item" : "Custom product"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Enter product details to add an item to this order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field
              label="Product name"
              required
              value={custom.name}
              onChange={(v: string) => setCustom((c) => ({ ...c, name: v }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Unit price (₹)"
                type="number"
                required
                min={0}
                step="0.01"
                value={custom.price}
                onChange={(v: string) => setCustom((c) => ({ ...c, price: v }))}
              />
              <Field
                label="Quantity"
                type="number"
                required
                min={1}
                step={1}
                value={custom.qty}
                onChange={(v: string) =>
                  setCustom((c) => ({ ...c, qty: Number(v) }))
                }
              />
            </div>
            <Field
              label="SKU (optional)"
              value={custom.sku}
              onChange={(v: string) => setCustom((c) => ({ ...c, sku: v }))}
            />
            {!editingSku && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={saveToCatalogue}
                  onCheckedChange={(v) => setSaveToCatalogue(v === true)}
                />
                Save to catalogue
              </label>
            )}
            {customError && (
              <p role="alert" className="text-xs text-destructive">
                {customError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addCustom}>
              {editingSku ? "Save item" : "Add product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function PaymentSection({ order, setOrder, errors }: SectionProps) {
  const update = (key: string, value: any) =>
    setOrder((d: any) => ({ ...d, payment: { ...d.payment, [key]: value } }));
  return (
    <Panel title="Payment">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {[
            ["COD", "Cash on delivery"],
            ["Prepaid", "Prepaid"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-pressed={order.payment.mode === value}
              onClick={() => update("mode", value)}
              className={cn(
                "flex items-center justify-between rounded-lg border p-4 text-left text-sm font-medium",
                order.payment.mode === value
                  ? "border-primary bg-accent/40"
                  : "hover:bg-muted/50",
              )}
            >
              {label}
              {order.payment.mode === value && (
                <Check className="size-4 text-primary" />
              )}
            </button>
          ))}
        </div>
        <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
          {[
            ["shipping", "Shipping charge (₹)"],
            ["other", "Other charges (₹)"],
            ["discount", "Order discount (₹)"],
            ["giftCard", "Gift card (₹)"],
          ].map(([key, label]) => (
            <Field
              key={key}
              id={`payment-${key}`}
              label={label}
              type="number"
              min={0}
              step="0.01"
              value={order.payment[key] ?? 0}
              error={errors[key]}
              onChange={(v: string) => update(key, v === "" ? "" : Number(v))}
            />
          ))}
        </div>
        <details
          className="rounded-lg border px-4 py-3"
          open={!!errors.sellerNotes || undefined}
        >
          <summary className="cursor-pointer text-sm">
            Seller notes{" "}
            <span className="text-muted-foreground">(optional)</span>
          </summary>
          <div className="mt-3 space-y-2">
            <Label htmlFor="seller-notes">Note for the shipping label</Label>
            <Textarea
              id="seller-notes"
              maxLength={200}
              value={order.sellerNotes || ""}
              onChange={(e) =>
                setOrder((d: any) => ({ ...d, sellerNotes: e.target.value }))
              }
              placeholder="Visible to the buyer on the label"
            />
            <p className="text-right text-xs text-muted-foreground">
              {(order.sellerNotes || "").length}/200
            </p>
            {errors.sellerNotes && (
              <p role="alert" className="text-xs text-destructive">
                {errors.sellerNotes}
              </p>
            )}
          </div>
        </details>
        <div className="flex justify-between border-t pt-4 text-sm font-medium">
          <span>
            {order.payment.mode === "COD"
              ? "Collect from buyer"
              : "Order total"}
          </span>
          <span>{S.money(S.orderTotal(order))}</span>
        </div>
      </div>
    </Panel>
  );
}
function PickupSection({
  order,
  setOrder,
}: Pick<SectionProps, "order" | "setOrder">) {
  const [open, setOpen] = useState(false);
  const [pickup, setPickup] = useState({ label: "", line: "", phone: "" });
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  return (
    <>
      <Panel title="Pickup location">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <SelectField
              label="Saved address"
              value={order.pickup}
              onChange={(v: string) =>
                setOrder((d: any) => ({ ...d, pickup: v }))
              }
              items={getPickups().map((p) => ({ value: p.id, label: p.label }))}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setEditingId(null);
              setPickup({ label: "", line: "", phone: "" });
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add new
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const current = getPickups().find((p) => p.id === order.pickup);
              if (current) {
                setEditingId(current.id);
                setPickup({
                  label: current.label,
                  line: current.line,
                  phone: current.phone,
                });
                setOpen(true);
              }
            }}
          >
            Edit
          </Button>
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          {getPickups().find((p) => p.id === order.pickup)?.line}
        </p>
      </Panel>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit pickup location" : "Add pickup location"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Save a collection address for this and future orders.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {[
              ["label", "Location name"],
              ["line", "Full address"],
              ["phone", "Mobile number"],
            ].map(([key, label]) => (
              <Field
                key={key}
                label={label}
                required
                value={pickup[key as keyof typeof pickup]}
                onChange={(v: string) => setPickup((p) => ({ ...p, [key]: v }))}
              />
            ))}
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (
                  !pickup.label.trim() ||
                  !/[1-9]\d{5}/.test(pickup.line) ||
                  !/^[6-9]\d{9}$/.test(pickup.phone)
                ) {
                  setError(
                    "Enter a name, full address with pincode, and valid mobile number.",
                  );
                  return;
                }
                const saved = editingId
                  ? (updatePickup(editingId, pickup), { id: editingId })
                  : addPickup(pickup);
                setOrder((d: any) => ({ ...d, pickup: saved.id }));
                setOpen(false);
                setPickup({ label: "", line: "", phone: "" });
                setError("");
              }}
            >
              Save address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function PackageSection({ order, setOrder, errors }: SectionProps) {
  const weight = Math.max(
    Number(order.pack.w) || 0,
    (order.pack.l * order.pack.b * order.pack.h) / 5000 || 0,
  );
  return (
    <div className="space-y-5">
      <Panel title="Packaging">
        <div className="space-y-5">
          <SelectField
            label="Package template"
            value={order.pack.template}
            onChange={(v: string) => {
              const t = getPackageTemplates().find((t) => t.id === v);
              setOrder((d: any) => ({ ...d, pack: { ...t, template: v } }));
            }}
            items={getPackageTemplates().map((t) => ({
              value: t.id,
              label:
                t.id === "custom"
                  ? t.name
                  : `${t.name} · ${t.l} × ${t.b} × ${t.h} cm`,
            }))}
          />
          <SelectField
            label="Package type"
            value={order.pack.type || "Box"}
            onChange={(v: string) =>
              setOrder((d: any) => ({
                ...d,
                pack: { ...d.pack, type: v, template: "custom" },
              }))
            }
            items={["Box", "Flyer"]}
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ["l", "Length (cm)"],
              ["b", "Breadth (cm)"],
              ["h", "Height (cm)"],
              ["w", "Weight (kg)"],
            ].map(([key, label]) => (
              <Field
                key={key}
                id={`package-${key}`}
                label={label}
                type="number"
                required
                min={0.01}
                step="any"
                value={order.pack[key]}
                error={errors[key]}
                onChange={(v: string) =>
                  setOrder((d: any) => ({
                    ...d,
                    pack: { ...d.pack, [key]: v, template: "custom" },
                  }))
                }
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 px-4 py-3 text-sm">
            <span>Applicable weight</span>
            <span className="font-medium">{weight.toFixed(2)} kg</span>
          </div>
          <details>
            <summary className="cursor-pointer text-xs text-muted-foreground">
              How is weight calculated?
            </summary>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Actual: {Number(order.pack.w || 0).toFixed(2)} kg · Volumetric:{" "}
              {(
                (order.pack.l * order.pack.b * order.pack.h) / 5000 || 0
              ).toFixed(2)}{" "}
              kg (L × B × H ÷ 5,000). The higher value applies; courier divisors
              may vary.
            </p>
          </details>
        </div>
      </Panel>
      <PickupSection order={order} setOrder={setOrder} />
      <SavePackageTemplate order={order} setOrder={setOrder} />
      <PhotoAssistance order={order} setOrder={setOrder} />
      <PackagingGuidance />
      {errors.pickup && (
        <p role="alert" className="text-xs text-destructive">
          {errors.pickup}
        </p>
      )}
    </div>
  );
}
export function CourierSection({
  order,
  setOrder,
}: {
  order: any;
  setOrder: (v: any) => void;
}) {
  const [sort, setSort] = useState("price");
  const [mode, setMode] = useState("All");
  const couriers = filterCouriers(S.Store.couriers, mode, sort);
  return (
    <Panel title="Ship">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-lg bg-muted/40 px-4 py-3 text-xs">
          <span>
            Pickup{" "}
            <b>
              {getPickups()
                .find((p) => p.id === order.pickup)
                ?.line.match(/\b\d{6}\b/)?.[0] || "—"}
            </b>
          </span>
          <span>
            Delivery <b>{order.buyer.pincode}</b>
          </span>
          <span>
            Weight{" "}
            <b>
              {Math.max(
                Number(order.pack.w) || 0,
                (order.pack.l * order.pack.b * order.pack.h) / 5000 || 0,
              ).toFixed(2)}{" "}
              kg
            </b>
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {couriers.length} couriers · Sample rates
          </span>
          <div className="w-44">
            <SelectField
              label="Sort couriers"
              value={sort}
              onChange={setSort}
              items={[
                { value: "price", label: "Cheapest" },
                { value: "fastest", label: "Fastest" },
                { value: "rating", label: "Highest rating" },
              ]}
            />
          </div>
        </div>
        <div
          role="group"
          aria-label="Courier service"
          className="flex flex-wrap gap-2"
        >
          {["All", "Air", "Surface", "Express"].map((value) => (
            <Button
              key={value}
              variant={mode === value ? "secondary" : "outline"}
              size="sm"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              {value}
            </Button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {couriers.map((c) => (
            <button
              type="button"
              key={c.id}
              aria-pressed={order.courier === c.id}
              onClick={() => setOrder((d: any) => ({ ...d, courier: c.id }))}
              className={cn(
                "flex min-h-40 flex-col rounded-lg border p-4 text-left",
                order.courier === c.id
                  ? "border-primary bg-accent/30"
                  : "hover:bg-muted/30",
              )}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className="text-sm font-semibold">{c.name}</span>
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full border",
                    order.courier === c.id &&
                      "border-primary bg-primary text-white",
                  )}
                >
                  {order.courier === c.id && <Check className="size-3" />}
                </span>
              </div>
              <div className="mt-3 text-xl font-semibold tabular-nums">
                {S.money(c.price)}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Pickup {c.pickup.toLowerCase()} · Delivery {c.eta}
              </p>
              <div className="mt-3 flex w-full items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {c.mode} · {c.rating}/5
                </span>
                {c.id === "xb-e" && (
                  <Badge variant="secondary">Lowest price</Badge>
                )}
              </div>
            </button>
          ))}
        </div>
        <details className="rounded-lg border px-4 py-3">
          <summary className="cursor-pointer text-xs">
            Service benefits & rate details
          </summary>
          <div className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
            <p>
              Rates, delivery dates, ratings and benefits are sample data. Live
              availability, taxes, surcharges and benefit eligibility require a
              courier integration.
            </p>
            <p>
              Shipway Prime’s reference advertises a 50% refund on delays and
              RTO (return to origin). Eligibility is not validated in this
              prototype.
            </p>
            <p>
              Courier charges are separate from the shipping amount charged to
              your buyer.
            </p>
          </div>
        </details>
      </div>
    </Panel>
  );
}
