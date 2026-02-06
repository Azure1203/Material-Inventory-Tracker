import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSupplierSchema, insertManufacturerSchema, insertColorRangeSchema, insertProductGroupSchema, insertMaterialWithSizesSchema } from "@shared/schema";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register object storage routes for image uploads
  registerObjectStorageRoutes(app);

  // Suppliers API
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const data = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(data);
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ error: "Invalid supplier data" });
    }
  });

  app.patch("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, data);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ error: "Invalid supplier data" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSupplier(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });

  // Manufacturers API
  app.get("/api/manufacturers", async (req, res) => {
    try {
      const manufacturers = await storage.getManufacturers();
      res.json(manufacturers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch manufacturers" });
    }
  });

  app.post("/api/manufacturers", async (req, res) => {
    try {
      const data = insertManufacturerSchema.parse(req.body);
      const manufacturer = await storage.createManufacturer(data);
      res.json(manufacturer);
    } catch (error) {
      res.status(400).json({ error: "Invalid manufacturer data" });
    }
  });

  app.patch("/api/manufacturers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertManufacturerSchema.partial().parse(req.body);
      const manufacturer = await storage.updateManufacturer(id, data);
      if (!manufacturer) {
        return res.status(404).json({ error: "Manufacturer not found" });
      }
      res.json(manufacturer);
    } catch (error) {
      res.status(400).json({ error: "Invalid manufacturer data" });
    }
  });

  app.delete("/api/manufacturers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteManufacturer(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete manufacturer" });
    }
  });

  // Color Ranges API
  app.get("/api/color-ranges", async (req, res) => {
    try {
      const colorRanges = await storage.getColorRanges();
      res.json(colorRanges);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch color ranges" });
    }
  });

  app.post("/api/color-ranges", async (req, res) => {
    try {
      const data = insertColorRangeSchema.parse(req.body);
      const colorRange = await storage.createColorRange(data);
      res.json(colorRange);
    } catch (error) {
      res.status(400).json({ error: "Invalid color range data" });
    }
  });

  app.patch("/api/color-ranges/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertColorRangeSchema.partial().parse(req.body);
      const colorRange = await storage.updateColorRange(id, data);
      if (!colorRange) {
        return res.status(404).json({ error: "Color range not found" });
      }
      res.json(colorRange);
    } catch (error) {
      res.status(400).json({ error: "Invalid color range data" });
    }
  });

  app.delete("/api/color-ranges/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteColorRange(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete color range" });
    }
  });

  // Product Groups API
  app.get("/api/product-groups", async (req, res) => {
    try {
      const productGroups = await storage.getProductGroups();
      res.json(productGroups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product groups" });
    }
  });

  app.post("/api/product-groups", async (req, res) => {
    try {
      const data = insertProductGroupSchema.parse(req.body);
      const productGroup = await storage.createProductGroup(data);
      res.json(productGroup);
    } catch (error) {
      res.status(400).json({ error: "Invalid product group data" });
    }
  });

  app.patch("/api/product-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertProductGroupSchema.partial().parse(req.body);
      const productGroup = await storage.updateProductGroup(id, data);
      if (!productGroup) {
        return res.status(404).json({ error: "Product group not found" });
      }
      res.json(productGroup);
    } catch (error) {
      res.status(400).json({ error: "Invalid product group data" });
    }
  });

  app.delete("/api/product-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProductGroup(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product group" });
    }
  });

  // Materials API
  app.get("/api/materials", async (req, res) => {
    try {
      const materials = await storage.getMaterials();
      res.json(materials);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });

  app.get("/api/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json(material);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch material" });
    }
  });

  app.post("/api/materials", async (req, res) => {
    try {
      const parsed = insertMaterialWithSizesSchema.parse(req.body);
      const { sizes, productGroupIds, ...materialData } = parsed;
      const material = await storage.createMaterial(materialData, sizes, productGroupIds);
      res.json(material);
    } catch (error) {
      console.error("Create material error:", error);
      res.status(400).json({ error: "Invalid material data" });
    }
  });

  app.patch("/api/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parsed = insertMaterialWithSizesSchema.partial().parse(req.body);
      const { sizes, productGroupIds, ...materialData } = parsed;
      const material = await storage.updateMaterial(id, materialData, sizes, productGroupIds);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json(material);
    } catch (error) {
      console.error("Update material error:", error);
      res.status(400).json({ error: "Invalid material data" });
    }
  });

  app.delete("/api/materials/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMaterial(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete material" });
    }
  });

  return httpServer;
}
