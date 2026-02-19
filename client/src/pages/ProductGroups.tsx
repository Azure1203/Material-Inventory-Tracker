import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Plus, Edit, Trash2, Layers, Loader2 } from "lucide-react";
import { insertProductGroupSchema, type ProductGroup, type InsertProductGroup } from "@shared/schema";
import { useAdminAuth } from "@/lib/adminAuth";

const productGroupFormSchema = insertProductGroupSchema.extend({
  name: insertProductGroupSchema.shape.name.min(1, "Name is required"),
});

type ProductGroupFormData = InsertProductGroup;

export default function ProductGroups() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProductGroup, setEditingProductGroup] = useState<ProductGroup | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productGroupToDelete, setProductGroupToDelete] = useState<ProductGroup | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAdminAuth();

  const { data: productGroups, isLoading } = useQuery<ProductGroup[]>({
    queryKey: ["/api/product-groups"],
  });

  const form = useForm<ProductGroupFormData>({
    resolver: zodResolver(productGroupFormSchema),
    defaultValues: { name: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductGroupFormData) => {
      const response = await apiRequest("POST", "/api/product-groups", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lookup-data"] });
      toast({ title: "Product group created successfully" });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create product group", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProductGroupFormData) => {
      const response = await apiRequest("PATCH", `/api/product-groups/${editingProductGroup?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lookup-data"] });
      toast({ title: "Product group updated successfully" });
      setDialogOpen(false);
      setEditingProductGroup(null);
    },
    onError: () => {
      toast({ title: "Failed to update product group", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/product-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lookup-data"] });
      toast({ title: "Product group deleted successfully" });
      setDeleteDialogOpen(false);
      setProductGroupToDelete(null);
    },
    onError: () => {
      toast({ title: "Failed to delete product group", variant: "destructive" });
    },
  });

  const onSubmit = (data: ProductGroupFormData) => {
    if (editingProductGroup) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (productGroup: ProductGroup) => {
    setEditingProductGroup(productGroup);
    form.setValue("name", productGroup.name);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingProductGroup(null);
    form.reset();
    setDialogOpen(true);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Product Groups</h1>
          <p className="text-sm text-muted-foreground">Manage product group categories</p>
        </div>
        {isAdmin && (
          <Button onClick={handleAddNew} data-testid="button-add-product-group">
            <Plus className="h-4 w-4 mr-2" />
            Add Product Group
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
          ) : productGroups?.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
              <p className="text-muted-foreground">No product groups yet. Add your first product group!</p>
            </div>
          ) : (
            <>
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productGroups?.map(productGroup => (
                      <TableRow key={productGroup.id} data-testid={`product-group-row-${productGroup.id}`}>
                        <TableCell className="font-medium">{productGroup.name}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(productGroup)} data-testid={`button-edit-${productGroup.id}`}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => { setProductGroupToDelete(productGroup); setDeleteDialogOpen(true); }} data-testid={`button-delete-${productGroup.id}`}>
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
                {productGroups?.map(productGroup => (
                  <div key={productGroup.id} data-testid={`product-group-card-${productGroup.id}`} className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">{productGroup.name}</p>
                      {isAdmin && (
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(productGroup)} data-testid={`button-edit-mobile-${productGroup.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setProductGroupToDelete(productGroup); setDeleteDialogOpen(true); }} data-testid={`button-delete-mobile-${productGroup.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
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
            <DialogTitle>{editingProductGroup ? "Edit Product Group" : "Add Product Group"}</DialogTitle>
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
                      <Input placeholder="Product group name" {...field} data-testid="input-product-group-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending} data-testid="button-submit-product-group">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingProductGroup ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productGroupToDelete?.name}"? Materials using this product group will no longer have a product group assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => productGroupToDelete && deleteMutation.mutate(productGroupToDelete.id)}
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
