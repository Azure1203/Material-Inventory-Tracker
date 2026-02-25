import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getCostLevelDisplay, getCostLevelColor, thumbUrl } from "@/lib/utils";
import { useLookupData } from "@/hooks/use-lookup-data";
import { MaterialDialog } from "@/components/MaterialDialog";
import { MaterialDetailDialog } from "@/components/MaterialDetailDialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Plus, Search, Edit, Trash2, ExternalLink, Package,
  X, Info, Filter, CheckCircle, Clock, Truck, ChevronDown, ArrowRight
} from "lucide-react";
import { STOCK_STATUS, type MaterialWithRelations } from "@shared/schema";
import { useAdminAuth } from "@/lib/adminAuth";

function ColorDisclaimer({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${size === "sm" ? "bottom-0.5 right-0.5 h-4 w-4" : "bottom-1 right-1 h-5 w-5"} rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10`}
          data-testid="button-color-disclaimer"
        >
          <Info className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-64 p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-semibold text-xs mb-1">Color Notice</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Colors shown may not be an exact match. We recommend contacting your Netley Millwork Sales Rep for physical samples before making your final selection.
        </p>
      </PopoverContent>
    </Popover>
  );
}

function LazyImage({ src, alt, className, sizeClass, onClick }: { src: string; alt: string; className?: string; sizeClass: string; onClick?: () => void }) {
  const thumbSrc = useMemo(() => thumbUrl(src, 96), [src]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  if (error) {
    return (
      <div className={`${sizeClass} rounded-md bg-muted flex items-center justify-center`}>
        <Package className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-md border overflow-hidden bg-muted relative ${className || ""}`}>
      {!loaded && <Skeleton className={`absolute inset-0 ${sizeClass} rounded-md`} />}
      <img
        ref={imgRef}
        src={thumbSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${sizeClass} object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        onClick={onClick}
        style={onClick ? { cursor: "pointer" } : undefined}
      />
    </div>
  );
}

function StockBadge({ status }: { status: string }) {
  if (status === STOCK_STATUS.STOCKED) {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5" data-testid="badge-stock-stocked">
        <CheckCircle className="h-3 w-3 mr-1" />
        Stocked
      </Badge>
    );
  }
  if (status === STOCK_STATUS.LOCAL_STOCK) {
    return (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5" data-testid="badge-stock-local">
        <Clock className="h-3 w-3 mr-1" />
        Local Stock
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5" data-testid="badge-stock-non">
      <Truck className="h-3 w-3 mr-1" />
      Non-Stock
    </Badge>
  );
}

