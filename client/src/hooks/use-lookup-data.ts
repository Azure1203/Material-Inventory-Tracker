import { useQuery } from "@tanstack/react-query";
import type { Supplier, Manufacturer, ColorRange, ProductGroup } from "@shared/schema";

interface LookupData {
  suppliers: Supplier[];
  manufacturers: Manufacturer[];
  colorRanges: (ColorRange & { manufacturer?: Manufacturer | null })[];
  productGroups: ProductGroup[];
}

export function useLookupData() {
  const { data, isLoading } = useQuery<LookupData>({
    queryKey: ["/api/lookup-data"],
  });

  return {
    suppliers: data?.suppliers,
    manufacturers: data?.manufacturers,
    colorRanges: data?.colorRanges,
    productGroups: data?.productGroups,
    isLoading,
  };
}
