import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Suppliers table (e.g., Whitewood)
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  logoUrl: text("logo_url"),
});

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  materials: many(materials),
}));

export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true });
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// Manufacturers table (e.g., Tafisa, Uniboard, Sublime)
export const manufacturers = pgTable("manufacturers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  websiteUrl: text("website_url"),
  logoUrl: text("logo_url"),
});

export const manufacturersRelations = relations(manufacturers, ({ many }) => ({
  colorRanges: many(colorRanges),
  materials: many(materials),
}));

export const insertManufacturerSchema = createInsertSchema(manufacturers).omit({ id: true });
export type InsertManufacturer = z.infer<typeof insertManufacturerSchema>;
export type Manufacturer = typeof manufacturers.$inferSelect;

// Color Ranges table (e.g., Karisma, Rivera, Nobella)
export const colorRanges = pgTable("color_ranges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  manufacturerId: integer("manufacturer_id").notNull().references(() => manufacturers.id),
});

export const colorRangesRelations = relations(colorRanges, ({ one, many }) => ({
  manufacturer: one(manufacturers, {
    fields: [colorRanges.manufacturerId],
    references: [manufacturers.id],
  }),
  materials: many(materials),
}));

export const insertColorRangeSchema = createInsertSchema(colorRanges).omit({ id: true });
export type InsertColorRange = z.infer<typeof insertColorRangeSchema>;
export type ColorRange = typeof colorRanges.$inferSelect;

// Product Groups table (e.g., Interior Colors, Sublime Collection)
export const productGroups = pgTable("product_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const productGroupsRelations = relations(productGroups, ({ many }) => ({
  materialProductGroups: many(materialProductGroups),
}));

export const insertProductGroupSchema = createInsertSchema(productGroups).omit({ id: true });
export type InsertProductGroup = z.infer<typeof insertProductGroupSchema>;
export type ProductGroup = typeof productGroups.$inferSelect;

// Materials table
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  productCode: text("product_code"),
  inStock: boolean("in_stock").notNull().default(true),
  costLevel: integer("cost_level").notNull().default(1), // 1 = $, 2 = $$, etc.
  supplierId: integer("supplier_id").references(() => suppliers.id),
  manufacturerId: integer("manufacturer_id").references(() => manufacturers.id),
  colorRangeId: integer("color_range_id").references(() => colorRanges.id),
  imageUrl: text("image_url"),
  websiteUrl: text("website_url"),
  notes: text("notes"),
});

export const materialsRelations = relations(materials, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [materials.supplierId],
    references: [suppliers.id],
  }),
  manufacturer: one(manufacturers, {
    fields: [materials.manufacturerId],
    references: [manufacturers.id],
  }),
  colorRange: one(colorRanges, {
    fields: [materials.colorRangeId],
    references: [colorRanges.id],
  }),
  materialProductGroups: many(materialProductGroups),
  sizes: many(materialSizes),
}));

export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true });
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;

// Material Sizes table (a material can have multiple size/thickness combinations)
export const materialSizes = pgTable("material_sizes", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  width: text("width").notNull(), // e.g., "4ft", "1220mm"
  length: text("length").notNull(), // e.g., "8ft", "2800mm"
  thickness: text("thickness").notNull(), // e.g., "5/8\"", "3/4\"", "1\""
});

export const materialSizesRelations = relations(materialSizes, ({ one }) => ({
  material: one(materials, {
    fields: [materialSizes.materialId],
    references: [materials.id],
  }),
}));

export const insertMaterialSizeSchema = createInsertSchema(materialSizes).omit({ id: true });
export type InsertMaterialSize = z.infer<typeof insertMaterialSizeSchema>;
export type MaterialSize = typeof materialSizes.$inferSelect;

// Material-ProductGroup junction table (many-to-many)
export const materialProductGroups = pgTable("material_product_groups", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  productGroupId: integer("product_group_id").notNull().references(() => productGroups.id, { onDelete: "cascade" }),
});

export const materialProductGroupsRelations = relations(materialProductGroups, ({ one }) => ({
  material: one(materials, {
    fields: [materialProductGroups.materialId],
    references: [materials.id],
  }),
  productGroup: one(productGroups, {
    fields: [materialProductGroups.productGroupId],
    references: [productGroups.id],
  }),
}));

export type MaterialProductGroup = typeof materialProductGroups.$inferSelect;

// Schema for size array validation (used in material create/update)
export const sizeInputSchema = z.object({
  width: z.string().min(1, "Width is required"),
  length: z.string().min(1, "Length is required"),
  thickness: z.string().min(1, "Thickness is required"),
});
export const sizeArraySchema = z.array(sizeInputSchema).optional();
export type SizeInput = z.infer<typeof sizeInputSchema>;

// Extended material schema with sizes and product group IDs for create/update operations
export const insertMaterialWithSizesSchema = insertMaterialSchema.extend({
  sizes: sizeArraySchema,
  productGroupIds: z.array(z.number()).optional(),
});
export type InsertMaterialWithSizes = z.infer<typeof insertMaterialWithSizesSchema>;

// Extended types for frontend use
export type MaterialWithRelations = Material & {
  supplier?: Supplier | null;
  manufacturer?: Manufacturer | null;
  colorRange?: ColorRange | null;
  productGroups: ProductGroup[];
  sizes: MaterialSize[];
};

// Users table (kept for potential future auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
