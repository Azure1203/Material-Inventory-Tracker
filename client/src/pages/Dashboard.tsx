import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Building2, Factory, Palette, Layers, DollarSign, Search, X, ArrowRight } from "lucide-react";
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
      href: manufacturerFilter ? `/materials?manufacturer=${manufacturerFilter}` : "/materials",
    },
    {
      title: "Suppliers",
      value: suppliers?.length || 0,
      icon: Building2,
      href: "/suppliers",
    },
    {
      title: "Manufacturers",
      value: manufacturers?.length || 0,
      icon: Factory,
      href: "/manufacturers",
    },
    {
      title: "Color Collections",
      value: colorRanges?.length || 0,
      icon: Palette,
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
    <div className="space-y-6">
      <div className="relative bg-gradient-to-br from-[#2E2E2E] via-[#3a3a3a] to-[#807161] px-6 py-8 sm:px-8 sm:py-10 rounded-md mx-4 mt-4 sm:mx-6 sm:mt-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-md" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2" data-testid="text-dashboard-title">
            Material Availability
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-2xl mb-5" data-testid="text-dashboard-disclaimer">
            This site is meant to service as a guideline to the Netley Millwork's material availability.
          </p>
          <div ref={searchRef} className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
              className="pl-11 pr-10 h-12 text-base bg-white dark:bg-background border-2 border-transparent focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary rounded-md shadow-md"
              data-testid="input-dashboard-search"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
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
                        <Badge variant={material.stockStatus === "non_stock" ? "outline" : "secondary"} className="shrink-0 text-xs">
                          {material.stockStatus === "stocked" ? "Stocked" : material.stockStatus === "local_stock" ? "Local Stock" : "Non-Stock"}
                        </Badge>
                      </div>
                    ))}
                    <div
                      className="border-t px-3 py-2 text-sm text-primary cursor-pointer hover-elevate text-center font-medium"
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
      </div>

      <div className="px-4 sm:px-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className="cursor-pointer hover-elevate overflow-visible relative"
              onClick={() => navigate(stat.href)}
              data-testid={`stat-${stat.title.toLowerCase().replace(/ /g, "-")}`}
            >
              <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
              <CardContent className="p-4 sm:p-5 pl-5 sm:pl-6">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{stat.title}</p>
                    </div>
                    <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary opacity-60" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-5">
          <div>
            <div className="border-l-2 border-primary pl-3 mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Factory className="h-3.5 w-3.5" />
                Filter by Manufacturer
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setManufacturerFilter(null)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all shadow-sm ${
                  manufacturerFilter === null
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-1"
                    : "bg-card border hover:border-primary/50 hover:bg-primary/5"
                }`}
                data-testid="button-filter-manufacturer-all"
              >
                All Manufacturers
              </button>
              {manufacturers?.map(m => (
                <button
                  key={m.id}
                  onClick={() => setManufacturerFilter(manufacturerFilter === m.id ? null : m.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all shadow-sm ${
                    manufacturerFilter === m.id
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-1"
                      : "bg-card border hover:border-primary/50 hover:bg-primary/5"
                  }`}
                  data-testid={`button-filter-manufacturer-${m.id}`}
                >
                  {m.logoUrl ? (
                    <img src={thumbUrl(m.logoUrl, 48)} alt="" className="h-6 w-6 rounded-sm object-contain shrink-0" data-testid={`img-dashboard-manufacturer-logo-${m.id}`} />
                  ) : null}
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="border-l-2 border-primary pl-3 mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Browse by Supplier
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {suppliers?.map(s => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/materials?supplier=${s.id}`)}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-card border hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm"
                  data-testid={`button-filter-supplier-${s.id}`}
                >
                  {s.logoUrl ? (
                    <img src={thumbUrl(s.logoUrl, 48)} alt="" className="h-6 w-6 rounded-sm object-contain shrink-0" data-testid={`img-dashboard-supplier-logo-${s.id}`} />
                  ) : null}
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
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
                      className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted/50 cursor-pointer hover-elevate group"
                      onClick={() => navigate(`/materials?productGroup=${group.id}${manufacturerFilter ? `&manufacturer=${manufacturerFilter}` : ""}`)}
                      data-testid={`group-${group.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-primary rounded-full" />
                        <p className="font-medium text-sm">{group.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{group.count}</Badge>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity invisible group-hover:visible" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4 text-primary" />
                Materials by Cost Level
              </CardTitle>
              <Badge variant="outline" className="text-xs font-normal text-muted-foreground">Guideline only</Badge>
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
                      className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted/50 cursor-pointer hover-elevate group"
                      onClick={() => navigate(`/materials?cost=${cost.level}${manufacturerFilter ? `&manufacturer=${manufacturerFilter}` : ""}`)}
                      data-testid={`cost-level-${cost.level}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-primary rounded-full" />
                        <p className={`font-bold text-sm ${cost.colorClass}`}>{cost.display}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{cost.count}</Badge>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity invisible group-hover:visible" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
