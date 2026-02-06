import { useState, useMemo, useEffect } from "react";
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
import { getCostLevelDisplay, getCostLevelColor } from "@/lib/utils";
import { MaterialDialog } from "@/components/MaterialDialog";
import { MaterialDetailDialog } from "@/components/MaterialDetailDialog";
import { Plus, Search, Edit, Trash2, ExternalLink, Package, Filter, X } from "lucide-react";
import type { MaterialWithRelations, Supplier, Manufacturer, ProductGroup } from "@shared/schema";

export default function Materials() {
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);

  const [searchQuery, setSearchQuery] = useState("");
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

  const { data: materials, isLoading } = useQuery<MaterialWithRelations[]>({
    queryKey: ["/api/materials"],
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: manufacturers } = useQuery<Manufacturer[]>({
    queryKey: ["/api/manufacturers"],
  });

  const { data: productGroups } = useQuery<ProductGroup[]>({
    queryKey: ["/api/product-groups"],
  });

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
        material.manufacturer?.name.toLowerCase().includes(searchLower) ||
        material.supplier?.name.toLowerCase().includes(searchLower) ||
        material.colorRange?.name.toLowerCase().includes(searchLower);

      const matchesStock = stockFilter === "all" ||
        (stockFilter === "stock" && material.inStock) ||
        (stockFilter === "non-stock" && !material.inStock);

      const matchesSupplier = supplierFilter === "all" || material.supplierId === parseInt(supplierFilter);
      const matchesManufacturer = manufacturerFilter === "all" || material.manufacturerId === parseInt(manufacturerFilter);
      const matchesProductGroup = productGroupFilter === "all" || material.productGroupId === parseInt(productGroupFilter);
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
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Materials</h1>
          <p className="text-muted-foreground">Manage your material inventory</p>
        </div>
        <Button onClick={handleAddNew} data-testid="button-add-material">
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row gap-4">
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
            <div className="flex flex-wrap gap-2">
              <Select value={stockFilter} onValueChange={(val) => setStockFilter(val as typeof stockFilter)}>
                <SelectTrigger className="w-[140px]" data-testid="filter-stock">
                  <SelectValue placeholder="Stock type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Materials</SelectItem>
                  <SelectItem value="stock">Stock Items</SelectItem>
                  <SelectItem value="non-stock">Non-Stock</SelectItem>
                </SelectContent>
              </Select>

              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="w-[140px]" data-testid="filter-supplier">
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
                <SelectTrigger className="w-[160px]" data-testid="filter-manufacturer">
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
                <SelectTrigger className="w-[160px]" data-testid="filter-product-group">
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
                <SelectTrigger className="w-[120px]" data-testid="filter-cost">
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
                <Button variant="ghost" size="icon" onClick={clearFilters} data-testid="button-clear-filters">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
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
            <div className="overflow-x-auto">
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
                    <TableHead className="w-[100px]">Actions</TableHead>
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
                          <img 
                            src={material.imageUrl} 
                            alt={material.name}
                            className="h-10 w-10 rounded-md object-cover border"
                          />
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
                            {[material.productCode, material.colorRange?.name].filter(Boolean).join(" • ")}
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
                          {material.inStock ? "Stock" : "Non-Stock"}
                        </Badge>
                      </TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
        onEdit={handleEditFromDetail}
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
