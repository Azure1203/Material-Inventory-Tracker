import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, X, ExternalLink, Upload } from "lucide-react";
import { insertMaterialWithThicknessesSchema, type MaterialWithRelations, type Supplier, type Manufacturer, type ColorRange, type ProductGroup, type InsertMaterialWithThicknesses } from "@shared/schema";
import { useState } from "react";
import { useUpload } from "@/hooks/use-upload";

const materialFormSchema = insertMaterialWithThicknessesSchema.extend({
  name: z.string().min(1, "Name is required"),
  costLevel: z.number().min(1).max(5).default(1),
});

type MaterialFormData = InsertMaterialWithThicknesses;

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: MaterialWithRelations | null;
}

export function MaterialDialog({ open, onOpenChange, material }: MaterialDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [thicknesses, setThicknesses] = useState<{ thickness: string; inStock: boolean }[]>(
    material?.thicknesses?.map(t => ({ thickness: t.thickness, inStock: t.inStock })) || []
  );
  const [newThickness, setNewThickness] = useState("");

  const { uploadFile, isUploading: isUploadingImage } = useUpload({
    onSuccess: (response) => {
      form.setValue("imageUrl", response.objectPath);
      toast({ title: "Image uploaded successfully" });
    },
    onError: (error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const { data: suppliers } = useQuery<Supplier[]>({ queryKey: ["/api/suppliers"] });
  const { data: manufacturers } = useQuery<Manufacturer[]>({ queryKey: ["/api/manufacturers"] });
  const { data: colorRanges } = useQuery<ColorRange[]>({ queryKey: ["/api/color-ranges"] });
  const { data: productGroups } = useQuery<ProductGroup[]>({ queryKey: ["/api/product-groups"] });

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      name: material?.name || "",
      productCode: material?.productCode || "",
      finish: material?.finish || "",
      inStock: material?.inStock ?? true,
      costLevel: material?.costLevel || 1,
      supplierId: material?.supplierId || null,
      manufacturerId: material?.manufacturerId || null,
      colorRangeId: material?.colorRangeId || null,
      productGroupId: material?.productGroupId || null,
      width: material?.width || "",
      length: material?.length || "",
      imageUrl: material?.imageUrl || "",
      websiteUrl: material?.websiteUrl || "",
      notes: material?.notes || "",
      thicknesses: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MaterialFormData) => {
      const response = await apiRequest("POST", "/api/materials", { ...data, thicknesses });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Material created successfully" });
      onOpenChange(false);
      form.reset();
      setThicknesses([]);
    },
    onError: () => {
      toast({ title: "Failed to create material", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MaterialFormData) => {
      const response = await apiRequest("PATCH", `/api/materials/${material?.id}`, { ...data, thicknesses });
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

  const addThickness = () => {
    if (newThickness.trim()) {
      setThicknesses([...thicknesses, { thickness: newThickness.trim(), inStock: true }]);
      setNewThickness("");
    }
  };

  const removeThickness = (index: number) => {
    setThicknesses(thicknesses.filter((_, i) => i !== index));
  };

  const toggleThicknessStock = (index: number) => {
    setThicknesses(thicknesses.map((t, i) => 
      i === index ? { ...t, inStock: !t.inStock } : t
    ));
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{material ? "Edit Material" : "Add New Material"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="finish"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Finish</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Karisma Finish" {...field} value={field.value || ""} data-testid="input-finish" />
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select 
                      value={field.value ? String(field.value) : ""} 
                      onValueChange={(val) => field.onChange(val ? parseInt(val) : null)}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-supplier">
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                      value={field.value ? String(field.value) : ""} 
                      onValueChange={(val) => {
                        field.onChange(val ? parseInt(val) : null);
                        form.setValue("colorRangeId", null);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-manufacturer">
                          <SelectValue placeholder="Select manufacturer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="colorRangeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color Collection</FormLabel>
                    <Select 
                      value={field.value ? String(field.value) : ""} 
                      onValueChange={(val) => field.onChange(val ? parseInt(val) : null)}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-color-collection">
                          <SelectValue placeholder="Select color collection" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredColorRanges?.map(cr => (
                          <SelectItem key={cr.id} value={String(cr.id)}>{cr.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="productGroupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Group</FormLabel>
                    <Select 
                      value={field.value ? String(field.value) : ""} 
                      onValueChange={(val) => field.onChange(val ? parseInt(val) : null)}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-product-group">
                          <SelectValue placeholder="Select product group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productGroups?.map(pg => (
                          <SelectItem key={pg.id} value={String(pg.id)}>{pg.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Width</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 4ft or 1220mm" {...field} value={field.value || ""} data-testid="input-width" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 8ft or 2800mm" {...field} value={field.value || ""} data-testid="input-length" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Thickness Options</FormLabel>
              <div className="flex gap-2">
                <Input 
                  placeholder='e.g., 5/8"' 
                  value={newThickness}
                  onChange={(e) => setNewThickness(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addThickness())}
                  data-testid="input-new-thickness"
                />
                <Button type="button" variant="outline" size="icon" onClick={addThickness} data-testid="button-add-thickness">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {thicknesses.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {thicknesses.map((t, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${
                        t.inStock ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                      }`}
                      data-testid={`thickness-${index}`}
                    >
                      <span className="text-sm font-medium">{t.thickness}</span>
                      <button
                        type="button"
                        onClick={() => toggleThicknessStock(index)}
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          t.inStock ? "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200" : "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200"
                        }`}
                        data-testid={`toggle-thickness-${index}`}
                      >
                        {t.inStock ? "In Stock" : "Out"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeThickness(index)}
                        className="text-muted-foreground hover:text-foreground"
                        data-testid={`remove-thickness-${index}`}
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
                <div className="mt-2">
                  <img 
                    src={form.watch("imageUrl") || ""} 
                    alt="Material preview" 
                    className="h-20 w-20 object-cover rounded-md border"
                  />
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
              name="inStock"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-base">Stock Item</FormLabel>
                    <p className="text-sm text-muted-foreground">Is this a regularly stocked material? (Non-stock items are special order)</p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-stock-item"
                    />
                  </FormControl>
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
