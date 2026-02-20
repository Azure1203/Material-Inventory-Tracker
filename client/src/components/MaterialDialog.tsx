import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, X, ExternalLink, Check, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { insertMaterialWithSizesSchema, type MaterialWithRelations, type InsertMaterialWithSizes } from "@shared/schema";
import { useLookupData } from "@/hooks/use-lookup-data";
import { useState, useEffect } from "react";
import { useUpload } from "@/hooks/use-upload";

const materialFormSchema = insertMaterialWithSizesSchema.extend({
  name: z.string().min(1, "Name is required"),
  costLevel: z.number().min(1).max(5).default(1),
});

type MaterialFormData = InsertMaterialWithSizes;

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: MaterialWithRelations | null;
}

export function MaterialDialog({ open, onOpenChange, material }: MaterialDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sizes, setSizes] = useState<{ width: string; length: string; thickness: string }[]>([]);
  const [selectedProductGroupIds, setSelectedProductGroupIds] = useState<number[]>([]);
  const [newWidth, setNewWidth] = useState("");
  const [newLength, setNewLength] = useState("");
  const [newThickness, setNewThickness] = useState("");

  useEffect(() => {
    if (material?.sizes) {
      setSizes(material.sizes.map(s => ({ width: s.width, length: s.length, thickness: s.thickness })));
    } else {
      setSizes([]);
    }
    setSelectedProductGroupIds(material?.productGroups?.map(pg => pg.id) || []);
    setNewWidth("");
    setNewLength("");
    setNewThickness("");
  }, [material]);

  const { uploadFile, isUploading: isUploadingImage } = useUpload({
    onSuccess: (response) => {
      form.setValue("imageUrl", response.objectPath);
      toast({ title: "Image uploaded successfully" });
    },
    onError: (error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const { suppliers, manufacturers, colorRanges, productGroups } = useLookupData();

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      name: "",
      productCode: "",
      stockStatus: "stocked",
      costLevel: 1,
      supplierId: null,
      manufacturerId: null,
      colorRangeId: null,
      storageSystemType: "",
      imageUrl: "",
      websiteUrl: "",
      notes: "",
      sizes: [],
      productGroupIds: [],
    },
  });

  useEffect(() => {
    if (material) {
      form.reset({
        name: material.name || "",
        productCode: material.productCode || "",
        stockStatus: material.stockStatus || "stocked",
        costLevel: material.costLevel || 1,
        supplierId: material.supplierId || null,
        manufacturerId: material.manufacturerId || null,
        colorRangeId: material.colorRangeId || null,
        storageSystemType: material.storageSystemType || "",
        imageUrl: material.imageUrl || "",
        websiteUrl: material.websiteUrl || "",
        notes: material.notes || "",
        sizes: [],
        productGroupIds: material.productGroups?.map(pg => pg.id) || [],
      });
    } else {
      form.reset({
        name: "",
        productCode: "",
        stockStatus: "stocked",
        costLevel: 1,
        supplierId: null,
        manufacturerId: null,
        colorRangeId: null,
        storageSystemType: "",
        imageUrl: "",
        websiteUrl: "",
        notes: "",
        sizes: [],
        productGroupIds: [],
      });
    }
  }, [material, form]);

  const createMutation = useMutation({
    mutationFn: async (data: MaterialFormData) => {
      const response = await apiRequest("POST", "/api/materials", { ...data, sizes, productGroupIds: selectedProductGroupIds });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Material created successfully" });
      onOpenChange(false);
      form.reset();
      setSizes([]);
      setSelectedProductGroupIds([]);
    },
    onError: () => {
      toast({ title: "Failed to create material", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MaterialFormData) => {
      const response = await apiRequest("PATCH", `/api/materials/${material?.id}`, { ...data, sizes, productGroupIds: selectedProductGroupIds });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Material updated successfully" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update material", variant: "destructive" });
    },
  });

  const onSubmit = (data: MaterialFormData) => {
    if (material) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const addSize = () => {
    if (newWidth.trim() && newLength.trim() && newThickness.trim()) {
      setSizes([...sizes, { 
        width: newWidth.trim(), 
        length: newLength.trim(), 
        thickness: newThickness.trim() 
      }]);
      setNewWidth("");
      setNewLength("");
      setNewThickness("");
    }
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const filteredColorRanges = colorRanges?.filter(
    cr => !form.watch("manufacturerId") || cr.manufacturerId === form.watch("manufacturerId")
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>{material ? "Edit Material" : "Add New Material"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Material name" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="productCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., L580" {...field} value={field.value || ""} data-testid="input-product-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="storageSystemType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage System Type #</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ST-100" {...field} value={field.value || ""} data-testid="input-storage-system-type" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="costLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Level</FormLabel>
                    <Select 
                      value={String(field.value)} 
                      onValueChange={(val) => field.onChange(parseInt(val))}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-cost-level">
                          <SelectValue placeholder="Select cost level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">$ (Budget)</SelectItem>
                        <SelectItem value="2">$$ (Economy)</SelectItem>
                        <SelectItem value="3">$$$ (Standard)</SelectItem>
                        <SelectItem value="4">$$$$ (Premium)</SelectItem>
                        <SelectItem value="5">$$$$$ (Luxury)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select 
                      value={field.value ? String(field.value) : "none"} 
                      onValueChange={(val) => field.onChange(val === "none" ? null : parseInt(val))}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-supplier">
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {suppliers?.map(s => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="manufacturerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer</FormLabel>
                    <Select 
                      value={field.value ? String(field.value) : "none"} 
                      onValueChange={(val) => {
                        field.onChange(val === "none" ? null : parseInt(val));
                        form.setValue("colorRangeId", null);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-manufacturer">
                          <SelectValue placeholder="Select manufacturer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {manufacturers?.map(m => (
                          <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="colorRangeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color Collection</FormLabel>
                    <Select 
                      value={field.value ? String(field.value) : "none"} 
                      onValueChange={(val) => field.onChange(val === "none" ? null : parseInt(val))}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-color-collection">
                          <SelectValue placeholder="Select color collection" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {filteredColorRanges?.map(cr => (
                          <SelectItem key={cr.id} value={String(cr.id)}>{cr.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <FormLabel>Product Groups</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start font-normal mt-2"
                      data-testid="select-product-groups"
                    >
                      {selectedProductGroupIds.length === 0
                        ? "Select product groups..."
                        : `${selectedProductGroupIds.length} selected`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[240px] p-2" align="start">
                    {productGroups?.map(pg => {
                      const isSelected = selectedProductGroupIds.includes(pg.id);
                      return (
                        <button
                          key={pg.id}
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover-elevate"
                          onClick={() => {
                            setSelectedProductGroupIds(prev =>
                              isSelected
                                ? prev.filter(id => id !== pg.id)
                                : [...prev, pg.id]
                            );
                          }}
                          data-testid={`checkbox-product-group-${pg.id}`}
                        >
                          <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"}`}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <span>{pg.name}</span>
                        </button>
                      );
                    })}
                  </PopoverContent>
                </Popover>
                {selectedProductGroupIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedProductGroupIds.map(pgId => {
                      const pg = productGroups?.find(p => p.id === pgId);
                      return pg ? (
                        <Badge key={pg.id} variant="secondary" className="text-xs" data-testid={`badge-product-group-${pg.id}`}>
                          {pg.name}
                          <button
                            type="button"
                            className="ml-1"
                            onClick={() => setSelectedProductGroupIds(prev => prev.filter(id => id !== pg.id))}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <FormLabel>Size Options</FormLabel>
              <p className="text-xs text-muted-foreground">Add available size and thickness combinations (e.g., 4ft x 8ft @ 5/8")</p>
              <div className="flex gap-2">
                <Input 
                  placeholder="Width (e.g., 4ft)" 
                  value={newWidth}
                  onChange={(e) => setNewWidth(e.target.value)}
                  className="flex-1"
                  data-testid="input-new-width"
                />
                <Input 
                  placeholder="Length (e.g., 8ft)" 
                  value={newLength}
                  onChange={(e) => setNewLength(e.target.value)}
                  className="flex-1"
                  data-testid="input-new-length"
                />
                <Input 
                  placeholder='Thickness (e.g., 5/8")' 
                  value={newThickness}
                  onChange={(e) => setNewThickness(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSize())}
                  className="flex-1"
                  data-testid="input-new-thickness"
                />
                <Button type="button" variant="outline" size="icon" onClick={addSize} data-testid="button-add-size">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {sizes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {sizes.map((s, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/50"
                      data-testid={`size-${index}`}
                    >
                      <span className="text-sm font-medium">{s.width} x {s.length} @ {s.thickness}</span>
                      <button
                        type="button"
                        onClick={() => removeSize(index)}
                        className="text-muted-foreground hover:text-foreground"
                        data-testid={`remove-size-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <FormLabel>Image</FormLabel>
              <div className="flex gap-2 items-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                  className="flex-1"
                  data-testid="input-image"
                />
                {isUploadingImage && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {form.watch("imageUrl") && (
                <div className="mt-2 relative inline-block">
                  <img 
                    src={form.watch("imageUrl") || ""} 
                    alt="Material preview" 
                    className="h-20 w-20 object-cover rounded-md border"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
                        data-testid="button-color-disclaimer-form"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="end" className="w-64 p-3">
                      <p className="font-semibold text-xs mb-1">Color Notice</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Colors shown may not be an exact match. We recommend contacting your Netley Millwork Sales Rep for physical samples before making your final selection.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="https://..." {...field} value={field.value || ""} data-testid="input-website-url" />
                    </FormControl>
                    {field.value && (
                      <Button type="button" variant="outline" size="icon" asChild>
                        <a href={field.value} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." {...field} value={field.value || ""} data-testid="input-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stockStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Status</FormLabel>
                  <Select value={field.value || "stocked"} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-stock-status">
                        <SelectValue placeholder="Select stock status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="stocked">Stocked At Netley Millwork</SelectItem>
                      <SelectItem value="local_stock">Local Stock, 2-3 Week Leadtime</SelectItem>
                      <SelectItem value="non_stock">Non-Stock, 6-12 Week Leadtime</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {material ? "Update" : "Create"} Material
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
