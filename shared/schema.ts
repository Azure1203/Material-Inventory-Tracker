import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Suppliers table (e.g., Whitewood)
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
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
  materials: many(materials),
}));

export const insertProductGroupSchema = createInsertSchema(productGroups).omit({ id: true });
export type InsertProductGroup = z.infer<typeof insertProductGroupSchema>;
export type ProductGroup = typeof productGroups.$inferSelect;

// Materials table
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  productCode: text("product_code"),
  finish: text("finish"),
  inStock: boolean("in_stock").notNull().default(true),
  costLevel: integer("cost_level").notNull().default(1), // 1 = $, 2 = $$, etc.
  supplierId: integer("supplier_id").references(() => suppliers.id),
  manufacturerId: integer("manufacturer_id").references(() => manufacturers.id),
  colorRangeId: integer("color_range_id").references(() => colorRanges.id),
  productGroupId: integer("product_group_id").references(() => productGroups.id),
  width: text("width"), // e.g., "4ft", "1220mm"
  length: text("length"), // e.g., "8ft", "2800mm"
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
  productGroup: one(productGroups, {
    fields: [materials.productGroupId],
    references: [productGroups.id],
  }),
  thicknesses: many(materialThicknesses),
}));

export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true });
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;

// Material Thicknesses table (a material can have multiple thickness options)
export const materialThicknesses = pgTable("material_thicknesses", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").notNull().references(() => materials.id, { onDelete: "cascade" }),
  thickness: text("thickness").notNull(), // e.g., "5/8\"", "3/4\"", "1\""
  inStock: boolean("in_stock").notNull().default(true),
});

export const materialThicknessesRelations = relations(materialThicknesses, ({ one }) => ({
  material: one(materials, {
    fields: [materialThicknesses.materialId],
    references: [materials.id],
  }),
}));

export const insertMaterialThicknessSchema = createInsertSchema(materialThicknesses).omit({ id: true });
export type InsertMaterialThickness = z.infer<typeof insertMaterialThicknessSchema>;
export type MaterialThickness = typeof materialThicknesses.$inferSelect;

// Schema for thickness array validation (used in material create/update)
export const thicknessInputSchema = z.object({
  thickness: z.string().min(1, "Thickness is required"),
  inStock: z.boolean().default(true),
});
export const thicknessArraySchema = z.array(thicknessInputSchema).optional();
export type ThicknessInput = z.infer<typeof thicknessInputSchema>;

// Extended material schema with thicknesses for create/update operations
export const insertMaterialWithThicknessesSchema = insertMaterialSchema.extend({
  thicknesses: thicknessArraySchema,
});
export type InsertMaterialWithThicknesses = z.infer<typeof insertMaterialWithThicknessesSchema>;

// Extended types for frontend use
export type MaterialWithRelations = Material & {
  supplier?: Supplier | null;
  manufacturer?: Manufacturer | null;
  colorRange?: ColorRange | null;
  productGroup?: ProductGroup | null;
  thicknesses: MaterialThickness[];
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
