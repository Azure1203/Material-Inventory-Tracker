import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, CheckCircle, XCircle, Building2, Factory, Palette, Layers } from "lucide-react";
import type { MaterialWithRelations, Supplier, Manufacturer, ColorRange, ProductGroup } from "@shared/schema";

export default function Dashboard() {
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

  const totalMaterials = materials?.length || 0;
  const inStockCount = materials?.filter(m => m.inStock).length || 0;
  const outOfStockCount = totalMaterials - inStockCount;

  const stats = [
    {
      title: "Total Materials",
      value: totalMaterials,
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "In Stock",
      value: inStockCount,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Out of Stock",
      value: outOfStockCount,
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/30",
    },
    {
      title: "Suppliers",
      value: suppliers?.length || 0,
      icon: Building2,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Manufacturers",
      value: manufacturers?.length || 0,
      icon: Factory,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "Color Ranges",
      value: colorRanges?.length || 0,
      icon: Palette,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  const recentOutOfStock = materials?.filter(m => !m.inStock).slice(0, 5) || [];
  const materialsByGroup = productGroups?.map(group => ({
    ...group,
    count: materials?.filter(m => m.productGroupId === group.id).length || 0,
  })) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your material inventory</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} data-testid={`stat-${stat.title.toLowerCase().replace(/ /g, "-")}`}>
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
              <XCircle className="h-4 w-4 text-red-500" />
              Out of Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentOutOfStock.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500 opacity-50" />
                <p>All materials are in stock!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentOutOfStock.map(material => (
                  <div key={material.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50" data-testid={`out-of-stock-${material.id}`}>
                    <div>
                      <p className="font-medium text-sm">{material.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {material.manufacturer?.name || "Unknown manufacturer"}
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
                  <div key={group.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50" data-testid={`group-${group.id}`}>
                    <p className="font-medium text-sm">{group.name}</p>
                    <Badge variant="secondary">{group.count} materials</Badge>
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
