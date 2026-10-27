import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { OrderBarcode } from "@/components/order-barcode";
import {
  Shipway as S,
  getPickups,
  grossProductTotal,
  itemDiscountTotal,
} from "@/lib/store";

type Order = ReturnType<typeof S.defaultDraft>;
export function OrderSummary({ order }: { order: Order }) {
  const pickup = getPickups().find((p) => p.id === order.pickup);
  const address = [
    order.buyer.line,
    order.buyer.line2,
    order.buyer.landmark,
    order.buyer.city,
    order.buyer.state,
    order.buyer.pincode,
  ]
    .filter(Boolean)
    .join(", ");
  const completeness = S.completeness(order).pct;
  const date = order.createdAt
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(new Date(order.createdAt))
    : null;
  return (
    <Card className="gap-4 shadow-none xl:sticky xl:top-5">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Order summary</CardTitle>
          <Badge variant="secondary">{order.payment.mode}</Badge>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardDescription className="break-all font-mono text-xs">
            {order.id}
          </CardDescription>
          {date && (
            <span className="text-xs text-muted-foreground">{date}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {completeness < 100 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Order completeness</span>
              <span>{completeness}%</span>
            </div>
            <Progress value={completeness} className="h-1.5" />
          </div>
        )}
        <section className="space-y-2 rounded-lg border bg-muted/40 p-3">
          <h3 className="text-xs font-semibold text-muted-foreground">
            Ship from
          </h3>
          <div className="space-y-1 text-xs leading-5">
            <p className="font-medium">
              {pickup?.label || "Pickup address not selected"}
            </p>
            {pickup && (
              <>
                <p className="text-muted-foreground">{pickup.line}</p>
                <p className="text-muted-foreground">{pickup.phone}</p>
              </>
            )}
          </div>
        </section>
        <section className="space-y-2 rounded-lg border border-primary/20 bg-accent/50 p-3">
          <h3 className="text-xs font-semibold text-accent-foreground">
            Ship to
          </h3>
          {order.buyer.name ||
          address ||
          order.buyer.phone ||
          order.buyer.email ? (
            <div className="space-y-1 break-words text-xs leading-5">
              {order.buyer.name && (
                <p className="font-medium">{order.buyer.name}</p>
              )}
              {address && <p className="text-muted-foreground">{address}</p>}
              {order.buyer.phone && (
                <p className="text-muted-foreground">{order.buyer.phone}</p>
              )}
              {order.buyer.email && (
                <p className="break-all text-muted-foreground">
                  {order.buyer.email}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">
              Buyer and delivery details will appear here.
            </p>
          )}
        </section>
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground">
            Products
          </h3>
          {order.products.length ? (
            <ul className="space-y-2">
              {order.products.slice(0, 3).map((p) => (
                <li
                  key={p.sku}
                  className="flex items-start justify-between gap-3 text-xs leading-5"
                >
                  <span className="min-w-0 break-words">
                    {p.name}{" "}
                    <span className="text-muted-foreground">× {p.qty}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {S.money(p.price * p.qty - Number(p.discount || 0))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              No products added yet.
            </p>
          )}
          {order.products.length > 3 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">
                {order.products.length - 3} more products
              </summary>
              <ul className="mt-3 max-h-48 space-y-2 overflow-auto">
                {order.products.slice(3).map((p) => (
                  <li key={p.sku} className="flex justify-between gap-3">
                    <span>
                      {p.name} × {p.qty}
                    </span>
                    <span className="shrink-0">
                      {S.money(p.price * p.qty - Number(p.discount || 0))}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
        <Separator />
        <dl className="space-y-2 text-xs">
          {[
            ["Subtotal", grossProductTotal(order)],
            ["Item discounts", -itemDiscountTotal(order)],
            ["Shipping", Number(order.payment.shipping)],
            ["Other charges", Number(order.payment.other)],
            ["Order discount", -Number(order.payment.discount) || 0],
            ["Gift card", -Number(order.payment.giftCard || 0)],
          ]
            .filter(
              ([label, value]) => label === "Subtotal" || Number(value) !== 0,
            )
            .map(([label, value]) => (
              <div key={String(label)} className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="tabular-nums">{S.money(value)}</dd>
              </div>
            ))}
        </dl>
        <div className="flex justify-between border-t pt-3 text-sm font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{S.money(S.orderTotal(order))}</span>
        </div>
        {(order.sellerNotes ||
          order.tags?.length > 0 ||
          order.channel !== "Manual" ||
          order.billingSameAsShipping === false) && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">
              Additional order details
            </summary>
            <div className="mt-3 space-y-2">
              {order.channel && (
                <p>
                  Channel:{" "}
                  {order.channel === "Manual" ? "Custom" : order.channel}
                </p>
              )}
              {order.tags?.length > 0 && <p>Tags: {order.tags.join(", ")}</p>}
              {order.sellerNotes && (
                <p className="break-words">Label note: {order.sellerNotes}</p>
              )}
              {order.billingSameAsShipping === false && (
                <p>
                  Separate billing: {order.billing.name},{" "}
                  {[order.billing.line, order.billing.line2]
                    .filter(Boolean)
                    .join(", ")}
                  , {order.billing.city} {order.billing.pincode}
                </p>
              )}
            </div>
          </details>
        )}
        <Separator />
        <details className="group">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
            Order barcode & download
          </summary>
          <div className="mt-3">
            <OrderBarcode orderId={order.id} />
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
