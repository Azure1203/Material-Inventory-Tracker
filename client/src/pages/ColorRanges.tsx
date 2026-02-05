import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Palette, Loader2, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { insertColorRangeSchema, type ColorRange, type Manufacturer, type InsertColorRange } from "@shared/schema";

const colorRangeFormSchema = insertColorRangeSchema.extend({
  name: z.string().min(1, "Name is required"),
});

type ColorRangeFormData = InsertColorRange;

type ColorRangeWithManufacturer = ColorRange & { manufacturer?: Manufacturer | null };

export default function ColorRanges() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingColorRange, setEditingColorRange] = useState<ColorRangeWithManufacturer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [colorRangeToDelete, setColorRangeToDelete] = useState<ColorRangeWithManufacturer | null>(null);

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: colorRanges, isLoading } = useQuery<ColorRangeWithManufacturer[]>({
    queryKey: ["/api/color-ranges"],
  });

  const { data: manufacturers } = useQuery<Manufacturer[]>({
    queryKey: ["/api/manufacturers"],
  });

  const form = useForm<ColorRangeFormData>({
    resolver: zodResolver(colorRangeFormSchema),
    defaultValues: { name: "", manufacturerId: 0 },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ColorRangeFormData) => {
      const response = await apiRequest("POST", "/api/color-ranges", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/color-ranges"] });
      toast({ title: "Color collection created successfully" });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create color collection", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ColorRangeFormData) => {
      const response = await apiRequest("PATCH", `/api/color-ranges/${editingColorRange?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/color-ranges"] });
      toast({ title: "Color collection updated successfully" });
      setDialogOpen(false);
      setEditingColorRange(null);
    },
    onError: () => {
      toast({ title: "Failed to update color collection", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/color-ranges/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/color-ranges"] });
      toast({ title: "Color collection deleted successfully" });
      setDeleteDialogOpen(false);
      setColorRangeToDelete(null);
    },
    onError: () => {
      toast({ title: "Failed to delete color collection", variant: "destructive" });
    },
  });

  const onSubmit = (data: ColorRangeFormData) => {
    if (editingColorRange) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (colorRange: ColorRangeWithManufacturer) => {
    setEditingColorRange(colorRange);
    form.setValue("name", colorRange.name);
    form.setValue("manufacturerId", colorRange.manufacturerId);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingColorRange(null);
    form.reset();
    setDialogOpen(true);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Color Collections</h1>
          <p className="text-muted-foreground">Manage manufacturer color collections</p>
        </div>
        <Button onClick={handleAddNew} data-testid="button-add-color-collection">
          <Plus className="h-4 w-4 mr-2" />
          Add Color Collection
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : colorRanges?.length === 0 ? (
            <div className="text-center py-12">
              <Palette className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
              <p className="text-muted-foreground">No color collections yet. Add your first color collection!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Materials</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colorRanges?.map(colorRange => (
                  <TableRow 
                    key={colorRange.id} 
                    data-testid={`color-range-row-${colorRange.id}`}
                    className="cursor-pointer hover-elevate"
                    onClick={() => navigate(`/materials?colorRange=${colorRange.id}`)}
                  >
                    <TableCell className="font-medium">{colorRange.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{colorRange.manufacturer?.name || "Unknown"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); navigate(`/materials?colorRange=${colorRange.id}`); }}
                        data-testid={`button-view-materials-${colorRange.id}`}
                      >
                        View Materials
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(colorRange); }} data-testid={`button-edit-${colorRange.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setColorRangeToDelete(colorRange); setDeleteDialogOpen(true); }} data-testid={`button-delete-${colorRange.id}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
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
            <DialogTitle>{editingColorRange ? "Edit Color Collection" : "Add Color Collection"}</DialogTitle>
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
                      <Input placeholder="Color collection name" {...field} data-testid="input-color-collection-name" />
                    </FormControl>
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
                    <Select value={field.value ? String(field.value) : ""} onValueChange={(val) => field.onChange(parseInt(val))}>
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
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending} data-testid="button-submit-color-range">
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingColorRange ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Color Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{colorRangeToDelete?.name}"? Materials using this color collection will no longer have a color collection assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => colorRangeToDelete && deleteMutation.mutate(colorRangeToDelete.id)}
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
