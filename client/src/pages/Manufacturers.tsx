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
import { Plus, Edit, Trash2, Factory, Loader2, ExternalLink, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { insertManufacturerSchema, type Manufacturer, type InsertManufacturer } from "@shared/schema";
import { useAdminAuth } from "@/lib/adminAuth";

const manufacturerFormSchema = insertManufacturerSchema.extend({
  name: insertManufacturerSchema.shape.name.min(1, "Name is required"),
});

type ManufacturerFormData = InsertManufacturer;

export default function Manufacturers() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [manufacturerToDelete, setManufacturerToDelete] = useState<Manufacturer | null>(null);

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAdminAuth();

  const { data: manufacturers, isLoading } = useQuery<Manufacturer[]>({
    queryKey: ["/api/manufacturers"],
  });

  const form = useForm<ManufacturerFormData>({
    resolver: zodResolver(manufacturerFormSchema),
    defaultValues: { name: "", websiteUrl: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ManufacturerFormData) => {
      const response = await apiRequest("POST", "/api/manufacturers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturers"] });
      toast({ title: "Manufacturer created successfully" });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create manufacturer", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ManufacturerFormData) => {
      const response = await apiRequest("PATCH", `/api/manufacturers/${editingManufacturer?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturers"] });
      toast({ title: "Manufacturer updated successfully" });
      setDialogOpen(false);
      setEditingManufacturer(null);
    },
    onError: () => {
      toast({ title: "Failed to update manufacturer", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/manufacturers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/manufacturers"] });
      toast({ title: "Manufacturer deleted successfully" });
      setDeleteDialogOpen(false);
      setManufacturerToDelete(null);
    },
    onError: () => {
      toast({ title: "Failed to delete manufacturer", variant: "destructive" });
    },
  });

  const onSubmit = (data: ManufacturerFormData) => {
    if (editingManufacturer) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (manufacturer: Manufacturer) => {
    setEditingManufacturer(manufacturer);
    form.setValue("name", manufacturer.name);
    form.setValue("websiteUrl", manufacturer.websiteUrl || "");
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingManufacturer(null);
    form.reset();
    setDialogOpen(true);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manufacturers</h1>
          <p className="text-muted-foreground">Manage material manufacturers</p>
        </div>
        {isAdmin && (
          <Button onClick={handleAddNew} data-testid="button-add-manufacturer">
            <Plus className="h-4 w-4 mr-2" />
            Add Manufacturer
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
          ) : manufacturers?.length === 0 ? (
            <div className="text-center py-12">
              <Factory className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
              <p className="text-muted-foreground">No manufacturers yet. Add your first manufacturer!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Materials</TableHead>
                  {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {manufacturers?.map(manufacturer => (
                  <TableRow 
                    key={manufacturer.id} 
                    data-testid={`manufacturer-row-${manufacturer.id}`}
                    className="cursor-pointer hover-elevate"
                    onClick={() => navigate(`/materials?manufacturer=${manufacturer.id}`)}
                  >
                    <TableCell className="font-medium">{manufacturer.name}</TableCell>
                    <TableCell>
                      {manufacturer.websiteUrl ? (
                        <a
                          href={manufacturer.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Visit
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); navigate(`/materials?manufacturer=${manufacturer.id}`); }}
                        data-testid={`button-view-materials-${manufacturer.id}`}
                      >
                        View Materials
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(manufacturer); }} data-testid={`button-edit-${manufacturer.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setManufacturerToDelete(manufacturer); setDeleteDialogOpen(true); }} data-testid={`button-delete-${manufacturer.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingManufacturer ? "Edit Manufacturer" : "Add Manufacturer"}</DialogTitle>
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
                      <Input placeholder="Manufacturer name" {...field} data-testid="input-manufacturer-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} value={field.value || ""} data-testid="input-manufacturer-website" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending} data-testid="button-submit-manufacturer">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingManufacturer ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Manufacturer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{manufacturerToDelete?.name}"? This will also remove associated color collections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => manufacturerToDelete && deleteMutation.mutate(manufacturerToDelete.id)}
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
