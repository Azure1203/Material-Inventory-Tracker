import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Search, Edit, Trash2, ExternalLink, Package, Filter, X, Info } from "lucide-react";
import type { MaterialWithRelations } from "@shared/schema";
import { useAdminAuth } from "@/lib/adminAuth";

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

export default function Materials() {
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);

  const [searchQuery, setSearchQuery] = useState(urlParams.get("search") || "");
  const [stockFilter, setStockFilter] = useState<"all" | "stock" | "non-stock">("all");
  const [supplierFilter, setSupplierFilter] = useState<string>(urlParams.get("supplier") || "all");
  const [manufacturerFilter, setManufacturerFilter] = useState<string>(urlParams.get("manufacturer") || "all");
  const [productGroupFilter, setProductGroupFilter] = useState<string>(urlParams.get("productGroup") || "all");
  const [costFilter, setCostFilter] = useState<string>(urlParams.get("cost") || "all");
  const [colorRangeFilter, setColorRangeFilter] = useState<string>(urlParams.get("colorRange") || "all");

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

      const matchesStock = stockFilter === "all" ||
        (stockFilter === "stock" && material.inStock) ||
        (stockFilter === "non-stock" && !material.inStock);

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

  const hasFilters = searchQuery || stockFilter !== "all" || supplierFilter !== "all" || manufacturerFilter !== "all" || productGroupFilter !== "all" || costFilter !== "all" || colorRangeFilter !== "all";

  const handleEdit = (material: MaterialWithRelations) => {
    setEditingMaterial(material);
    setDialogOpen(true);
  };

  const handleDelete = (material: MaterialWithRelations) => {
    setMaterialToDelete(material);
    setDeleteDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingMaterial(null);
    setDialogOpen(true);
  };

  const handleRowClick = (material: MaterialWithRelations) => {
    setViewingMaterial(material);
    setDetailDialogOpen(true);
  };

  const handleEditFromDetail = (material: MaterialWithRelations) => {
    setEditingMaterial(material);
    setDialogOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Materials</h1>
          <p className="text-sm text-muted-foreground">Manage your material inventory</p>
        </div>
        {isAdmin && (
          <Button onClick={handleAddNew} data-testid="button-add-material">
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-md border px-3 sm:px-4 py-2 text-xs sm:text-sm text-muted-foreground" data-testid="notice-cost-guideline">
        <Info className="h-4 w-4 shrink-0" />
        <span>Cost category is meant to serve as a guideline only.</span>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-6 pb-3">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              <Select value={stockFilter} onValueChange={(val) => setStockFilter(val as typeof stockFilter)}>
                <SelectTrigger className="w-full sm:w-[140px]" data-testid="filter-stock">
                  <SelectValue placeholder="Stock type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Materials</SelectItem>
                  <SelectItem value="stock">Stock Items</SelectItem>
                  <SelectItem value="non-stock">Non-Stock, 6-12 Week Leadtime</SelectItem>
                </SelectContent>
              </Select>

              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="w-full sm:w-[140px]" data-testid="filter-supplier">
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
                <SelectTrigger className="w-full sm:w-[160px]" data-testid="filter-manufacturer">
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
                <SelectTrigger className="w-full sm:w-[160px]" data-testid="filter-product-group">
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
                <SelectTrigger className="w-full sm:w-[120px]" data-testid="filter-cost">
                  <SelectValue placeholder="Cost" />
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

              {hasFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters} className="col-span-1" data-testid="button-clear-filters">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 sm:p-6 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
              <p className="text-muted-foreground">
                {materials?.length === 0 ? "No materials yet. Add your first material!" : "No materials match your filters"}
              </p>
              {hasFilters && (
                <Button variant="ghost" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                    {filteredMaterials.map(material => (
                      <TableRow 
                        key={material.id} 
                        data-testid={`material-row-${material.id}`}
                        className="cursor-pointer hover-elevate"
                        onClick={() => handleRowClick(material)}
                      >
                        <TableCell>
                          {material.imageUrl ? (
                            <LazyImage src={material.imageUrl} alt={material.name} sizeClass="h-10 w-10" />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
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
                                  data-testid={`link-website-${material.id}`}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {[material.productCode, material.colorRange?.name, material.storageSystemType ? `Type: ${material.storageSystemType}` : null].filter(Boolean).join(" • ")}
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
                                <Badge 
                                  key={s.id} 
                                  variant="secondary"
                                  className="text-xs"
                                >
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
                          <Badge variant={material.inStock ? "default" : "secondary"}>
                            {material.inStock ? "Stock" : "Non-Stock, 6-12 Week Leadtime"}
                          </Badge>
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

              <div className="md:hidden divide-y">
                {filteredMaterials.map(material => (
                  <div
                    key={material.id}
                    data-testid={`material-card-${material.id}`}
                    className="p-3 cursor-pointer hover-elevate"
                    onClick={() => handleRowClick(material)}
                  >
                    <div className="flex gap-3">
                      {material.imageUrl ? (
                        <LazyImage src={material.imageUrl} alt={material.name} sizeClass="h-12 w-12" className="shrink-0" />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {material.productCode && !material.name.startsWith(material.productCode) 
                                ? `${material.productCode} ${material.name}` 
                                : material.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {[material.manufacturer?.name, material.supplier?.name, material.storageSystemType ? `Type: ${material.storageSystemType}` : null].filter(Boolean).join(" / ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className={`font-semibold text-xs ${getCostLevelColor(material.costLevel)}`}>
                              {getCostLevelDisplay(material.costLevel)}
                            </span>
                            <Badge variant={material.inStock ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                              {material.inStock ? "Stock" : "Non-Stock, 6-12 Week Leadtime"}
                            </Badge>
                          </div>
                        </div>
                        {material.sizes?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {material.sizes.map(s => (
                              <Badge key={s.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {s.width} x {s.length} @ {s.thickness}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex justify-end gap-1 mt-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); handleEdit(material); }}
                          data-testid={`button-edit-mobile-${material.id}`}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); handleDelete(material); }}
                          data-testid={`button-delete-mobile-${material.id}`}
                        >
                          <Trash2 className="h-3 w-3 mr-1 text-destructive" />
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
