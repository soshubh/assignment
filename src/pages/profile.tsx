import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Package,
  RotateCcw,
  Copy,
  ArrowRight,
  UserRound,
  Building2,
  CreditCard,
  LockKeyhole,
  Eye,
  Save,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Shipway as S } from "@/lib/store";
import { Field, SelectField, Panel } from "@/components/form";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
const tabs = [
  { label: "Personal", slug: "personal", icon: UserRound },
  { label: "Business", slug: "business", icon: Building2 },
  { label: "Plans", slug: "plans", icon: CreditCard },
  { label: "Security & API", slug: "security", icon: LockKeyhole },
  { label: "Privacy", slug: "privacy", icon: Eye },
] as const;
type TabLabel = (typeof tabs)[number]["label"];
function tabFromUrl(): TabLabel {
  const slug = new URLSearchParams(location.search).get("tab")?.toLowerCase();
  return tabs.find((t) => t.slug === slug)?.label ?? "Personal";
}
function setTabUrl(label: TabLabel, replace = false) {
  const slug = tabs.find((t) => t.label === label)?.slug ?? "personal";
  const url = new URL(location.href);
  url.searchParams.set("tab", slug);
  history[replace ? "replaceState" : "pushState"](null, "", url);
}
function validate(p: any) {
  const errors: Record<string, string> = {};
  if (!p.name.trim()) errors.name = "Enter your full name.";
  if (!/^[6-9]\d{9}$/.test(p.phone))
    errors.phone = "Enter a valid 10-digit Indian mobile number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))
    errors.email = "Enter a valid email address.";
  if (
    p.gst &&
    !p.gstExempt &&
    !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(p.gst)
  )
    errors.gst = "Check the format: 15 characters, e.g. 22AAAAA0000A1Z5.";
  for (const key of ["website", "ecommerce", "facebook"])
    if (p[key]) {
      try {
        const url = new URL(p[key]);
        if (
          !["https:", "http:"].includes(url.protocol) ||
          !url.hostname.includes(".")
        )
          throw Error();
      } catch {
        errors[key] = "Enter a full website URL starting with https://.";
      }
    }
  if (p.whatsapp && !/^[6-9]\d{9}$/.test(p.whatsapp))
    errors.whatsapp = "Enter a valid 10-digit WhatsApp number.";
  return errors;
}
export function Profile() {
  const [p, setP] = useState(S.load().profile);
  const [tab, setTab] = useState<TabLabel>(tabFromUrl);
  const [revealed, setRevealed] = useState(false);
  const [plan, setPlan] = useState("");
  const photoInput = useRef<HTMLInputElement>(null);
  const imageTarget = tab === "Business" ? "logo" : "avatar";
  function goToTab(label: TabLabel, options?: { replace?: boolean; focus?: string }) {
    setTab(label);
    setTabUrl(label, options?.replace);
    setFocus(options?.focus ?? "");
  }
  async function uploadImage(file?: File) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 500 * 1024
    ) {
      toast.error("Choose a JPG, PNG or WebP image under 500 KB.");
      return;
    }
    const target = imageTarget;
    try {
      const source = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = source;
      });
      update(target, source);
    } catch {
      toast.error("This image could not be opened. Choose another image.");
    }
  }
  const [errors, setErrors] = useState<Record<string, string>>({});
  const baseline = useRef(JSON.stringify(p));
  const [saved, setSaved] = useState(false);
  const [focus, setFocus] = useState("");
  const dirty = JSON.stringify(p) !== baseline.current;
  const update = (key: string, value: any) => {
    setP((p: any) => ({ ...p, [key]: value }));
    setSaved(false);
    setErrors((e) => ({ ...e, [key]: "" }));
  };
  useEffect(() => {
    if (tab !== "Security & API") setRevealed(false);
    if (focus)
      requestAnimationFrame(() => document.getElementById(focus)?.focus());
  }, [tab, focus]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const checks = [
    {
      label: "Contact details",
      done:
        !!(p.name && p.email && p.phone) &&
        !validate(p).name &&
        !validate(p).email &&
        !validate(p).phone,
      tab: "Personal",
      field: "name",
      cta: "Add contact details",
      why: "Keep account notifications going to the right person.",
    },
    {
      label: "Company & brand",
      done: !!(p.company && p.brand),
      tab: "Business",
      field: "company",
      cta: "Add company details",
      why: "Identify the business sending your orders.",
    },
    {
      label: "GST preference",
      done: !!((p.gst && !validate(p).gst) || p.gstExempt),
      tab: "Business",
      field: "gst",
      cta: "Add GST preference",
      why: "Add your GST number or mark your business as unregistered.",
    },
    {
      label: "Billing address",
      done: !!p.address?.trim(),
      tab: "Business",
      field: "address",
      cta: "Add billing address",
      why: "Keep the address used for invoices in one place.",
    },
    {
      label: "Sales channel",
      done: !!(
        (p.website && !validate(p).website) ||
        (p.ecommerce && !validate(p).ecommerce)
      ),
      tab: "Business",
      field: "website",
      cta: "Add a sales channel",
      why: "Tell us where your customers place their orders.",
    },
  ];
  const pct = checks.filter((c) => c.done).length * 20;
  const next = checks.find((c) => !c.done);
  const navigate = (c: (typeof checks)[number]) => {
    setTab(c.tab);
    setFocus("profile-" + c.field);
  };
  function save() {
    const found = validate(p);
    setErrors(found);
    if (Object.keys(found).length) {
      const key = Object.keys(found)[0];
      setTab(
        ["name", "phone", "email"].includes(key) ? "Personal" : "Business",
      );
      setFocus("profile-" + key);
      toast.error("Check the highlighted fields. Your changes are still here.");
      return;
    }
    try {
      const data = S.load();
      data.profile = p;
      S.save(data);
      baseline.current = JSON.stringify(p);
      setSaved(true);
      window.dispatchEvent(new Event("shipway:updated"));
      toast.success("Settings saved");
    } catch {
      toast.error("Could not save settings. Please try again.");
    }
  }
  const field = (key: string, label: string, extra: any = {}) => (
    <Field
      id={"profile-" + key}
      key={key}
      label={label}
      value={p[key]}
      error={errors[key]}
      onChange={(v: string) => update(key, v)}
      {...extra}
    />
  );
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your identity, business and account preferences.
          </p>
        </div>
      </div>

      <section
        className="flex flex-wrap items-center gap-5 rounded-xl border bg-accent/40 p-6"
        aria-label="Profile overview"
      >
        <Avatar className="size-20 border-4 border-background">
          <AvatarImage
            src={p[imageTarget]}
            alt={imageTarget === "logo" ? "Company logo" : "Profile photo"}
            className="object-cover"
          />
          <AvatarFallback className="bg-accent text-xl font-semibold text-accent-foreground">
            {(tab === "Business"
              ? p.company || "Business"
              : p.name || "Your account"
            )
              .split(" ")
              .map((word: string) => word[0])
              .slice(0, 2)
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">
              {tab === "Business"
                ? p.company || "Your business"
                : p.name || "Your account"}
            </h2>
            <Badge variant="outline" className="bg-background">
              Admin · Demo account
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {tab === "Business"
              ? p.brand || "Add your brand identity"
              : p.company || "Your shipping workspace"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => photoInput.current?.click()}
            >
              <Camera className="size-3.5" />
              {tab === "Business" ? "Upload company logo" : "Change photo"}
            </Button>
            {p[imageTarget] && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => update(imageTarget, "")}
              >
                Remove
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              JPG, PNG or WebP · up to 500 KB
            </span>
          </div>
          <input
            ref={photoInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            aria-label="Upload profile image"
            onChange={(event) => {
              void uploadImage(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      </section>
      <div className="space-y-5">
        <nav
          aria-label="Account settings"
          className="flex gap-1 overflow-x-auto border-b pb-3"
        >
          {tabs.map((t) => (
            <Button
              key={t.label}
              variant={tab === t.label ? "secondary" : "ghost"}
              aria-current={tab === t.label ? "page" : undefined}
              className="shrink-0 justify-start gap-2"
              onClick={() => {
                setTab(t.label);
                setFocus("");
              }}
            >
              <t.icon className="size-4" />
              {t.label}
            </Button>
          ))}
        </nav>
        <div className="min-w-0 space-y-5">
          {tab === "Business" && (
            <section
              aria-label="Account setup progress"
              className="rounded-lg border px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">
                      {pct === 100
                        ? "Your account is all set"
                        : "Account setup"}
                    </p>
                    <Badge variant="secondary">
                      {checks.filter((c) => c.done).length} of {checks.length}
                    </Badge>
                  </div>

                  <Progress value={pct} className="mt-3 h-1.5 max-w-80" />
                </div>
                {next && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(next)}
                  >
                    {next.cta}
                    <ArrowRight className="size-3.5" />
                  </Button>
                )}
              </div>
            </section>
          )}
          {tab === "Personal" && (
            <>
              <Panel title="Personal details">
                <div className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-3">
                    {field("name", "Full name", {
                      required: true,
                      autoComplete: "name",
                    })}
                    {field("phone", "Mobile number", {
                      required: true,
                      type: "tel",
                      inputMode: "numeric",
                      autoComplete: "tel-national",
                      maxLength: 10,
                    })}
                    {field("email", "Email address", {
                      required: true,
                      type: "email",
                      autoComplete: "email",
                    })}
                  </div>
                </div>
              </Panel>
            </>
          )}
          {tab === "Business" && (
            <>
              <Panel title="Business identity">
                <div className="mb-5 flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Company ID</p>
                    <p className="mt-1 text-sm font-medium">
                      {p.companyId || "149245"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Copy company ID"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          p.companyId || "149245",
                        );
                        toast.success("Company ID copied");
                      } catch {
                        toast.error("Could not copy company ID.");
                      }
                    }}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
                <div className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    {field("company", "Company name", {
                      placeholder: "Registered company name",
                    })}
                    {field("brand", "Brand name", {
                      placeholder: "The name customers know",
                    })}
                  </div>
                  {field("gst", "GST number", {
                    placeholder: "22AAAAA0000A1Z5",
                    maxLength: 15,
                    disabled: !!p.gstExempt,
                    hint: "Used on business invoices. Enter it exactly as registered.",
                  })}
                  <label className="flex items-center gap-2 text-xs">
                    <Checkbox
                      checked={!!p.gstExempt}
                      onCheckedChange={(v) => update("gstExempt", v)}
                    />
                    My business is not registered for GST
                  </label>
                </div>
              </Panel>
              <Panel title="Billing & shipping preferences">
                <div className="space-y-5">
                  <SelectField
                    label="Billing method"
                    value={p.billing}
                    onChange={(v: string) => update("billing", v)}
                    items={["Prepaid", "Postpaid"]}
                    hint="Prepaid uses your wallet balance. Postpaid is subject to your account’s billing arrangement."
                  />
                  <div className="space-y-2">
                    <Label htmlFor="profile-address">Billing address</Label>
                    <Textarea
                      id="profile-address"
                      value={p.address}
                      onChange={(e) => update("address", e.target.value)}
                      placeholder="Registered office, street, city, state and pincode"
                    />
                    <p className="text-xs text-muted-foreground">
                      The address used on your business invoices.
                    </p>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {field("volume", "Monthly order volume", {
                      hint: "An approximate range is fine, e.g. 100–500.",
                    })}
                    {field("goal", "Shipping priority", {
                      hint: "e.g. Faster delivery or lower shipping costs.",
                    })}
                  </div>
                </div>
              </Panel>
              <Panel title="Where you sell">
                <div className="space-y-5">
                  {field("website", "Website", {
                    type: "url",
                    placeholder: "https://yourstore.com",
                  })}
                  {field("ecommerce", "Marketplace or store URL", {
                    type: "url",
                    placeholder: "https://marketplace.com/your-store",
                  })}
                  <div className="grid gap-5 sm:grid-cols-2">
                    {field("instagram", "Instagram (optional)", {
                      placeholder: "@yourbrand",
                    })}
                    {field("facebook", "Facebook (optional)", {
                      type: "url",
                      placeholder: "https://facebook.com/yourbrand",
                    })}
                    {field("whatsapp", "WhatsApp (optional)", {
                      type: "tel",
                      inputMode: "numeric",
                      maxLength: 10,
                      placeholder: "10-digit number",
                    })}
                  </div>
                </div>
              </Panel>
            </>
          )}
          {tab === "Plans" && (
            <div className="grid gap-5 lg:grid-cols-2">
              {[
                {
                  title: "Forward shipping",
                  icon: Package,
                  description: "Deliver orders to your customers.",
                },
                {
                  title: "Returns",
                  icon: RotateCcw,
                  description: "Manage customer returns and RTO shipments.",
                },
              ].map((item) => (
                <Panel key={item.title} title={item.title}>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-primary">
                        <item.icon className="size-5" />
                      </span>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">Free</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <p className="border-t pt-4 text-xs text-muted-foreground">
                      Sample plan · Shipping charges apply separately.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setPlan(item.title)}
                    >
                      Explore upgrade
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </Panel>
              ))}
            </div>
          )}
          {tab === "Security & API" && (
            <div className="space-y-5">
              <Panel title="Account security">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">
                      Sign-in & verification
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Password changes, email verification and active sessions
                      need a connected account service.
                    </p>
                  </div>
                  <Badge variant="outline">Not connected</Badge>
                </div>
              </Panel>
              <Panel title="Integration access">
                <div className="space-y-5">
                  <Badge variant="outline">Demo key only</Badge>
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API licence key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="api-key"
                        className="font-mono text-xs"
                        readOnly
                        value={
                          revealed
                            ? "demo_shipway_94f2c1a8b3"
                            : "••••••••••••••••••••••"
                        }
                      />
                      <Button
                        variant="outline"
                        onClick={() => setRevealed((v) => !v)}
                      >
                        {revealed ? "Hide" : "Reveal"}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    This sample key cannot access a live account. Live
                    credentials and rotation belong in your production developer
                    settings.
                  </p>
                </div>
              </Panel>
            </div>
          )}
          {tab === "Privacy" && (
            <Panel title="Customer visibility">
              <div className="space-y-4">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
                  <Checkbox
                    checked={p.showCustomer}
                    onCheckedChange={(v) => update("showCustomer", v)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium">
                      Show customer names
                    </span>
                    <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                      When off, the list displays “Customer hidden”. Names
                      remain available in the order editor. This browser-only
                      preference does not change API access.
                    </span>
                  </span>
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">
                      Customer information via API
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Managed by your integration permissions.
                    </p>
                  </div>
                  <Badge variant="outline">API not connected</Badge>
                </div>
              </div>
            </Panel>
          )}
          <section
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-accent/30 p-5"
            aria-label="Profile support"
          >
            <div>
              <h3 className="text-sm font-semibold">Need a hand?</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Help with your account, shipping or business setup.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href="mailto:support@shipway.com">
                Contact support
                <ArrowRight className="size-3.5" />
              </a>
            </Button>
          </section>
          <Dialog
            open={!!plan}
            onOpenChange={(open) => {
              if (!open) setPlan("");
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{plan} upgrade</DialogTitle>
                <DialogDescription>
                  Plan purchasing is not connected in this prototype. Your
                  current Free plan remains active.
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Contact Shipway support to discuss available plans and account
                eligibility.
              </p>
              <Button asChild variant="outline">
                <a href="mailto:support@shipway.com">Contact support</a>
              </Button>
            </DialogContent>
          </Dialog>
          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 p-4 backdrop-blur-sm">
            <span
              aria-live="polite"
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              {dirty ? (
                "You have unsaved changes"
              ) : saved ? (
                <>
                  <CheckCircle2 className="size-3.5" />
                  All changes saved
                </>
              ) : (
                "Your settings are up to date"
              )}
            </span>
            <Button size="sm" disabled={!dirty} onClick={save}>
              <Save className="size-3.5" />
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
