import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Encode the order ID locally. Never put customer details into the barcode. */
export function OrderBarcode({ orderId }: { orderId: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    // Load the encoder only on order pages, keeping the orders list lightweight.
    import("jsbarcode").then(({ default: JsBarcode }) => {
      if (cancelled || !svgRef.current) return;
      JsBarcode(svgRef.current, orderId, {
        format: "CODE128",
        width: 2,
        height: 56,
        displayValue: true,
        font: "monospace",
        fontSize: 14,
        textMargin: 8,
        margin: 20,
        background: "#ffffff",
        lineColor: "#000000",
      });
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  function download() {
    if (!svgRef.current) return;
    const svg = svgRef.current.cloneNode(true) as SVGSVGElement;
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(svg)], {
        type: "image/svg+xml",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${orderId}-barcode.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="space-y-3">
      <figure className="rounded-md border bg-white px-2 pb-3 text-center">
        <svg
          ref={svgRef}
          role="img"
          aria-label={`Barcode for order ${orderId}`}
          className="mx-auto h-auto w-full max-w-80"
        />
        <figcaption className="sr-only">{orderId}</figcaption>
      </figure>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs leading-5 text-muted-foreground">
          Scan to read this order ID.
        </p>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7 shrink-0"
          disabled={!ready}
          aria-label="Download order barcode"
          onClick={download}
        >
          <Download className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
