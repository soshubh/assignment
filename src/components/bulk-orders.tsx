import { useState } from "react";
import { Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { bulkColumns, previewBulkOrders } from "@/lib/bulk-orders";
import { saveOrder } from "@/lib/store";
import { toast } from "sonner";
export function BulkOrders() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = preview.filter((row) => !row.errors.length);
  function template() {
    const text =
      bulkColumns.join(",") +
      '\nSample Buyer,9876543210,buyer@example.com,"12 Market Road, Sector 14",122001,Gurugram,Haryana,SKU-001,Cotton T-shirt,200,1,COD\n';
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
    link.download = "shipway-orders-template.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="size-4" />
        Bulk upload
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk upload orders</DialogTitle>
            <DialogDescription>
              One order and one product per CSV row. Imports are saved as
              drafts; review pickup and packaging before shipping.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={template}>
              <Download className="size-3.5" />
              Download template
            </Button>
            <div className="space-y-2">
              <Label htmlFor="bulk-csv">CSV file · up to 100 orders</Label>
              <Input
                id="bulk-csv"
                type="file"
                accept=".csv,text/csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPreview([]);
                  setError("");
                  if (file.size > 1024 * 1024) {
                    setError("Use a CSV under 1 MB.");
                    return;
                  }
                  try {
                    setPreview(previewBulkOrders(await file.text()));
                  } catch (error) {
                    setError(
                      error instanceof Error
                        ? error.message
                        : "Could not read this file.",
                    );
                  }
                }}
              />
            </div>
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
            {preview.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  {valid.length} ready · {preview.length - valid.length} need
                  correction
                </p>
                <div className="max-h-64 divide-y overflow-auto rounded-lg border">
                  {preview.map((row) => (
                    <div key={row.row} className="p-3 text-xs">
                      <p className="font-medium">
                        Row {row.row} ·{" "}
                        {row.order.buyer.name || "Unnamed buyer"}
                      </p>
                      <p
                        className={
                          row.errors.length
                            ? "mt-1 text-destructive"
                            : "mt-1 text-muted-foreground"
                        }
                      >
                        {row.errors.length
                          ? row.errors.join(" ")
                          : "Ready to import as a draft"}
                      </p>
                    </div>
                  ))}
                </div>
                {preview.length !== valid.length && (
                  <p className="text-xs text-muted-foreground">
                    Invalid rows will not be imported. Correct them in your file
                    and upload again.
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!valid.length || busy}
              onClick={() => {
                setBusy(true);
                try {
                  valid.forEach((row) => saveOrder(row.order));
                  setOpen(false);
                  setPreview([]);
                  toast.success(`${valid.length} drafts imported`);
                  location.href = "index.html?status=Drafts";
                } catch {
                  setError(
                    "Import stopped because browser storage is full. Check saved drafts before retrying.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Import {valid.length || ""} drafts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
