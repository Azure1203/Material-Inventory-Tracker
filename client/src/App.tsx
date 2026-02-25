import { useState, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminAuthProvider, useAdminAuth } from "@/lib/adminAuth";
import { AdminLoginDialog } from "@/components/AdminLoginDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, LogOut, Shield } from "lucide-react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Materials from "@/pages/Materials";
import logoSrc from "@assets/Netley-Logo-Horizontal_1771978155804.png";

const Suppliers = lazy(() => import("@/pages/Suppliers"));
const Manufacturers = lazy(() => import("@/pages/Manufacturers"));
const ColorRanges = lazy(() => import("@/pages/ColorRanges"));
const ProductGroups = lazy(() => import("@/pages/ProductGroups"));

function PageFallback() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/materials" component={Materials} />
        <Route path="/suppliers" component={Suppliers} />
        <Route path="/manufacturers" component={Manufacturers} />
        <Route path="/color-ranges" component={ColorRanges} />
        <Route path="/product-groups" component={ProductGroups} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AdminToggle() {
  const { isAdmin, logout } = useAdminAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  if (isAdmin) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={logout}
        title="Logout (admin)"
        data-testid="button-admin-logout"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setLoginOpen(true)}
        title="Admin login"
        data-testid="button-admin-login"
      >
        <Lock className="h-4 w-4" />
      </Button>
      <AdminLoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
}

function AppLayout() {
  const { isAdmin } = useAdminAuth();

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger data-testid="button-sidebar-toggle" />

            <div className="flex flex-col items-center gap-0" data-testid="header-brand">
              <img
                src={logoSrc}
                alt="Netley Millwork"
                className="h-6 sm:h-7 w-auto"
                data-testid="img-header-logo"
              />
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-medium leading-none mt-0.5">
                Material Database
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary px-2 py-1 rounded-md bg-primary/10">
                  <Shield className="h-3 w-3" />
                  <span className="hidden sm:inline">Admin</span>
                </div>
              )}
              <AdminToggle />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-muted/30">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdminAuthProvider>
          <AppLayout />
        </AdminAuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
