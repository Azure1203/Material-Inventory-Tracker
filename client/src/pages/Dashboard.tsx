import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Building2, Factory, Palette, Layers, DollarSign, Info } from "lucide-react";
import { getCostLevelDisplay, getCostLevelColor } from "@/lib/utils";
import type { MaterialWithRelations, Supplier, Manufacturer, ColorRange, ProductGroup } from "@shared/schema";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [manufacturerFilter, setManufacturerFilter] = useState<number | null>(null);

  const { data: materials, isLoading: materialsLoading } = useQuery<MaterialWithRelations[]>({
    queryKey: ["/api/materials"],
  });

  const { data: suppliers, isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: manufacturers, isLoading: manufacturersLoading } = useQuery<Manufacturer[]>({
    queryKey: ["/api/manufacturers"],
  });

  const { data: colorRanges, isLoading: colorRangesLoading } = useQuery<ColorRange[]>({
    queryKey: ["/api/color-ranges"],
  });

  const { data: productGroups, isLoading: productGroupsLoading } = useQuery<ProductGroup[]>({
    queryKey: ["/api/product-groups"],
  });

  const isLoading = materialsLoading || suppliersLoading || manufacturersLoading || colorRangesLoading || productGroupsLoading;

  const filteredMaterials = manufacturerFilter
    ? materials?.filter(m => m.manufacturerId === manufacturerFilter)
    : materials;

  const totalMaterials = filteredMaterials?.length || 0;

  const stats = [
    {
      title: "Total Materials",
      value: totalMaterials,
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
      href: "/materials",
    },
    {
      title: "Suppliers",
      value: suppliers?.length || 0,
      icon: Building2,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      href: "/suppliers",
    },
    {
      title: "Manufacturers",
      value: manufacturers?.length || 0,
      icon: Factory,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      href: "/manufacturers",
    },
    {
      title: "Color Collections",
      value: colorRanges?.length || 0,
      icon: Palette,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      href: "/color-ranges",
    },
  ];

  const materialsByGroup = productGroups?.map(group => ({
    ...group,
    count: filteredMaterials?.filter(m => m.productGroups?.some(pg => pg.id === group.id)).length || 0,
  })) || [];

  const materialsByCost = [1, 2, 3, 4, 5].map(level => ({
    level,
    display: getCostLevelDisplay(level),
    colorClass: getCostLevelColor(level),
    count: filteredMaterials?.filter(m => m.costLevel === level).length || 0,
  })).filter(c => c.count > 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your material inventory</p>
      </div>

      <div className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm text-muted-foreground" data-testid="notice-cost-guideline">
        <Info className="h-4 w-4 shrink-0" />
        <span>Cost category is meant to serve as a guideline only.</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-1">
          <Factory className="h-4 w-4 inline mr-1" />
          Manufacturer:
        </span>
        <Button
          variant={manufacturerFilter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setManufacturerFilter(null)}
          data-testid="button-filter-manufacturer-all"
        >
          All
        </Button>
        {manufacturers?.map(m => (
          <Button
            key={m.id}
            variant={manufacturerFilter === m.id ? "default" : "outline"}
            size="sm"
            onClick={() => setManufacturerFilter(m.id)}
            data-testid={`button-filter-manufacturer-${m.id}`}
          >
            {m.name}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer hover-elevate"
            onClick={() => navigate(stat.href)}
            data-testid={`stat-${stat.title.toLowerCase().replace(/ /g, "-")}`}
          >
            <CardContent className="p-4">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-md ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-primary" />
              Materials by Product Group
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : materialsByGroup.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No product groups defined yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {materialsByGroup.map(group => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50 cursor-pointer hover-elevate"
                    onClick={() => navigate(`/materials?productGroup=${group.id}${manufacturerFilter ? `&manufacturer=${manufacturerFilter}` : ""}`)}
                    data-testid={`group-${group.id}`}
                  >
                    <p className="font-medium text-sm">{group.name}</p>
                    <Badge variant="secondary">{group.count} materials</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-primary" />
              Materials by Cost Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : materialsByCost.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No materials with cost levels yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {materialsByCost.map(cost => (
                  <div
                    key={cost.level}
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50 cursor-pointer hover-elevate"
                    onClick={() => navigate(`/materials?cost=${cost.level}${manufacturerFilter ? `&manufacturer=${manufacturerFilter}` : ""}`)}
                    data-testid={`cost-level-${cost.level}`}
                  >
                    <p className={`font-bold text-sm ${cost.colorClass}`}>{cost.display}</p>
                    <Badge variant="secondary">{cost.count} materials</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
