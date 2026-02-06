import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCostLevelDisplay, getCostLevelColor } from "@/lib/utils";
import { ExternalLink, Edit } from "lucide-react";
import type { MaterialWithRelations } from "@shared/schema";

interface MaterialDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: MaterialWithRelations | null;
  onEdit: (material: MaterialWithRelations) => void;
}

export function MaterialDetailDialog({ open, onOpenChange, material, onEdit }: MaterialDetailDialogProps) {
  if (!material) return null;

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(material);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-material-detail">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl" data-testid="text-material-title">
                {material.productCode && !material.name.startsWith(material.productCode) 
                  ? `${material.productCode} - ${material.name}` 
                  : material.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-material-subtitle">
                {material.colorRange?.name || ""}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleEdit} data-testid="button-edit-from-detail">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {material.imageUrl && (
            <div className="flex justify-center">
              <img 
                src={material.imageUrl} 
                alt={material.name}
                className="max-h-48 rounded-lg border object-contain"
                data-testid="img-material"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <DetailItem label="Product Code" value={material.productCode} testId="text-product-code" />
            <DetailItem label="Name" value={material.name} testId="text-name" />
            <DetailItem 
              label="Cost Level" 
              value={
                <span className={`font-semibold ${getCostLevelColor(material.costLevel)}`}>
                  {getCostLevelDisplay(material.costLevel)}
                </span>
              }
              testId="text-cost-level"
            />
            <DetailItem 
              label="Stock Type" 
              value={
                <Badge variant={material.inStock ? "default" : "secondary"} data-testid="badge-stock-type">
                  {material.inStock ? "Stock Item" : "Non-Stock (Special Order)"}
                </Badge>
              }
              testId="text-stock-type"
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <DetailItem label="Manufacturer" value={material.manufacturer?.name} testId="text-manufacturer" />
            <DetailItem label="Supplier" value={material.supplier?.name} testId="text-supplier" />
            <DetailItem label="Color Collection" value={material.colorRange?.name} testId="text-color-collection" />
            <DetailItem label="Product Group" value={material.productGroup?.name} testId="text-product-group" />
          </div>

          {material.sizes && material.sizes.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Size Options</h4>
                <div className="flex flex-wrap gap-2" data-testid="container-sizes">
                  {material.sizes.map(s => (
                    <Badge key={s.id} variant="secondary" className="text-sm py-1 px-3" data-testid={`badge-size-${s.id}`}>
                      {s.width} x {s.length} @ {s.thickness}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {material.websiteUrl && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Website</h4>
                <a 
                  href={material.websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm inline-flex items-center gap-1 underline"
                  data-testid="link-material-website"
                >
                  {material.websiteUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </>
          )}

          {material.notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                <p className="text-sm whitespace-pre-wrap" data-testid="text-notes">{material.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ label, value, testId }: { label: string; value: React.ReactNode; testId?: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1" data-testid={testId}>
        {value || <span className="text-muted-foreground">-</span>}
      </dd>
    </div>
  );
}
