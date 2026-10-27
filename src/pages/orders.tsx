import { BulkOrders } from "@/components/bulk-orders";
import { useState } from "react";

import {
  ArrowRight,
  CheckCheck,
  Download,
  LoaderCircle,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Progress } from "@/components/ui/progress";

import { Checkbox } from "@/components/ui/checkbox";

import { cn } from "@/lib/utils";
import { Shipway as S, getOrders } from "@/lib/store";

const money = S.money;
export function Orders() {
  const [filter, setFilter] = useState(
    new URLSearchParams(location.search).get("status") || "All orders",
  );
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [data] = useState(S.load);
  const rows = getOrders().map((order) => {
    const completeness = S.completeness(order);
    return {
      id: order.id,
      date:
        order.status === "Draft"
          ? "Saved draft"
          : new Intl.DateTimeFormat("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "Asia/Kolkata",
            }).format(new Date(order.createdAt || "2026-10-26")),
      name: order.buyer.name
        ? data.profile.showCustomer
          ? order.buyer.name
          : "Customer hidden"
        : "Customer not added",
      product: order.products[0]?.name || "No products yet",
      value: S.orderTotal(order),
      status: order.status,
      complete: completeness.pct,
      missing: completeness.missing,
    };
  });
  const visible = rows.filter(
    (r) =>
      (filter === "All orders" ||
        (filter === "Drafts" && r.status === "Draft") ||
        r.status === filter) &&
      `${r.id} ${r.name}`.toLowerCase().includes(search.toLowerCase()),
  );
  const exportRows = () => {
    const csv = [
      "Order,Customer,Value,Status",
      ...(selected.length
        ? rows.filter((r) => selected.includes(r.id))
        : visible
      ).map((r) =>
        [r.id, r.name, r.value, r.status]
          .map((v) => '"' + String(v).replaceAll('"', '""') + '"')
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage your orders and keep every shipment moving.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BulkOrders />
          <Button variant="outline" onClick={exportRows}>
            <Download />
            {selected.length
              ? `Export ${selected.length} selected`
              : "Export view"}
          </Button>
          <Button asChild>
            <a href="order-new.html?new=1">
              <Plus />
              Create order
            </a>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total orders",
            value: rows.length,
            sub: "Across your workspace",
            icon: Package,
          },
          {
            label: "Ready to ship",
            value: rows.filter((r) => r.status === "New" && r.complete === 100)
              .length,
            sub: "Complete and ready to go",
            icon: CheckCheck,
          },
          {
            label: "Draft orders",
            value: rows.filter((r) => r.status === "Draft").length,
            sub: "Pick up where you left off",
            icon: LoaderCircle,
          },
          {
            label: "Order value",
            value: money(rows.reduce((n, r) => n + r.value, 0)),
            sub: "Total value of your orders",
            icon: Wallet,
          },
        ].map((s) => (
          <Card key={s.label} className="gap-0 py-5 shadow-none">
            <CardContent className="px-5">
              <div className="flex items-center justify-between text-sm font-medium">
                {s.label}
                <s.icon className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">
                {s.value}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              {[
                "New",
                "Ready for Pickup",
                "Drafts",
                "In Transit",
                "All orders",
              ].map((f) => (
                <TabsTrigger key={f} value={f}>
                  {f}
                  <span className="ml-1 text-xs text-muted-foreground">
                    {
                      rows.filter(
                        (r) =>
                          f === "All orders" ||
                          r.status === (f === "Drafts" ? "Draft" : f),
                      ).length
                    }
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {selected.length
              ? `${selected.length} selected`
              : `${visible.length} order${visible.length === 1 ? "" : "s"}`}
          </span>
          <div className="relative w-full sm:ml-auto sm:max-w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              aria-label="Search orders"
              placeholder="Search orders or customers..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    aria-label="Select all visible orders"
                    checked={
                      visible.length > 0 &&
                      visible.every((r) => selected.includes(r.id))
                    }
                    onCheckedChange={(v) =>
                      setSelected(v ? visible.map((r) => r.id) : [])
                    }
                  />
                </TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completeness</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r) => (
                <TableRow
                  key={r.id}
                  data-state={selected.includes(r.id) ? "selected" : undefined}
                >
                  <TableCell className="pl-4">
                    <Checkbox
                      aria-label={`Select ${r.id}`}
                      checked={selected.includes(r.id)}
                      onCheckedChange={(v) =>
                        setSelected(
                          v
                            ? [...selected, r.id]
                            : selected.filter((id) => id !== r.id),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="py-5">
                    <a
                      className="font-medium hover:underline"
                      href={
                        r.status === "Draft"
                          ? `order-new.html?id=${encodeURIComponent(r.id)}`
                          : `order-edit.html?id=${r.id}`
                      }
                    >
                      {r.id}
                    </a>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {r.date}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{r.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {r.product}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={r.status === "Draft" ? "outline" : "secondary"}
                    >
                      <span
                        className={cn(
                          "mr-1 size-1.5 rounded-full",
                          r.status === "Draft"
                            ? "bg-muted-foreground"
                            : "bg-primary",
                        )}
                      />
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={r.complete} className="h-1.5 w-16" />
                      <span className="text-xs text-muted-foreground">
                        {r.complete}%
                      </span>
                    </div>
                    {r.missing.length > 0 && (
                      <p className="mt-1.5 max-w-44 text-[11px] leading-4 text-muted-foreground">
                        Missing: {r.missing.join(", ")}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {money(r.value)}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={
                          r.status === "Draft"
                            ? `order-new.html?id=${encodeURIComponent(r.id)}`
                            : `order-edit.html?id=${r.id}`
                        }
                      >
                        {r.status === "Draft" ? "Continue" : "View"}
                        <ArrowRight className="size-3.5" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!visible.length && (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <Package className="mx-auto mb-3 size-6 text-muted-foreground" />
                    <p className="font-medium">No orders found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try a different search or order status.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {visible.length
              ? `Showing ${visible.length} of ${rows.length} orders`
              : "No matching orders"}
          </span>
          <span>All times in IST</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 pt-6 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" />
        Your drafts are saved in this browser.
      </div>
    </div>
  );
}
