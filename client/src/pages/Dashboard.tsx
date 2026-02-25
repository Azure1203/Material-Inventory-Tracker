import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package, Building2, Factory, Palette, Layers,
  DollarSign, Search, X, ArrowRight, ArrowUpRight, Filter
} from "lucide-react";
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

  const activeManufacturerName = manufacturerFilter
    ? manufacturers?.find(m => m.id === manufacturerFilter)?.name
    : null;

  return (
    <div className="space-y-5 pb-8">

      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-[#2E2E2E] via-[#3a3a3a] to-[#807161] px-5 py-8 sm:px-8 sm:py-10 sm:mx-6 sm:mt-6 sm:rounded-xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary sm:rounded-t-xl" />
        <span className="absolute right-3 bottom-0 text-[7rem] sm:text-[9rem] font-black text-white/[0.04] leading-none select-none pointer-events-none">
          NM
        </span>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5" data-testid="text-dashboard-title">
            Material Availability
          </h1>
          <p className="text-white/65 text-sm sm:text-base max-w-2xl mb-5" data-testid="text-dashboard-disclaimer">
            This site is meant to service as a guideline to the Netley Millwork's material availability.
          </p>
          <div ref={searchRef} className="relative w-full sm:max-w-xl">
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
              className="pl-11 pr-10 h-12 text-base bg-white dark:bg-background border-2 border-transparent focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary rounded-lg shadow-md"
              data-testid="input-dashboard-search"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-clear-search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {searchFocused && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">No materials found</div>
                ) : (
                  <>
                    {searchResults.map(material => (
                      <div
                        key={material.id}
                        className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-muted/60 transition-colors border-b border-border/50 last:border-0"
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
                        <Badge
                          variant={material.stockStatus === "non_stock" ? "outline" : "secondary"}
                          className="shrink-0 text-xs"
                        >
                          {material.stockStatus === "stocked" ? "Stocked"
                            : material.stockStatus === "local_stock" ? "Local Stock"
                            : "Non-Stock"}
                        </Badge>
                      </div>
                    ))}
                    <div
                      className="px-4 py-3 text-sm text-primary cursor-pointer hover:bg-muted/60 transition-colors text-center font-semibold flex items-center justify-center gap-1.5"
                      onClick={() => {
                        setSearchFocused(false);
                        navigate(`/materials?search=${encodeURIComponent(searchQuery.trim())}`);
                        setSearchQuery("");
                      }}
                      data-testid="button-view-all-results"
                    >
                      View all results <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 space-y-5">

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className="cursor-pointer hover:shadow-md transition-shadow overflow-visible relative"
              onClick={() => navigate(stat.href)}
              data-testid={`stat-${stat.title.toLowerCase().replace(/ /g, "-")}`}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-full" />
              <CardContent className="p-4 pl-5">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-9 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-3xl sm:text-4xl font-bold leading-none">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-tight">{stat.title}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <stat.icon className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Browse & Filter ── */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Filter className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Browse & Filter</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Filter by manufacturer to narrow the stats above, or browse directly to a supplier's materials
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">

            {/* Manufacturer Filter */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-0.5 h-4 bg-primary rounded-full" />
                <p className="text-xs font-semibold uppercase tracking-widest text-foreground flex items-center gap-1.5">
                  <Factory className="h-3.5 w-3.5 text-primary" />
                  Filter by Manufacturer
                </p>
              </div>
              <p className="text-xs text-muted-foreground mb-3 pl-3">
                Select a manufacturer to filter the counts above
                {activeManufacturerName && (
                  <span className="ml-1 font-medium text-primary">— showing {activeManufacturerName}</span>
                )}
              </p>
              {isLoading ? (
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-9 w-28 rounded-lg" />)}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setManufacturerFilter(null)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all border ${
                      manufacturerFilter === null
                        ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20 ring-offset-1 font-semibold"
                        : "bg-background border-border text-foreground hover:bg-primary/5 hover:border-primary/40"
                    }`}
                    data-testid="button-filter-manufacturer-all"
                  >
                    All
                  </button>
                  {manufacturers?.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setManufacturerFilter(manufacturerFilter === m.id ? null : m.id)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all border ${
                        manufacturerFilter === m.id
                          ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20 ring-offset-1 font-semibold"
                          : "bg-background border-border text-foreground hover:bg-primary/5 hover:border-primary/40"
                      }`}
                      data-testid={`button-filter-manufacturer-${m.id}`}
                    >
                      {m.logoUrl && (
                        <img
                          src={thumbUrl(m.logoUrl, 40)}
                          alt=""
                          className="h-5 w-5 rounded object-contain shrink-0"
                          data-testid={`img-dashboard-manufacturer-logo-${m.id}`}
                        />
                      )}
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Supplier Browse */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-0.5 h-4 bg-primary rounded-full" />
                <p className="text-xs font-semibold uppercase tracking-widest text-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  Browse by Supplier
                </p>
              </div>
              <p className="text-xs text-muted-foreground mb-3 pl-3">
                Click a supplier to view all their available materials
              </p>
              {isLoading ? (
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-9 w-32 rounded-lg" />)}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {suppliers?.map(s => (
                    <button
                      key={s.id}
                      onClick={() => navigate(`/materials?supplier=${s.id}`)}
                      className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium bg-background border border-border text-foreground hover:bg-primary/5 hover:border-primary/40 transition-all"
                      data-testid={`button-filter-supplier-${s.id}`}
                    >
                      {s.logoUrl && (
                        <img
                          src={thumbUrl(s.logoUrl, 40)}
                          alt=""
                          className="h-5 w-5 rounded object-contain shrink-0"
                          data-testid={`img-dashboard-supplier-logo-${s.id}`}
                        />
                      )}
                      {s.name}
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* ── Product Groups ── */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Materials by Product Group</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {activeManufacturerName ? `Filtered to ${activeManufacturerName}` : "Click a group to browse its materials"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
            ) : materialsByGroup.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Layers className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No product groups defined yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {materialsByGroup.map(group => (
                  <div
                    key={group.id}
                    className="relative flex items-stretch border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:border-primary/40 transition-all group bg-card"
                    onClick={() => navigate(`/materials?productGroup=${group.id}${manufacturerFilter ? `&manufacturer=${manufacturerFilter}` : ""}`)}
                    data-testid={`group-${group.id}`}
                  >
                    <div className="w-1 bg-primary shrink-0" />
                    <div className="flex items-center justify-between gap-3 px-4 py-4 flex-1 min-w-0">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground leading-tight truncate">{group.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-primary transition-colors">
                          View materials →
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-primary leading-none">{group.count}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">materials</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Cost Levels ── */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Materials by Cost Level</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {activeManufacturerName ? `Filtered to ${activeManufacturerName}` : "Click a tier to browse its materials"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
              </div>
            ) : materialsByCost.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No materials with cost levels yet</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {materialsByCost.map(cost => (
                    <div
                      key={cost.level}
                      className="relative flex items-stretch border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:border-primary/40 transition-all group bg-card"
                      onClick={() => navigate(`/materials?cost=${cost.level}${manufacturerFilter ? `&manufacturer=${manufacturerFilter}` : ""}`)}
                      data-testid={`cost-level-${cost.level}`}
                    >
                      <div className="w-1 bg-primary shrink-0" />
                      <div className="flex items-center justify-between gap-3 px-4 py-4 flex-1 min-w-0">
                        <div className="min-w-0">
                          <p className={`font-bold text-sm leading-tight ${cost.colorClass}`}>{cost.display}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-primary transition-colors">
                            View materials →
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-bold text-primary leading-none">{cost.count}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">materials</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground italic mt-3 text-right">
                  Cost levels are a guideline only
                </p>
              </>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
