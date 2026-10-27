import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Pencil } from "lucide-react";
import { Field, SelectField } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBuyers, getPickups, Shipway as S } from "@/lib/store";

type Props = {
  value: any;
  onChange: (address: any) => void;
  errors?: Record<string, string>;
  prefix: string;
  landmark?: boolean;
};

/** Search is limited to locally saved addresses until a place provider is connected. */
export function AddressEntry({
  value,
  onChange,
  errors = {},
  prefix,
  landmark = false,
}: Props) {
  const [expanded, setExpanded] = useState(!!value.line);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const listId = useId();
  useEffect(() => {
    if (value.line) setExpanded(true);
  }, [value.line]);
  const update = (key: string, next: string) =>
    onChange({ ...value, [key]: next });
  const saved = (
    prefix === "pickup"
      ? getPickups().map((address: any) => {
          const parsed = S.parseAddress(address.line);
          return {
            ...(parsed.ok ? parsed : {}),
            ...address,
            line: address.addressLine1 || address.line,
          };
        })
      : getBuyers()
  ).filter(
    (address: any, index: number, all: any[]) =>
      address.line &&
      all.findIndex(
        (a: any) =>
          [a.line, a.pincode].join() === [address.line, address.pincode].join(),
      ) === index,
  );
  const matches = query.trim()
    ? saved
        .filter((a: any) =>
          [a.line, a.city, a.state, a.pincode]
            .join(" ")
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
        )
        .slice(0, 4)
    : [];
  const showDetails = expanded;
  function reveal(address?: any) {
    if (address) {
      // Address suggestions never overwrite the buyer's contact information.
      onChange({
        ...value,
        line: address.line,
        line2: address.line2 || "",
        landmark: address.landmark || "",
        city: address.city || "",
        state: address.state || "",
        pincode: address.pincode || "",
        country: address.country || "India",
      });
    } else if (query.trim()) {
      onChange({
        ...value,
        line: query.trim(),
        line2: "",
        landmark: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
      });
    }
    setExpanded(true);
    setOpen(false);
    requestAnimationFrame(() =>
      container.current
        ?.querySelector<HTMLInputElement>(`#${prefix}-line`)
        ?.focus(),
    );
  }
  return (
    <div ref={container} className="space-y-4">
      {!showDetails ? (
        <div
          className="relative space-y-2"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setOpen(false);
          }}
        >
          <Label htmlFor={`${prefix}-search`}>Address</Label>
          <Input
            id={`${prefix}-search`}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            aria-activedescendant={open ? `${listId}-${active}` : undefined}
            value={query}
            placeholder="Search or enter an address"
            autoComplete="off"
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOpen(false);
                return;
              }
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                setOpen(true);
                setActive(
                  (current) =>
                    (current +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      matches.length +
                      1) %
                    (matches.length + 1),
                );
              }
              if (event.key === "Enter") {
                event.preventDefault();
                reveal(matches[active]);
              }
            }}
          />
          {open && (
            <div className="absolute z-20 w-full overflow-hidden rounded-lg border bg-popover text-popover-foreground">
              <p className="border-b px-3 py-2 text-xs text-muted-foreground">
                {matches.length
                  ? "Saved addresses"
                  : "Online address search isn’t connected"}
              </p>
              <div id={listId} role="listbox" aria-label="Address options">
                {matches.map((address: any, index: number) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={active === index}
                    id={`${listId}-${index}`}
                    key={`${address.line}-${address.pincode}`}
                    className={`flex w-full items-start gap-2 px-3 py-3 text-left text-sm hover:bg-accent ${active === index ? "bg-accent" : ""}`}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => reveal(address)}
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span>
                      {address.line}
                      <span className="block text-xs text-muted-foreground">
                        {[address.city, address.state, address.pincode]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  role="option"
                  aria-selected={active === matches.length}
                  id={`${listId}-${matches.length}`}
                  className={`flex w-full items-center gap-2 border-t px-3 py-3 text-left text-sm hover:bg-accent ${active === matches.length ? "bg-accent" : ""}`}
                  onClick={() => reveal()}
                >
                  <Pencil className="size-4" />
                  Enter address manually
                </button>
              </div>
            </div>
          )}
          {!open && (
            <Button
              variant="link"
              size="sm"
              className="h-auto px-0"
              onClick={() => reveal()}
            >
              Enter address manually
            </Button>
          )}
        </div>
      ) : (
        <>
          <Field
            label="Address line 1"
            id={`${prefix}-line`}
            value={value.line}
            required
            error={errors.line}
            autoComplete="address-line1"
            placeholder="House, building, street and area"
            onChange={(v: string) => update("line", v)}
          />
          <Field
            label="Address line 2 (optional)"
            value={value.line2 || ""}
            autoComplete="address-line2"
            placeholder="Apartment, floor or suite"
            onChange={(v: string) => update("line2", v)}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="City"
              id={`${prefix}-city`}
              value={value.city}
              required
              error={errors.city}
              autoComplete="address-level2"
              onChange={(v: string) => update("city", v)}
            />
            <Field
              label="Pincode"
              id={`${prefix}-pincode`}
              value={value.pincode}
              required
              error={errors.pincode}
              maxLength={6}
              inputMode="numeric"
              autoComplete="postal-code"
              onChange={(v: string) => update("pincode", v.replace(/\D/g, ""))}
            />
            <Field
              label="State"
              id={`${prefix}-state`}
              value={value.state}
              required
              error={errors.state}
              autoComplete="address-level1"
              onChange={(v: string) => update("state", v)}
            />
          </div>
          <div className={`grid gap-4 ${landmark ? "sm:grid-cols-2" : ""}`}>
            {landmark && (
              <Field
                label="Landmark (optional)"
                value={value.landmark || ""}
                onChange={(v: string) => update("landmark", v)}
              />
            )}
            <SelectField
              label="Country"
              value={value.country || "India"}
              items={["India"]}
              onChange={(v: string) => update("country", v)}
            />
          </div>
        </>
      )}
      {!showDetails &&
        Object.entries(errors)
          .filter(([key]) => ["line", "city", "pincode", "state"].includes(key))
          .slice(0, 1)
          .map(([key, error]) => (
            <p key={key} role="alert" className="text-xs text-destructive">
              {error} Enter the full address to continue.
            </p>
          ))}
    </div>
  );
}
