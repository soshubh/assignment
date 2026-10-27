import { lazy, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Package, UserRound, CircleHelp, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { Shipway as S, getOrders } from "@/lib/store";
import "./styles.css";
const Orders = lazy(() =>
  import("@/pages/orders").then((m) => ({ default: m.Orders })),
);
const OrderEditor = lazy(() =>
  import("@/pages/order-editor").then((m) => ({ default: m.OrderEditor })),
);
const Profile = lazy(() =>
  import("@/pages/profile").then((m) => ({ default: m.Profile })),
);
const path = location.pathname;
const page = path.includes("profile")
  ? "profile"
  : path.includes("order-new")
    ? "create"
    : path.includes("order-edit")
      ? "edit"
      : "orders";
function App() {
  const [storage, setStorage] = useState(S.load);
  const [helpOpen, setHelpOpen] = useState(false);
  useEffect(() => {
    const refresh = () => setStorage(S.load());
    window.addEventListener("shipway:updated", refresh);
    return () => window.removeEventListener("shipway:updated", refresh);
  }, []);
  return (
    <div className="min-h-screen md:grid md:grid-cols-[224px_minmax(0,1fr)]">
      <aside className="flex flex-col border-b bg-sidebar md:fixed md:inset-y-0 md:w-56 md:border-r md:border-b-0">
        <a
          href="index.html"
          aria-label="Shipway home"
          className="flex h-20 shrink-0 items-center px-6"
        >
          <img
            src="https://cdn.prod.website-files.com/65c4a9636687ae3b0294350e/676a513ed322c8fd24f83a07_Untitled%20design%20(60).webp"
            alt="Shipway by Unicommerce"
            className="h-10 w-32 object-contain object-left"
          />
        </a>
        <nav
          aria-label="Main navigation"
          className="flex flex-1 gap-1 px-3 pb-3 md:flex-col md:pb-4 md:pt-5"
        >
          <p className="mb-2 hidden px-3 text-xs font-medium text-muted-foreground md:block">
            Workspace
          </p>
          <a
            href="index.html"
            aria-current={page !== "profile" ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm",
              page !== "profile"
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            <Package className="size-4" />
            Orders
            <Badge
              variant="outline"
              className="ml-auto hidden bg-background text-xs md:inline-flex"
            >
              {getOrders().length}
            </Badge>
          </a>
          <Button
            variant="ghost"
            className="justify-start gap-2.5 text-muted-foreground md:hidden"
            onClick={() => setHelpOpen(true)}
          >
            <CircleHelp className="size-4" />
            Help
          </Button>
          <div className="mt-auto hidden space-y-3 pt-6 md:block">
            <section
              aria-label="Help"
              className="rounded-lg border bg-background p-3"
            >
              <p className="flex items-center gap-2 text-sm font-medium">
                <CircleHelp className="size-4" />
                Need a hand?
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => setHelpOpen(true)}
              >
                Get help
                <ArrowUpRight className="ml-auto size-3.5" />
              </Button>
            </section>
          </div>
          <a
            href="profile.html"
            aria-current={page === "profile" ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm md:mt-2",
              page === "profile"
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            <UserRound className="size-4 md:hidden" />
            <Avatar className="hidden size-8 md:flex">
              <AvatarImage
                src={storage.profile.avatar}
                alt="Profile photo"
                className="object-cover"
              />
              <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                {storage.profile.name
                  .trim()
                  .split(/\s+/)
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span>
              <span className="block">Profile</span>
              <span className="mt-0.5 hidden max-w-32 truncate text-xs font-normal text-muted-foreground md:block">
                {storage.profile.name}
              </span>
            </span>
          </a>
        </nav>
      </aside>
      <main
        className={cn(
          "mx-auto w-full min-w-0 max-w-[1360px] px-4 py-7 md:col-start-2 md:px-8 md:py-8",
          page === "profile" && "max-w-[1040px]",
        )}
      >
        <Suspense
          fallback={
            <div role="status" className="p-8 text-sm text-muted-foreground">
              Loading…
            </div>
          }
        >
          {page === "orders" ? (
            <Orders />
          ) : page === "profile" ? (
            <Profile />
          ) : (
            <OrderEditor editing={page === "edit"} />
          )}
        </Suspense>
      </main>
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How can we help?</DialogTitle>
            <DialogDescription>
              Find help for your Shipway workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="outline"
              asChild
              className="w-full justify-between"
            >
              <a href="index.html">
                Manage orders
                <Package className="size-4" />
              </a>
            </Button>
            <Button
              variant="outline"
              asChild
              className="w-full justify-between"
            >
              <a href="profile.html">
                Account settings
                <UserRound className="size-4" />
              </a>
            </Button>
            <Button
              variant="outline"
              asChild
              className="w-full justify-between"
            >
              <a
                href="https://www.shipway.com/contact"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contact Shipway
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster richColors closeButton />
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