export default function Materials() {
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);

  const [searchQuery, setSearchQuery] = useState(urlParams.get("search") || "");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>(urlParams.get("supplier") || "all");
  const [manufacturerFilter, setManufacturerFilter] = useState<string>(urlParams.get("manufacturer") || "all");
  const [productGroupFilter, setProductGroupFilter] = useState<string>(urlParams.get("productGroup") || "all");
  const [costFilter, setCostFilter] = useState<string>(urlParams.get("cost") || "all");
  const [colorRangeFilter, setColorRangeFilter] = useState<string>(urlParams.get("colorRange") || "all");

  const hasUrlFilters = !!(urlParams.get("supplier") || urlParams.get("manufacturer") || urlParams.get("productGroup") || urlParams.get("cost") || urlParams.get("colorRange") || urlParams.get("search"));
  const [showFilters, setShowFilters] = useState(hasUrlFilters);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const pg = params.get("productGroup");
    const cost = params.get("cost");
    const supplier = params.get("supplier");
    const manufacturer = params.get("manufacturer");
    const colorRange = params.get("colorRange");
    const search = params.get("search");
    if (search) setSearchQuery(search);
    if (pg) setProductGroupFilter(pg);
    if (cost) setCostFilter(cost);
    if (supplier) setSupplierFilter(supplier);
    if (manufacturer) setManufacturerFilter(manufacturer);
    if (colorRange) setColorRangeFilter(colorRange);
  }, [searchString]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialWithRelations | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<MaterialWithRelations | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<MaterialWithRelations | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAdminAuth();

  const { data: materials, isLoading } = useQuery<MaterialWithRelations[]>({
    queryKey: ["/api/materials"],
  });

  const { suppliers, manufacturers, productGroups } = useLookupData();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/materials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Material deleted successfully" });
      setDeleteDialogOpen(false);
      setMaterialToDelete(null);
    },
    onError: () => {
      toast({ title: "Failed to delete material", variant: "destructive" });
    },
  });

  const filteredMaterials = useMemo(() => {
    if (!materials) return [];
    return materials.filter(material => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        material.name.toLowerCase().includes(searchLower) ||
        material.productCode?.toLowerCase().includes(searchLower) ||
        material.storageSystemType?.toLowerCase().includes(searchLower) ||
        material.manufacturer?.name.toLowerCase().includes(searchLower) ||
        material.supplier?.name.toLowerCase().includes(searchLower) ||
        material.colorRange?.name.toLowerCase().includes(searchLower);
      const matchesStock = stockFilter === "all" || material.stockStatus === stockFilter;
      const matchesSupplier = supplierFilter === "all" || material.supplierId === parseInt(supplierFilter);
      const matchesManufacturer = manufacturerFilter === "all" || material.manufacturerId === parseInt(manufacturerFilter);
      const matchesProductGroup = productGroupFilter === "all" || material.productGroups?.some(pg => pg.id === parseInt(productGroupFilter));
      const matchesCost = costFilter === "all" || material.costLevel === parseInt(costFilter);
      const matchesColorRange = colorRangeFilter === "all" || material.colorRangeId === parseInt(colorRangeFilter);
      return matchesSearch && matchesStock && matchesSupplier && matchesManufacturer && matchesProductGroup && matchesCost && matchesColorRange;
    });
  }, [materials, searchQuery, stockFilter, supplierFilter, manufacturerFilter, productGroupFilter, costFilter, colorRangeFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setStockFilter("all");
    setSupplierFilter("all");
    setManufacturerFilter("all");
    setProductGroupFilter("all");
    setCostFilter("all");
    setColorRangeFilter("all");
  };

  const activeFilterCount = [stockFilter, supplierFilter, manufacturerFilter, productGroupFilter, costFilter, colorRangeFilter].filter(f => f !== "all").length + (searchQuery ? 1 : 0);
  const hasFilters = activeFilterCount > 0;

  const handleEdit = (material: MaterialWithRelations) => { setEditingMaterial(material); setDialogOpen(true); };
  const handleDelete = (material: MaterialWithRelations) => { setMaterialToDelete(material); setDeleteDialogOpen(true); };
  const handleAddNew = () => { setEditingMaterial(null); setDialogOpen(true); };
  const handleRowClick = (material: MaterialWithRelations) => { setViewingMaterial(material); setDetailDialogOpen(true); };
  const handleEditFromDetail = (material: MaterialWithRelations) => { setEditingMaterial(material); setDialogOpen(true); };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5 pb-8">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight" data-testid="text-materials-title">Materials</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Browse and manage your material catalog</p>
        </div>
        {isAdmin && (
          <Button onClick={handleAddNew} className="shadow-sm shrink-0" data-testid="button-add-material">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Material</span>
          </Button>
        )}
      </div>

      {/* ── Cost Guideline Notice ── */}
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground" data-testid="notice-cost-guideline">
        <Info className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span>Cost category is meant to serve as a guideline only.</span>
      </div>

      {/* ── Search + Filter Card ── */}
      <Card className="shadow-sm">
        <CardHeader className="p-3 sm:p-5 pb-3 space-y-3">

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-11 text-sm border-2 border-transparent focus:border-primary/40 transition-colors"
              data-testid="input-search"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-clear-search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Mobile: Filter Toggle Button */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex-1 flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                hasFilters
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "border-border bg-background text-foreground"
              }`}
              data-testid="button-toggle-filters"
            >
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {hasFilters && (
                  <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`} />
            </button>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-primary/30 text-primary bg-primary/5 text-sm font-medium"
                data-testid="button-clear-filters-mobile"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Filter Dropdowns — always visible desktop, collapsible mobile */}
          <div className={`${showFilters ? "block" : "hidden"} sm:block`}>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className={`w-full sm:w-[170px] text-xs sm:text-sm ${stockFilter !== "all" ? "border-primary/40 bg-primary/5" : ""}`} data-testid="filter-stock">
                  <SelectValue placeholder="Stock type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock Types</SelectItem>
                  <SelectItem value="stocked">Stocked At Netley</SelectItem>
                  <SelectItem value="local_stock">Local Stock, 2-3 Wk</SelectItem>
                  <SelectItem value="non_stock">Non-Stock, 6-12 Wk</SelectItem>
                </SelectContent>
              </Select>

              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className={`w-full sm:w-[150px] text-xs sm:text-sm ${supplierFilter !== "all" ? "border-primary/40 bg-primary/5" : ""}`} data-testid="filter-supplier">
                  <SelectValue placeholder="Supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers?.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
                <SelectTrigger className={`w-full sm:w-[170px] text-xs sm:text-sm ${manufacturerFilter !== "all" ? "border-primary/40 bg-primary/5" : ""}`} data-testid="filter-manufacturer">
                  <SelectValue placeholder="Manufacturer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Manufacturers</SelectItem>
                  {manufacturers?.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={productGroupFilter} onValueChange={setProductGroupFilter}>
                <SelectTrigger className={`w-full sm:w-[170px] text-xs sm:text-sm ${productGroupFilter !== "all" ? "border-primary/40 bg-primary/5" : ""}`} data-testid="filter-product-group">
                  <SelectValue placeholder="Product Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {productGroups?.map(pg => (
                    <SelectItem key={pg.id} value={String(pg.id)}>{pg.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={costFilter} onValueChange={setCostFilter}>
                <SelectTrigger className={`w-full sm:w-[130px] text-xs sm:text-sm ${costFilter !== "all" ? "border-primary/40 bg-primary/5" : ""}`} data-testid="filter-cost">
                  <SelectValue placeholder="Cost Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Costs</SelectItem>
                  <SelectItem value="1">$ (Level 1)</SelectItem>
                  <SelectItem value="2">$$ (Level 2)</SelectItem>
                  <SelectItem value="3">$$$ (Level 3)</SelectItem>
                  <SelectItem value="4">$$$$ (Level 4)</SelectItem>
                  <SelectItem value="5">$$$$$ (Level 5)</SelectItem>
                </SelectContent>
              </Select>

              {/* Desktop clear button */}
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="hidden sm:flex shrink-0 border-primary/30 text-primary hover:bg-primary/10 self-center"
                  data-testid="button-clear-filters"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Clear ({activeFilterCount})
                </Button>
              )}
            </div>
          </div>

        </CardHeader>

        <CardContent className="p-0">
          {/* Count row */}
          <div className="px-3 sm:px-5 py-2 flex items-center justify-between border-t border-border/60">
            <span className="text-xs font-medium text-muted-foreground" data-testid="text-material-count">
              {isLoading ? (
                <Skeleton className="h-4 w-32 inline-block" />
              ) : (
                <>Showing <span className="font-semibold text-foreground">{filteredMaterials.length}</span> of {materials?.length || 0} materials</>
              )}
            </span>
            {hasFilters && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
                <Filter className="h-3 w-3" />
                {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
              </span>
            )}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="p-4 sm:p-6 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                {materials?.length === 0 ? "No materials yet" : "No materials match your filters"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {materials?.length === 0 ? "Add your first material to get started." : "Try adjusting your search or filter criteria."}
              </p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters} className="mt-4" data-testid="button-clear-filters-empty">
                  <X className="h-4 w-4 mr-2" />
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* ── Desktop Table ── */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-[50px]">Image</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Size Options</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Type</TableHead>
                      {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.map((material, index) => (
                      <TableRow
                        key={material.id}
                        data-testid={`material-row-${material.id}`}
                        className={`cursor-pointer transition-colors hover:bg-primary/5 ${index % 2 === 0 ? "bg-transparent" : "bg-muted/20"}`}
                        onClick={() => handleRowClick(material)}
                      >
                        <TableCell>
                          <div className="relative" style={{ width: "fit-content" }}>
                            {material.imageUrl ? (
                              <LazyImage src={material.imageUrl} alt={material.name} sizeClass="h-10 w-10" />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <ColorDisclaimer />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {material.productCode && !material.name.startsWith(material.productCode)
                                  ? `${material.productCode} ${material.name}`
                                  : material.name}
                              </span>
                              {material.websiteUrl && (
                                <a
                                  href={material.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary"
                                  onClick={(e) => e.stopPropagation()}
                                  data-testid={`link-website-${material.id}`}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {[material.productCode, material.colorRange?.name, material.storageSystemType ? `Type: ${material.storageSystemType}` : null].filter(Boolean).join(" · ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{material.manufacturer?.name || "-"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{material.supplier?.name || "-"}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {material.sizes?.length > 0 ? (
                              material.sizes.map(s => (
                                <Badge key={s.id} variant="secondary" className="text-xs">
                                  {s.width} x {s.length} @ {s.thickness}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${getCostLevelColor(material.costLevel)}`}>
                            {getCostLevelDisplay(material.costLevel)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StockBadge status={material.stockStatus} />
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); handleEdit(material); }}
                                data-testid={`button-edit-${material.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); handleDelete(material); }}
                                data-testid={`button-delete-${material.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ── Mobile Cards ── */}
              <div className="md:hidden p-3 space-y-2.5">
                {filteredMaterials.map(material => (
                  <div
                    key={material.id}
                    data-testid={`material-card-${material.id}`}
                    className="rounded-xl border border-border bg-card shadow-sm cursor-pointer active:scale-[0.99] transition-all hover:shadow-md hover:border-primary/30 border-l-[3px] border-l-primary overflow-hidden"
                    onClick={() => handleRowClick(material)}
                  >
                    <div className="p-3 flex gap-3">
                      {/* Thumbnail */}
                      <div className="relative shrink-0">
                        {material.imageUrl ? (
                          <LazyImage src={material.imageUrl} alt={material.name} sizeClass="h-16 w-16" className="rounded-lg" />
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <ColorDisclaimer size="md" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {/* Name + cost */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm leading-tight truncate">
                            {material.productCode && !material.name.startsWith(material.productCode)
                              ? `${material.productCode} ${material.name}`
                              : material.name}
                          </p>
                          <span className={`font-bold text-xs shrink-0 ${getCostLevelColor(material.costLevel)}`}>
                            {getCostLevelDisplay(material.costLevel)}
                          </span>
                        </div>

                        {/* Manufacturer / Supplier */}
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {[material.manufacturer?.name, material.supplier?.name].filter(Boolean).join(" · ")}
                          {material.colorRange?.name && (
                            <span className="text-muted-foreground/70"> · {material.colorRange.name}</span>
                          )}
                        </p>

                        {/* Stock badge + arrow */}
                        <div className="flex items-center justify-between mt-2">
                          <StockBadge status={material.stockStatus} />
                          <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                        </div>

                        {/* Size badges */}
                        {material.sizes?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {material.sizes.map(s => (
                              <Badge key={s.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {s.width} × {s.length} @ {s.thickness}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admin actions inside card */}
                    {isAdmin && (
                      <div className="flex justify-end gap-1 px-3 pb-2 border-t border-border/50 pt-2 mt-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => { e.stopPropagation(); handleEdit(material); }}
                          data-testid={`button-edit-mobile-${material.id}`}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDelete(material); }}
                          data-testid={`button-delete-mobile-${material.id}`}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <MaterialDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        material={editingMaterial}
      />

      <MaterialDetailDialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open);
          if (!open) setViewingMaterial(null);
        }}
        material={viewingMaterial}
        onEdit={isAdmin ? handleEditFromDetail : undefined}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{materialToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => materialToDelete && deleteMutation.mutate(materialToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
