import { 
  suppliers, materials, manufacturers, colorRanges, productGroups, materialSizes, materialProductGroups,
  type Supplier, type InsertSupplier,
  type Manufacturer, type InsertManufacturer,
  type ColorRange, type InsertColorRange,
  type ProductGroup, type InsertProductGroup,
  type Material, type InsertMaterial,
  type MaterialSize, type InsertMaterialSize,
  type MaterialWithRelations
} from "@shared/schema";
import { db } from "./db";
import { eq, inArray } from "drizzle-orm";

export interface IStorage {
  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(data: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;

  // Manufacturers
  getManufacturers(): Promise<Manufacturer[]>;
  getManufacturer(id: number): Promise<Manufacturer | undefined>;
  createManufacturer(data: InsertManufacturer): Promise<Manufacturer>;
  updateManufacturer(id: number, data: Partial<InsertManufacturer>): Promise<Manufacturer | undefined>;
  deleteManufacturer(id: number): Promise<boolean>;

  // Color Ranges
  getColorRanges(): Promise<(ColorRange & { manufacturer?: Manufacturer | null })[]>;
  getColorRange(id: number): Promise<ColorRange | undefined>;
  createColorRange(data: InsertColorRange): Promise<ColorRange>;
  updateColorRange(id: number, data: Partial<InsertColorRange>): Promise<ColorRange | undefined>;
  deleteColorRange(id: number): Promise<boolean>;

  // Product Groups
  getProductGroups(): Promise<ProductGroup[]>;
  getProductGroup(id: number): Promise<ProductGroup | undefined>;
  createProductGroup(data: InsertProductGroup): Promise<ProductGroup>;
  updateProductGroup(id: number, data: Partial<InsertProductGroup>): Promise<ProductGroup | undefined>;
  deleteProductGroup(id: number): Promise<boolean>;

  // Materials
  getMaterials(): Promise<MaterialWithRelations[]>;
  getMaterial(id: number): Promise<MaterialWithRelations | undefined>;
  createMaterial(data: InsertMaterial, sizes?: { width: string; length: string; thickness: string }[], productGroupIds?: number[]): Promise<MaterialWithRelations>;
  updateMaterial(id: number, data: Partial<InsertMaterial>, sizes?: { width: string; length: string; thickness: string }[], productGroupIds?: number[]): Promise<MaterialWithRelations | undefined>;
  deleteMaterial(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db.insert(suppliers).values(data).returning();
    return supplier;
  }

  async updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [supplier] = await db.update(suppliers).set(data).where(eq(suppliers.id, id)).returning();
    return supplier;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    await db.update(materials).set({ supplierId: null }).where(eq(materials.supplierId, id));
    await db.delete(suppliers).where(eq(suppliers.id, id));
    return true;
  }

  // Manufacturers
  async getManufacturers(): Promise<Manufacturer[]> {
    return db.select().from(manufacturers);
  }

  async getManufacturer(id: number): Promise<Manufacturer | undefined> {
    const [manufacturer] = await db.select().from(manufacturers).where(eq(manufacturers.id, id));
    return manufacturer;
  }

  async createManufacturer(data: InsertManufacturer): Promise<Manufacturer> {
    const [manufacturer] = await db.insert(manufacturers).values(data).returning();
    return manufacturer;
  }

  async updateManufacturer(id: number, data: Partial<InsertManufacturer>): Promise<Manufacturer | undefined> {
    const [manufacturer] = await db.update(manufacturers).set(data).where(eq(manufacturers.id, id)).returning();
    return manufacturer;
  }

  async deleteManufacturer(id: number): Promise<boolean> {
    const relatedColorRanges = await db.select({ id: colorRanges.id }).from(colorRanges).where(eq(colorRanges.manufacturerId, id));
    for (const cr of relatedColorRanges) {
      await db.update(materials).set({ colorRangeId: null }).where(eq(materials.colorRangeId, cr.id));
    }
    await db.update(materials).set({ manufacturerId: null }).where(eq(materials.manufacturerId, id));
    await db.delete(colorRanges).where(eq(colorRanges.manufacturerId, id));
    await db.delete(manufacturers).where(eq(manufacturers.id, id));
    return true;
  }

  // Color Ranges
  async getColorRanges(): Promise<(ColorRange & { manufacturer?: Manufacturer | null })[]> {
    const ranges = await db.select().from(colorRanges);
    const manufacturerList = await db.select().from(manufacturers);
    const manufacturerMap = new Map(manufacturerList.map(m => [m.id, m]));
    
    return ranges.map(cr => ({
      ...cr,
      manufacturer: manufacturerMap.get(cr.manufacturerId) || null
    }));
  }

  async getColorRange(id: number): Promise<ColorRange | undefined> {
    const [colorRange] = await db.select().from(colorRanges).where(eq(colorRanges.id, id));
    return colorRange;
  }

  async createColorRange(data: InsertColorRange): Promise<ColorRange> {
    const [colorRange] = await db.insert(colorRanges).values(data).returning();
    return colorRange;
  }

  async updateColorRange(id: number, data: Partial<InsertColorRange>): Promise<ColorRange | undefined> {
    const [colorRange] = await db.update(colorRanges).set(data).where(eq(colorRanges.id, id)).returning();
    return colorRange;
  }

  async deleteColorRange(id: number): Promise<boolean> {
    await db.update(materials).set({ colorRangeId: null }).where(eq(materials.colorRangeId, id));
    await db.delete(colorRanges).where(eq(colorRanges.id, id));
    return true;
  }

