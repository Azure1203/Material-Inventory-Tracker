import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getCostLevelDisplay, getCostLevelColor } from "@/lib/utils";
import { ExternalLink, Edit, X, Info } from "lucide-react";
import type { MaterialWithRelations } from "@shared/schema";

interface MaterialDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: MaterialWithRelations | null;
  onEdit?: (material: MaterialWithRelations) => void;
}

function DetailImage({ src, alt, onClick }: { src: string; alt: string; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  if (error) return null;

  return (
    <div className="flex justify-center">
      <div className="max-h-48 rounded-lg border overflow-hidden bg-muted inline-flex relative">
        {!loaded && <Skeleton className="h-48 w-48 rounded-lg" />}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy"
          className={`max-h-48 rounded-lg object-contain cursor-pointer transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onClick={onClick}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          data-testid="img-material"
        />
      </div>
    </div>
  );
}

export function MaterialDetailDialog({ open, onOpenChange, material, onEdit }: MaterialDetailDialogProps) {
  const [showLightbox, setShowLightbox] = useState(false);

  const closeLightbox = useCallback(() => setShowLightbox(false), []);

  useEffect(() => {
    if (!showLightbox) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showLightbox, closeLightbox]);

  if (!material) return null;

  const handleEdit = () => {
    if (!onEdit) return;
    onOpenChange(false);
    onEdit(material);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full" data-testid="dialog-material-detail">
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
            {onEdit && (
              <Button variant="outline" size="sm" onClick={handleEdit} data-testid="button-edit-from-detail">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {material.imageUrl && (
            <DetailImage
              src={material.imageUrl}
              alt={material.name}
              onClick={() => setShowLightbox(true)}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <DetailItem label="Product Code" value={material.productCode} testId="text-product-code" />
            <DetailItem label="Name" value={material.name} testId="text-name" />
            <DetailItem 
              label="Cost Level" 
              value={
                <div>
                  <span className={`font-semibold ${getCostLevelColor(material.costLevel)}`}>
                    {getCostLevelDisplay(material.costLevel)}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground" data-testid="notice-cost-guideline-detail">
                    <Info className="h-3 w-3 shrink-0" />
                    <span>Cost category is meant to serve as a guideline only.</span>
                  </div>
                </div>
              }
              testId="text-cost-level"
            />
            <DetailItem 
              label="Stock Type" 
              value={
                <Badge variant={material.inStock ? "default" : "secondary"} data-testid="badge-stock-type">
                  {material.inStock ? "Stock Item" : "Non-Stock, 6-12 Week Leadtime"}
                </Badge>
              }
              testId="text-stock-type"
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <DetailItem label="Manufacturer" value={material.manufacturer?.name} testId="text-manufacturer" />
            <DetailItem label="Supplier" value={material.supplier?.name} testId="text-supplier" />
            <DetailItem label="Color Collection" value={material.colorRange?.name} testId="text-color-collection" />
            <DetailItem 
              label="Product Groups" 
              value={
                material.productGroups && material.productGroups.length > 0
                  ? <div className="flex flex-wrap gap-1" data-testid="container-product-groups">
                      {material.productGroups.map(pg => (
                        <Badge key={pg.id} variant="secondary" className="text-xs" data-testid={`badge-product-group-${pg.id}`}>
                          {pg.name}
                        </Badge>
                      ))}
                    </div>
                  : null
              }
              testId="text-product-group" 
            />
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

    {showLightbox && material.imageUrl && (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
        onClick={() => setShowLightbox(false)}
        data-testid="lightbox-overlay"
      >
        <button
          className="absolute top-4 right-4 z-[101] flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-white text-sm font-medium transition-colors hover:bg-white/30 active:bg-white/40"
          onClick={(e) => { e.stopPropagation(); setShowLightbox(false); }}
          data-testid="button-close-lightbox"
        >
          <X className="h-5 w-5" />
          Close
        </button>
        <p className="absolute bottom-6 left-0 right-0 text-center text-white/60 text-sm pointer-events-none">
          Tap anywhere to close
        </p>
        <img 
          src={material.imageUrl} 
          alt={material.name}
          className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
          data-testid="img-material-fullsize"
        />
      </div>
    )}
    </>
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
