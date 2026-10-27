import { AddressEntry } from "@/components/address-entry";
import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Field, SelectField, Panel } from "@/components/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getBuyers, savePackageTemplate } from "@/lib/store";

type Props = {
  order: any;
  setOrder: (value: any) => void;
  errors?: Record<string, string>;
};
export function BuyerOptions({ order, setOrder, errors = {} }: Props) {
  const buyers = getBuyers();
  return (
    <div className="space-y-4 border-t pt-5">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={order.billingSameAsShipping !== false}
          onCheckedChange={(v) =>
            setOrder((d: any) => ({ ...d, billingSameAsShipping: v === true }))
          }
        />
        Billing address is the same as delivery
      </label>
      {order.billingSameAsShipping === false && (
        <div className="space-y-4 rounded-lg border p-4">
          <Field
            id="billing-name"
            label="Billing name"
            required
            value={order.billing?.name || ""}
            error={errors.billing_name}
            onChange={(name: string) =>
              setOrder((d: any) => ({ ...d, billing: { ...d.billing, name } }))
            }
          />
          <AddressEntry
            prefix="billing"
            value={order.billing || {}}
            errors={Object.fromEntries(
              Object.entries(errors)
                .filter(([key]) => key.startsWith("billing_"))
                .map(([key, value]) => [key.replace("billing_", ""), value]),
            )}
            onChange={(address) =>
              setOrder((d: any) => ({
                ...d,
                billing: { ...d.billing, ...address },
              }))
            }
          />
        </div>
      )}
      <details>
        <summary className="cursor-pointer text-xs text-muted-foreground">
          Saved buyer details
        </summary>
        <div className="mt-3 space-y-4">
          {buyers.length > 0 && (
            <SelectField
              label="Use a saved buyer"
              value=""
              onChange={(phone: string) => {
                const buyer = buyers.find((b: any) => b.phone === phone);
                if (buyer)
                  setOrder((d: any) => ({ ...d, buyer: { ...buyer } }));
              }}
              items={buyers.map((b: any) => ({
                value: b.phone,
                label: `${b.name} · ${b.phone}`,
              }))}
            />
          )}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={order.rememberBuyer !== false}
              onCheckedChange={(v) =>
                setOrder((d: any) => ({ ...d, rememberBuyer: v === true }))
              }
            />
            Save buyer details for future orders
          </label>
        </div>
      </details>
    </div>
  );
}
export function OrderMetadata({ order, setOrder }: Props) {
  const [tag, setTag] = useState("");
  const [error, setError] = useState("");
  const tags: string[] = order.tags || [];
  function add() {
    const value = tag.trim();
    if (!value) return;
    if (value.length > 30 || tags.length >= 20) {
      setError("Use up to 20 tags, each 30 characters or fewer.");
      return;
    }
    if (!tags.some((t) => t.toLowerCase() === value.toLowerCase()))
      setOrder((d: any) => ({ ...d, tags: [...(d.tags || []), value] }));
    setTag("");
    setError("");
  }
  return (
    <details className="rounded-lg border px-4 py-3">
      <summary className="cursor-pointer text-sm font-medium">
        Order details{" "}
        <span className="font-normal text-muted-foreground">
          · Channel & tags
        </span>
      </summary>
      <div className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Order ID" readOnly value={order.id} />
          <SelectField
            label="Sales channel"
            value={order.channel || "Manual"}
            onChange={(v: string) =>
              setOrder((d: any) => ({ ...d, channel: v }))
            }
            items={[
              { value: "Manual", label: "Custom" },
              "Facebook",
              "WhatsApp",
              "Instagram",
              "Website",
            ]}
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label
              htmlFor="order-tag"
              className="mb-2 block text-sm font-medium"
            >
              Tags
            </label>
            <Input
              id="order-tag"
              value={tag}
              maxLength={30}
              onChange={(e) => setTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
              placeholder="Add a tag"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Add tag"
            onClick={add}
          >
            <Plus className="size-4" />
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
                <button
                  aria-label={`Remove tag ${t}`}
                  onClick={() =>
                    setOrder((d: any) => ({
                      ...d,
                      tags: d.tags.filter((v: string) => v !== t),
                    }))
                  }
                >
                  <X className="ml-1 size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
export function PhotoAssistance({ order, setOrder }: Props) {
  const [error, setError] = useState("");
  return (
    <details className="rounded-lg border px-4 py-3">
      <summary className="cursor-pointer text-sm font-medium">
        Package photo & assistance
      </summary>
      <div className="mt-4 space-y-4">
        <label className="block space-y-2 text-sm font-medium">
          <span>Attach a package photo</span>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (
                !["image/png", "image/jpeg", "image/webp"].includes(
                  file.type,
                ) ||
                file.size > 500 * 1024
              ) {
                setError("Use a JPG, PNG or WebP image under 500 KB.");
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                setOrder((d: any) => ({
                  ...d,
                  packagePhoto: {
                    name: file.name,
                    data: String(reader.result),
                  },
                }));
                setError("");
              };
              reader.onerror = () =>
                setError("Could not read this image. Try another file.");
              reader.readAsDataURL(file);
            }}
          />
        </label>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        {order.packagePhoto && (
          <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
            <img
              src={order.packagePhoto.data}
              alt="Attached package"
              className="size-16 rounded-md object-cover"
            />
            <span className="min-w-0 flex-1 truncate text-xs">
              {order.packagePhoto.name}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Remove package photo"
              onClick={() =>
                setOrder((d: any) => ({ ...d, packagePhoto: null }))
              }
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button disabled variant="outline" size="sm">
            Estimate weight from photo
          </Button>
          <Button disabled variant="outline" size="sm">
            Mobile / WhatsApp upload
          </Button>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Photos are stored in this browser. AI measurements and phone/WhatsApp
          QR upload need a connected measurement and upload service. Enter
          measured dimensions above.
        </p>
      </div>
    </details>
  );
}
export function PackagingGuidance() {
  return (
    <Panel title="Packaging guidance">
      <details>
        <summary className="cursor-pointer text-sm">
          How to measure and pack
        </summary>
        <ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-5 text-muted-foreground">
          <li>
            Measure the sealed outer package at its longest, widest and highest
            points in centimetres.
          </li>
          <li>Weigh the complete parcel, including packaging, in kilograms.</li>
          <li>
            Use a suitable box or flyer, cushion the contents and seal all
            openings.
          </li>
          <li>
            Actual and volumetric weight are compared; the higher value is used.
            Live courier rules may differ.
          </li>
        </ul>
      </details>
    </Panel>
  );
}

export function SavePackageTemplate({ order, setOrder }: Props) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  return (
    <details className="rounded-lg border px-4 py-3">
      <summary className="cursor-pointer text-sm">
        Save this packaging as a template
      </summary>
      <div className="mt-4 flex items-end gap-3">
        <div className="flex-1">
          <Field
            label="Template name"
            maxLength={40}
            value={name}
            onChange={(v: string) => setName(v)}
            placeholder="e.g. Large apparel box"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => {
            if (
              !name.trim() ||
              ["l", "b", "h", "w"].some(
                (key) =>
                  !Number.isFinite(Number(order.pack[key])) ||
                  Number(order.pack[key]) <= 0,
              )
            ) {
              setMessage("Add a name and valid measurements first.");
              return;
            }
            const saved = savePackageTemplate(name, order.pack);
            setOrder((d: any) => ({
              ...d,
              pack: { ...d.pack, template: saved.id },
            }));
            setName("");
            setMessage("Template saved.");
          }}
        >
          Save template
        </Button>
      </div>
      {message && (
        <p role="status" className="mt-3 text-xs text-muted-foreground">
          {message}
        </p>
      )}
    </details>
  );
}
