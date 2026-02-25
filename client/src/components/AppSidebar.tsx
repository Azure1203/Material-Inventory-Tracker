import { Home, Package, Building2, Factory, Palette, Layers } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import logoSrc from "@assets/Netley-Logo-Horizontal_1771978155804.png";

const mainItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Materials", url: "/materials", icon: Package },
];

const manageItems = [
  { title: "Suppliers", url: "/suppliers", icon: Building2 },
  { title: "Manufacturers", url: "/manufacturers", icon: Factory },
  { title: "Color Collections", url: "/color-ranges", icon: Palette },
  { title: "Product Groups", url: "/product-groups", icon: Layers },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { setOpenMobile, setOpen } = useSidebar();

  const handleNavClick = () => {
    setOpenMobile(false);
    setOpen(false);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex flex-col items-center gap-1.5 py-1">
          <div className="bg-white/95 rounded-md px-3 py-2 inline-block">
            <img
              src={logoSrc}
              alt="Netley Millwork"
              className="h-8 w-auto"
              data-testid="img-sidebar-logo"
            />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 font-medium">
            Material Database
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link
                      href={item.url}
                      onClick={handleNavClick}
                      data-testid={`nav-${item.title.toLowerCase()}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {manageItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link
                      href={item.url}
                      onClick={handleNavClick}
                      data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/60 text-center">
          2026 Material Availability
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
