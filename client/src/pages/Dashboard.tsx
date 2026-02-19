import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Building2, Factory, Palette, Layers, DollarSign, Info, Search, X } from "lucide-react";
import { getCostLevelDisplay, getCostLevelColor, thumbUrl } from "@/lib/utils";
import { useLookupData } from "@/hooks/use-lookup-data";
import type { MaterialWithRelations } from "@shared/schema";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [manufacturerFilter, setManufacturerFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: materials, isLoading: materialsLoading } = useQuery<MaterialWithRelations[]>({
    queryKey: ["/api/materials"],
  });

  const { suppliers, manufacturers, colorRanges, productGroups, isLoading: lookupLoading } = useLookupData();

  const isLoading = materialsLoading || lookupLoading;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !materials) return [];
    const query = searchQuery.toLowerCase();
    return materials
      .filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.productCode?.toLowerCase().includes(query) ||
        m.manufacturer?.name.toLowerCase().includes(query) ||
        m.supplier?.name.toLowerCase().includes(query) ||
        m.colorRange?.name.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [searchQuery, materials]);

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
      href: manufacturerFilter ? `/materials?manufacturer=${manufacturerFilter}` : "/materials",
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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your material inventory</p>
        </div>
        <div ref={searchRef} className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                setSearchFocused(false);
                navigate(`/materials?search=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
            className="pl-9 pr-9"
            data-testid="input-dashboard-search"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              data-testid="button-clear-search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {searchFocused && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">No materials found</div>
              ) : (
                <>
                  {searchResults.map(material => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer hover-elevate"
                      onClick={() => {
                        setSearchFocused(false);
                        setSearchQuery("");
                        navigate(`/materials?search=${encodeURIComponent(material.name)}`);
                      }}
                      data-testid={`search-result-${material.id}`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{material.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[material.manufacturer?.name, material.supplier?.name, material.productCode].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      {material.inStock ? (
                        <Badge variant="secondary" className="shrink-0 text-xs">Stock</Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0 text-xs">Non-Stock, 6-12 Week Leadtime</Badge>
                      )}
                    </div>
                  ))}
                  <div
                    className="border-t px-3 py-2 text-sm text-primary cursor-pointer hover-elevate text-center"
                    onClick={() => {
                      setSearchFocused(false);
                      navigate(`/materials?search=${encodeURIComponent(searchQuery.trim())}`);
                      setSearchQuery("");
                    }}
                    data-testid="button-view-all-results"
                  >
                    View all results on Materials page
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md border px-3 sm:px-4 py-2 text-xs sm:text-sm text-muted-foreground" data-testid="notice-cost-guideline">
        <Info className="h-4 w-4 shrink-0" />
        <span>Cost category is meant to serve as a guideline only.</span>
      </div>

      <div>
        <span className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
          <Factory className="h-4 w-4" />
          Manufacturer
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={manufacturerFilter === null ? "default" : "outline"}
            onClick={() => setManufacturerFilter(null)}
            data-testid="button-filter-manufacturer-all"
          >
            All
          </Button>
          {manufacturers?.map(m => (
            <Button
              key={m.id}
              variant={manufacturerFilter === m.id ? "default" : "outline"}
              onClick={() => {
                setManufacturerFilter(m.id);
                navigate(`/materials?manufacturer=${m.id}`);
              }}
              data-testid={`button-filter-manufacturer-${m.id}`}
            >
              {m.logoUrl ? (
                <img src={thumbUrl(m.logoUrl, 48)} alt="" className="h-5 w-5 rounded-sm object-contain shrink-0 mr-1.5" data-testid={`img-dashboard-manufacturer-logo-${m.id}`} />
              ) : null}
              {m.name}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
          <Building2 className="h-4 w-4" />
          Supplier
        </span>
        <div className="flex flex-wrap gap-2">
          {suppliers?.map(s => (
            <Button
              key={s.id}
              variant="outline"
              onClick={() => navigate(`/materials?supplier=${s.id}`)}
              data-testid={`button-filter-supplier-${s.id}`}
            >
              {s.logoUrl ? (
                <img src={thumbUrl(s.logoUrl, 48)} alt="" className="h-5 w-5 rounded-sm object-contain shrink-0 mr-1.5" data-testid={`img-dashboard-supplier-logo-${s.id}`} />
              ) : null}
              {s.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer hover-elevate"
            onClick={() => navigate(stat.href)}
            data-testid={`stat-${stat.title.toLowerCase().replace(/ /g, "-")}`}
          >
            <CardContent className="p-3 sm:p-4">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`p-1.5 sm:p-2 rounded-md ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs text-muted-foreground" data-testid="notice-cost-guideline-breakdown">
              <Info className="h-4 w-4 shrink-0" />
              <span>Cost category is meant to serve as a guideline only.</span>
            </div>
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