  // Product Groups
  async getProductGroups(): Promise<ProductGroup[]> {
    return db.select().from(productGroups);
  }

  async getProductGroup(id: number): Promise<ProductGroup | undefined> {
    const [productGroup] = await db.select().from(productGroups).where(eq(productGroups.id, id));
    return productGroup;
  }

  async createProductGroup(data: InsertProductGroup): Promise<ProductGroup> {
    const [productGroup] = await db.insert(productGroups).values(data).returning();
    return productGroup;
  }

  async updateProductGroup(id: number, data: Partial<InsertProductGroup>): Promise<ProductGroup | undefined> {
    const [productGroup] = await db.update(productGroups).set(data).where(eq(productGroups.id, id)).returning();
    return productGroup;
  }

  async deleteProductGroup(id: number): Promise<boolean> {
    await db.delete(materialProductGroups).where(eq(materialProductGroups.productGroupId, id));
    await db.delete(productGroups).where(eq(productGroups.id, id));
    return true;
  }

  // Materials
  async getMaterials(): Promise<MaterialWithRelations[]> {
    const materialList = await db.select().from(materials);
    const supplierList = await db.select().from(suppliers);
    const manufacturerList = await db.select().from(manufacturers);
    const colorRangeList = await db.select().from(colorRanges);
    const productGroupList = await db.select().from(productGroups);
    const sizeList = await db.select().from(materialSizes);
    const mpgList = await db.select().from(materialProductGroups);

    const supplierMap = new Map(supplierList.map(s => [s.id, s]));
    const manufacturerMap = new Map(manufacturerList.map(m => [m.id, m]));
    const colorRangeMap = new Map(colorRangeList.map(cr => [cr.id, cr]));
    const productGroupMap = new Map(productGroupList.map(pg => [pg.id, pg]));

    return materialList.map(m => ({
      ...m,
      supplier: m.supplierId ? supplierMap.get(m.supplierId) || null : null,
      manufacturer: m.manufacturerId ? manufacturerMap.get(m.manufacturerId) || null : null,
      colorRange: m.colorRangeId ? colorRangeMap.get(m.colorRangeId) || null : null,
      productGroups: mpgList
        .filter(mpg => mpg.materialId === m.id)
        .map(mpg => productGroupMap.get(mpg.productGroupId))
        .filter((pg): pg is NonNullable<typeof pg> => pg != null),
      sizes: sizeList.filter(s => s.materialId === m.id),
    }));
  }

  async getMaterial(id: number): Promise<MaterialWithRelations | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    if (!material) return undefined;

    const [supplier] = material.supplierId 
      ? await db.select().from(suppliers).where(eq(suppliers.id, material.supplierId))
      : [null];
    const [manufacturer] = material.manufacturerId
      ? await db.select().from(manufacturers).where(eq(manufacturers.id, material.manufacturerId))
      : [null];
    const [colorRange] = material.colorRangeId
      ? await db.select().from(colorRanges).where(eq(colorRanges.id, material.colorRangeId))
      : [null];
    const sizes = await db.select().from(materialSizes).where(eq(materialSizes.materialId, id));
    
    const mpgRows = await db.select().from(materialProductGroups).where(eq(materialProductGroups.materialId, id));
    const pgIds = mpgRows.map(r => r.productGroupId);
    const materialPGs = pgIds.length > 0
      ? await db.select().from(productGroups).where(inArray(productGroups.id, pgIds))
      : [];

    return {
      ...material,
      supplier: supplier || null,
      manufacturer: manufacturer || null,
      colorRange: colorRange || null,
      productGroups: materialPGs,
      sizes,
    };
  }

  async createMaterial(data: InsertMaterial, sizes?: { width: string; length: string; thickness: string }[], productGroupIds?: number[]): Promise<MaterialWithRelations> {
    const [material] = await db.insert(materials).values(data).returning();
    
    let createdSizes: MaterialSize[] = [];
    if (sizes && sizes.length > 0) {
      createdSizes = await db.insert(materialSizes)
        .values(sizes.map(s => ({ materialId: material.id, ...s })))
        .returning();
    }

    if (productGroupIds && productGroupIds.length > 0) {
      await db.insert(materialProductGroups)
        .values(productGroupIds.map(pgId => ({ materialId: material.id, productGroupId: pgId })));
    }

    return this.getMaterial(material.id) as Promise<MaterialWithRelations>;
  }

  async updateMaterial(id: number, data: Partial<InsertMaterial>, sizes?: { width: string; length: string; thickness: string }[], productGroupIds?: number[]): Promise<MaterialWithRelations | undefined> {
    const [material] = await db.update(materials).set(data).where(eq(materials.id, id)).returning();
    if (!material) return undefined;

    if (sizes !== undefined) {
      await db.delete(materialSizes).where(eq(materialSizes.materialId, id));
      if (sizes.length > 0) {
        await db.insert(materialSizes)
          .values(sizes.map(s => ({ materialId: id, ...s })));
      }
    }

    if (productGroupIds !== undefined) {
      await db.delete(materialProductGroups).where(eq(materialProductGroups.materialId, id));
      if (productGroupIds.length > 0) {
        await db.insert(materialProductGroups)
          .values(productGroupIds.map(pgId => ({ materialId: id, productGroupId: pgId })));
      }
    }

    return this.getMaterial(id);
  }

  async deleteMaterial(id: number): Promise<boolean> {
    await db.delete(materials).where(eq(materials.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
