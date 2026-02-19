import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { thumbUrl } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Building2, Loader2, ArrowRight, Upload, X, ImageIcon, MapPin, Phone, Mail } from "lucide-react";
import { useLocation } from "wouter";
import { insertSupplierSchema, type Supplier, type InsertSupplier } from "@shared/schema";
import { useAdminAuth } from "@/lib/adminAuth";
import { useUpload } from "@/hooks/use-upload";

const supplierFormSchema = insertSupplierSchema.extend({
  name: insertSupplierSchema.shape.name.min(1, "Name is required"),
});

type SupplierFormData = InsertSupplier;

export default function Suppliers() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAdminAuth();

  const { data: suppliers, isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: { name: "", logoUrl: "", address: "", phone: "", contactEmail: "" },
  });

  const { uploadFile, isUploading: isUploadingLogo } = useUpload({
    onSuccess: (response) => {
      form.setValue("logoUrl", response.objectPath);
      toast({ title: "Logo uploaded successfully" });
    },
    onError: (error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
    e.target.value = "";
  };

  const createMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const response = await apiRequest("POST", "/api/suppliers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lookup-data"] });
      toast({ title: "Supplier created successfully" });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create supplier", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const response = await apiRequest("PATCH", `/api/suppliers/${editingSupplier?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lookup-data"] });
      toast({ title: "Supplier updated successfully" });
      setDialogOpen(false);
      setEditingSupplier(null);
    },
    onError: () => {
      toast({ title: "Failed to update supplier", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lookup-data"] });
      toast({ title: "Supplier deleted successfully" });
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    },
    onError: () => {
      toast({ title: "Failed to delete supplier", variant: "destructive" });
    },
  });

  const onSubmit = (data: SupplierFormData) => {
    if (editingSupplier) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.setValue("name", supplier.name);
    form.setValue("logoUrl", supplier.logoUrl || "");
    form.setValue("address", supplier.address || "");
    form.setValue("phone", supplier.phone || "");
    form.setValue("contactEmail", supplier.contactEmail || "");
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingSupplier(null);
    form.reset();
    setDialogOpen(true);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const currentLogoUrl = form.watch("logoUrl");

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Suppliers</h1>
          <p className="text-sm text-muted-foreground">Manage your material suppliers/distributors</p>
        </div>
        {isAdmin && (
          <Button onClick={handleAddNew} data-testid="button-add-supplier">
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : suppliers?.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
              <p className="text-muted-foreground">No suppliers yet. Add your first supplier!</p>
            </div>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Logo</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Materials</TableHead>
                      {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers?.map(supplier => (
                      <TableRow 
                        key={supplier.id} 
                        data-testid={`supplier-row-${supplier.id}`}
                        className="cursor-pointer hover-elevate"
                        onClick={() => navigate(`/materials?supplier=${supplier.id}`)}
                      >
                        <TableCell>
                          {supplier.logoUrl ? (
                            <img
                              src={thumbUrl(supplier.logoUrl, 64)}
                              alt={`${supplier.name} logo`}
                              className="h-8 w-8 rounded-md object-contain bg-muted"
                              data-testid={`img-supplier-logo-${supplier.id}`}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{supplier.name}</div>
                          {supplier.address && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5" data-testid={`text-supplier-address-${supplier.id}`}>
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[200px]">{supplier.address}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {supplier.phone && (
                              <div className="flex items-center gap-1 text-sm" data-testid={`text-supplier-phone-${supplier.id}`}>
                                <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                                <a href={`tel:${supplier.phone}`} className="hover:underline" onClick={(e) => e.stopPropagation()} data-testid={`link-supplier-phone-${supplier.id}`}>{supplier.phone}</a>
                              </div>
                            )}
                            {supplier.contactEmail && (
                              <div className="flex items-center gap-1 text-sm" data-testid={`text-supplier-email-${supplier.id}`}>
                                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                                <a href={`mailto:${supplier.contactEmail}`} className="hover:underline" onClick={(e) => e.stopPropagation()} data-testid={`link-supplier-email-${supplier.id}`}>{supplier.contactEmail}</a>
                              </div>
                            )}
                            {!supplier.phone && !supplier.contactEmail && (
                              <span className="text-xs text-muted-foreground">--</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); navigate(`/materials?supplier=${supplier.id}`); }}
                            data-testid={`button-view-materials-${supplier.id}`}
                          >
                            View Materials
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(supplier); }} data-testid={`button-edit-${supplier.id}`}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSupplierToDelete(supplier); setDeleteDialogOpen(true); }} data-testid={`button-delete-${supplier.id}`}>
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
              <div className="sm:hidden divide-y">
                {suppliers?.map(supplier => (
                  <div
                    key={supplier.id}
                    data-testid={`supplier-card-${supplier.id}`}
                    className="p-3 cursor-pointer hover-elevate"
                    onClick={() => navigate(`/materials?supplier=${supplier.id}`)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {supplier.logoUrl ? (
                          <img
                            src={thumbUrl(supplier.logoUrl, 64)}
                            alt={`${supplier.name} logo`}
                            className="h-7 w-7 rounded-md object-contain bg-muted shrink-0"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        )}
                        <p className="font-medium text-sm">{supplier.name}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                    {(supplier.address || supplier.phone || supplier.contactEmail) && (
                      <div className="mt-1.5 ml-9 space-y-0.5">
                        {supplier.address && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{supplier.address}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            <a href={`tel:${supplier.phone}`} className="hover:underline" onClick={(e) => e.stopPropagation()} data-testid={`link-supplier-phone-mobile-${supplier.id}`}>{supplier.phone}</a>
                          </div>
                        )}
                        {supplier.contactEmail && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            <a href={`mailto:${supplier.contactEmail}`} className="hover:underline" onClick={(e) => e.stopPropagation()} data-testid={`link-supplier-email-mobile-${supplier.id}`}>{supplier.contactEmail}</a>
                          </div>
                        )}
                      </div>
                    )}
                    {isAdmin && (
                      <div className="flex gap-1 mt-2">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(supplier); }} data-testid={`button-edit-mobile-${supplier.id}`}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSupplierToDelete(supplier); setDeleteDialogOpen(true); }} data-testid={`button-delete-mobile-${supplier.id}`}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Supplier name" {...field} data-testid="input-supplier-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <FormLabel>Logo</FormLabel>
                <div className="mt-1.5">
                  {currentLogoUrl ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={currentLogoUrl}
                        alt="Logo preview"
                        className="h-16 w-16 rounded-md object-contain bg-muted border"
                        data-testid="img-supplier-logo-preview"
                      />
                      <div className="flex flex-col gap-1">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoFileChange}
                            disabled={isUploadingLogo}
                            data-testid="input-supplier-logo-change"
                          />
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span>
                              {isUploadingLogo ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
                              Change
                            </span>
                          </Button>
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => form.setValue("logoUrl", "")}
                          data-testid="button-remove-supplier-logo"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoFileChange}
                        disabled={isUploadingLogo}
                        data-testid="input-supplier-logo-upload"
                      />
                      <div className="flex items-center gap-2 p-3 border border-dashed rounded-md text-sm text-muted-foreground">
                        {isUploadingLogo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                        <span>{isUploadingLogo ? "Uploading..." : "Click to upload logo"}</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, City, Province" {...field} value={field.value || ""} data-testid="input-supplier-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} value={field.value || ""} data-testid="input-supplier-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@supplier.com" {...field} value={field.value || ""} data-testid="input-supplier-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending} data-testid="button-submit-supplier">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingSupplier ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{supplierToDelete?.name}"? Materials using this supplier will no longer have a supplier assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => supplierToDelete && deleteMutation.mutate(supplierToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
