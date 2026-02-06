import { useState } from "react";
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
import { Lock, LogOut, Shield } from "lucide-react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Materials from "@/pages/Materials";
import Suppliers from "@/pages/Suppliers";
import Manufacturers from "@/pages/Manufacturers";
import ColorRanges from "@/pages/ColorRanges";
import ProductGroups from "@/pages/ProductGroups";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/materials" component={Materials} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/manufacturers" component={Manufacturers} />
      <Route path="/color-ranges" component={ColorRanges} />
      <Route path="/product-groups" component={ProductGroups} />
      <Route component={NotFound} />
    </Switch>
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
          <header className="flex items-center justify-between gap-2 p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-1">
              {isAdmin && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
                  <Shield className="h-3 w-3" />
                  <span>Admin</span>
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
