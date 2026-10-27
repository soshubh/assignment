import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Save,
  Truck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderSummary } from "@/components/order-summary";
import {
  BuyerSection,
  ProductsSection,
  PackageSection,
  PaymentSection,
  CourierSection,
} from "@/components/order-sections";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Shipway as S,
  existingOrder,
  getOrders,
  saveOrder,
  startDraft,
  stepErrors,
  validateOrder,
} from "@/lib/store";
const steps = ["Buyer", "Products", "Payment", "Packaging", "Ship"];
function migrateWorkflow(order: any) {
  if (order.flowVersion === 2) return order;
  return {
    ...order,
    flowVersion: 2,
    step: order.step === 4 ? 5 : order.step,
    furthest: order.furthest === 4 ? 5 : order.furthest,
  };
}
function initialOrder(editing: boolean) {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (editing)
    return migrateWorkflow(
      getOrders().find((o) => o.id === id) ||
        existingOrder(id || "ORD10000748"),
    );
  if (params.has("new")) {
    const draft = startDraft();
    history.replaceState(null, "", "order-new.html");
    return migrateWorkflow(draft);
  }
  return id
    ? migrateWorkflow(getOrders().find((o) => o.id === id) || S.load().draft)
    : migrateWorkflow(S.load().draft);
}
export function OrderEditor({ editing }: { editing: boolean }) {
  const [order, setOrder] = useState(() => initialOrder(editing));
  const [step, setStep] = useState(editing ? 1 : Math.min(order.step || 1, 5));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [furthest, setFurthest] = useState(order.furthest || step);
  const [confirm, setConfirm] = useState(false);
  const [leave, setLeave] = useState(false);
  const [savedAt, setSavedAt] = useState(order.updatedAt || "");
  const [saving, setSaving] = useState(false);
  const baseline = useRef(JSON.stringify(order));
  const allowLeave = useRef(false);
  const [completed, setCompleted] = useState(false);
  const dirty = JSON.stringify(order) !== baseline.current;
  const locked = ["Ready for Pickup", "In Transit"].includes(order.status);
  const updateOrder = (value: any) => {
    setOrder(value);
  };
  useEffect(() => {
    if (Object.keys(errors).length) setErrors(stepErrors(order, step));
  }, [order]);
  useEffect(() => {
    if (editing || locked || completed) return;
    setSaving(true);
    const timer = setTimeout(() => {
      try {
        const saved = saveOrder({ ...order, step, furthest, status: "Draft" });
        baseline.current = JSON.stringify(order);
        setSavedAt(saved.updatedAt);
      } catch {
        toast.error(
          "Could not autosave. Keep this page open and try Save draft.",
        );
      }
      setSaving(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [order, step, furthest, editing, locked, completed]);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!editing && dirty && !locked && !completed) {
        saveOrder({ ...order, step, furthest, status: "Draft" });
      }
      if (editing && dirty && !completed && !allowLeave.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [editing, dirty, completed, order, step, locked]);
  function persist(exit = false) {
    if (editing && Object.keys(validateOrder(order)).length) {
      review();
      return false;
    }
    try {
      const saved = saveOrder({
        ...order,
        step,
        status: editing ? order.status : "Draft",
      });
      baseline.current = JSON.stringify(order);
      setSavedAt(saved.updatedAt);

      toast.success(
        editing
          ? "Changes saved. This order was not shipped."
          : "Draft saved. Continue whenever you’re ready.",
      );
      if (exit) {
        allowLeave.current = true;
        setCompleted(true);
        location.href = "index.html?status=Drafts";
      }
      return true;
    } catch {
      toast.error(
        "Could not save in this browser. Keep this page open and try again.",
      );
      return false;
    }
  }
  function move(next: number) {
    setStep(next);
    setFurthest((value) => Math.max(value, next));
    setErrors({});
    document
      .getElementById("order-workspace")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function validate(stepNumber = step) {
    const found = stepErrors(order, stepNumber) as Record<string, string>;
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return false;
    }
    return true;
  }
  function review() {
    const found = validateOrder(order) as Record<string, string>;
    if (Object.keys(found).length) {
      const target =
        [1, 2, 3, 4].find((n) => Object.keys(stepErrors(order, n)).length) || 1;
      setStep(target);
      setErrors(stepErrors(order, target));
      toast.error("Complete the highlighted details before shipping.");
      return;
    }
    move(5);
  }
  function ship() {
    if (Object.keys(validateOrder(order)).length || !order.courier) {
      setConfirm(false);
      review();
      return;
    }
    try {
      saveOrder({ ...order, status: "Ready for Pickup", step: 5 });
      baseline.current = JSON.stringify(order);
      setCompleted(true);
      setConfirm(false);
      toast.success("Order marked ready for pickup. No live booking was made.");
      setTimeout(
        () => (location.href = "index.html?status=Ready%20for%20Pickup"),
        500,
      );
    } catch {
      toast.error("Could not save this order. Please try again.");
    }
  }
  const courier = S.Store.couriers.find((c) => c.id === order.courier);
  const props = { order, setOrder: updateOrder, errors };
  return (
    <div className="space-y-6">
      <button
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        onClick={() => {
          if (editing && dirty) setLeave(true);
          else location.href = "index.html";
        }}
      >
        <ArrowLeft className="size-3.5" />
        Back to orders
      </button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{order.id}</span>
            <Badge variant="outline">{order.status || "Draft"}</Badge>
          </div>
          <h1 className="page-title">
            {locked
              ? "Order details"
              : editing
                ? "Edit order"
                : "Create an order"}
          </h1>
          {locked && (
            <p className="mt-2 text-sm text-muted-foreground">
              {order.status} · Read only
            </p>
          )}
        </div>
        <div
          aria-live="polite"
          className="flex items-center gap-1.5 pt-2 text-xs text-muted-foreground"
        >
          {saving ? (
            <>
              <Save className="size-3.5" />
              Saving…
            </>
          ) : editing && dirty ? (
            <>
              <span className="size-1.5 rounded-full bg-primary" />
              Unsaved changes
            </>
          ) : savedAt ? (
            <>
              <CheckCircle2 className="size-3.5" />
              {editing ? "Saved" : "Saved"}
            </>
          ) : (
            <>
              <Save className="size-3.5" />
              {editing ? "Saved" : "Autosave on"}
            </>
          )}
        </div>
      </div>
      <div
        id="order-workspace"
        className="grid scroll-mt-5 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="min-w-0 space-y-5">
          <nav
            aria-label={editing ? "Order sections" : "Order creation progress"}
            className="flex gap-1 overflow-x-auto border-b pb-2"
          >
            {steps.map((label, i) => (
              <button
                key={label}
                type="button"
                aria-current={step === i + 1 ? "step" : undefined}
                disabled={!editing && i + 1 > furthest}
                onClick={() => {
                  if (!editing && i + 1 > step && !validate()) return;
                  if (i === 4) review();
                  else move(i + 1);
                }}
                className={cn(
                  "shrink-0 rounded-md px-4 py-2.5 text-sm transition-colors disabled:opacity-40",
                  step === i + 1
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted/60",
                )}
              >
                {label}
              </button>
            ))}
          </nav>
          {Object.keys(errors).length > 0 && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>Check the highlighted fields.</p>
            </div>
          )}
          <fieldset
            disabled={locked}
            className="min-w-0 space-y-5 disabled:opacity-80"
          >
            {step === 1 && <BuyerSection {...props} />}
            {step === 2 && <ProductsSection {...props} />}
            {step === 3 && <PaymentSection {...props} />}
            {step === 4 && <PackageSection {...props} />}
            {step === 5 && (
              <CourierSection order={order} setOrder={updateOrder} />
            )}
          </fieldset>
          {!locked && (
            <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 p-4 shadow-none backdrop-blur-sm">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => persist()}
                  disabled={editing && !dirty}
                >
                  <Save className="size-3.5" />
                  {editing ? "Save changes" : "Save draft"}
                </Button>
                {!editing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => persist(true)}
                  >
                    Save & exit
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {step > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => move(step - 1)}
                  >
                    Back
                  </Button>
                )}
                {step === 5 ? (
                  <Button
                    size="sm"
                    disabled={!order.courier}
                    onClick={() => setConfirm(true)}
                  >
                    <Truck className="size-3.5" />
                    Ship order
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (validate()) move(step + 1);
                    }}
                  >
                    Continue
                    <ArrowRight className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
        <aside>
          <OrderSummary order={order} />
        </aside>
      </div>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ship this order?</DialogTitle>
            <DialogDescription>
              {order.id} · Demo only. No live booking or payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
            <p className="font-medium">
              {order.buyer.name} · {order.buyer.city} {order.buyer.pincode}
            </p>
            <div className="flex justify-between text-muted-foreground">
              <span>Courier</span>
              <span className="text-foreground">{courier?.name}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Sample courier charge</span>
              <span className="text-foreground">
                {S.money(courier?.price || 0)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-3 font-medium">
              <span>
                {order.payment.mode === "COD"
                  ? "Collect from buyer"
                  : "Prepaid order value"}
              </span>
              <span>{S.money(S.orderTotal(order))}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Keep editing
            </Button>
            <Button onClick={ship}>
              <Truck className="size-4" />
              Confirm shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={leave} onOpenChange={setLeave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keep your changes?</DialogTitle>
            <DialogDescription>
              You have unsaved changes to this order. Save them before returning
              to your orders.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLeave(false)}>
              Keep editing
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                allowLeave.current = true;
                setCompleted(true);
                location.href = "index.html";
              }}
            >
              Discard changes
            </Button>
            <Button
              onClick={() => {
                if (!persist()) {
                  setLeave(false);
                  return;
                }
                allowLeave.current = true;
                setCompleted(true);
                location.href = "index.html";
              }}
            >
              Save & leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
