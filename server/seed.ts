import { db } from "./db";
import { suppliers, manufacturers, colorRanges, productGroups, materials, materialThicknesses } from "@shared/schema";

export async function seedDatabase() {
  // Check if data already exists
  const existingMaterials = await db.select().from(materials);
  if (existingMaterials.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database with initial data...");

  // Create suppliers
  const [whitewood] = await db.insert(suppliers).values([
    { name: "Whitewood" },
  ]).returning();

  // Create manufacturers
  const [tafisa, uniboard, sublime] = await db.insert(manufacturers).values([
    { name: "Tafisa", websiteUrl: "https://www.tafisa.ca" },
    { name: "Uniboard", websiteUrl: "https://www.uniboard.com" },
    { name: "Sublime", websiteUrl: "https://www.sublimepanels.com" },
  ]).returning();

  // Create color ranges
  const colorRangeData = await db.insert(colorRanges).values([
    { name: "Karisma", manufacturerId: tafisa.id },
    { name: "Dolomite", manufacturerId: tafisa.id },
    { name: "Rivera", manufacturerId: uniboard.id },
    { name: "Nobella", manufacturerId: uniboard.id },
    { name: "Aura", manufacturerId: uniboard.id },
    { name: "Omnia", manufacturerId: uniboard.id },
    { name: "Supermat", manufacturerId: sublime.id },
    { name: "High Gloss", manufacturerId: sublime.id },
    { name: "Matte", manufacturerId: sublime.id },
  ]).returning();

  const [karisma, dolomite, rivera, nobella, aura, omnia, supermat, highGloss, matte] = colorRangeData;

  // Create product groups
  const [interiorColors, sublimeCollection, uniboardCollection, tafisaCollection, supermatColors] = await db.insert(productGroups).values([
    { name: "Interior Colors (5/8\")" },
    { name: "Sublime Collection (4x9)" },
    { name: "Uniboard Collection (4x8)" },
    { name: "Tafisa Collection (4x8)" },
    { name: "Super Mat Colors" },
  ]).returning();

  // Create materials from PDF data
  const materialData = [
    // Interior Colors - 5/8"
    { name: "Classic White", productCode: "300", finish: "Dolomite Standard Finish", inStock: true, costLevel: 1, supplierId: whitewood.id, manufacturerId: uniboard.id, productGroupId: interiorColors.id, width: "4ft", length: "8ft" },
    { name: "Classic Maple", productCode: "290", finish: "Dolomite Standard Finish", inStock: true, costLevel: 2, supplierId: whitewood.id, manufacturerId: uniboard.id, productGroupId: interiorColors.id, width: "4ft", length: "8ft" },
    { name: "Black", productCode: "L203", finish: "Dolomite Finish", inStock: true, costLevel: 2, supplierId: whitewood.id, manufacturerId: tafisa.id, colorRangeId: dolomite.id, productGroupId: interiorColors.id, width: "4ft", length: "8ft" },
    { name: "Willow Grey", productCode: "802SM", finish: "Supermat Finish Only", inStock: true, costLevel: 3, supplierId: whitewood.id, manufacturerId: uniboard.id, productGroupId: interiorColors.id, width: "4ft", length: "8ft" },
    { name: "Free Spirit", productCode: "L580", finish: "Karisma Finish", inStock: true, costLevel: 3, supplierId: whitewood.id, manufacturerId: tafisa.id, colorRangeId: karisma.id, productGroupId: interiorColors.id, width: "4ft", length: "8ft" },
    { name: "Canadian Grey", productCode: "168SM", finish: "Supermat Finish", inStock: true, costLevel: 3, supplierId: whitewood.id, manufacturerId: uniboard.id, productGroupId: interiorColors.id, width: "4ft", length: "8ft" },
    { name: "The Chameleon", productCode: "L584", finish: "Karisma Finish", inStock: true, costLevel: 3, supplierId: whitewood.id, manufacturerId: tafisa.id, colorRangeId: karisma.id, productGroupId: interiorColors.id, width: "4ft", length: "8ft" },
    { name: "First Class", productCode: "L583", finish: "Karisma Finish", inStock: true, costLevel: 3, supplierId: whitewood.id, manufacturerId: tafisa.id, colorRangeId: karisma.id, productGroupId: interiorColors.id, width: "4ft", length: "8ft" },
    { name: "Eclipse", productCode: "K90", finish: "Dolomite Finish", inStock: true, costLevel: 4, supplierId: whitewood.id, manufacturerId: uniboard.id, productGroupId: interiorColors.id, width: "4ft", length: "8ft" },
    
    // Sublime Collection - Group 1
    { name: "White High Gloss", productCode: "P601", finish: "One Sided Standard", inStock: true, costLevel: 1, manufacturerId: sublime.id, colorRangeId: highGloss.id, productGroupId: sublimeCollection.id, width: "1220mm", length: "2800mm" },
    { name: "White Matte", productCode: "P734", finish: "One Sided Standard", inStock: true, costLevel: 1, manufacturerId: sublime.id, colorRangeId: matte.id, productGroupId: sublimeCollection.id, width: "1220mm", length: "2800mm" },
    
    // Sublime Collection - Group 2
    { name: "Fume High Gloss", productCode: "P625", finish: "Two Sided", inStock: true, costLevel: 2, manufacturerId: sublime.id, colorRangeId: highGloss.id, productGroupId: sublimeCollection.id, width: "1220mm", length: "2800mm" },
    { name: "Fume Matte", productCode: "P725", finish: "Two Sided", inStock: true, costLevel: 2, manufacturerId: sublime.id, colorRangeId: matte.id, productGroupId: sublimeCollection.id, width: "1220mm", length: "2800mm" },
    { name: "Black Matte", productCode: "P706", finish: "Two Sided", inStock: true, costLevel: 2, manufacturerId: sublime.id, colorRangeId: matte.id, productGroupId: sublimeCollection.id, width: "1220mm", length: "2800mm" },
    { name: "Black High Gloss", productCode: "P6002", finish: "Two Sided", inStock: true, costLevel: 2, manufacturerId: sublime.id, colorRangeId: highGloss.id, productGroupId: sublimeCollection.id, width: "1220mm", length: "2800mm" },
    
    // Sublime Collection - Group 3
    { name: "Magnolia Matte", productCode: "P763", finish: "Two Sided", inStock: true, costLevel: 3, manufacturerId: sublime.id, colorRangeId: matte.id, productGroupId: sublimeCollection.id, width: "1220mm", length: "2800mm" },
    { name: "Blue Notte Matte", productCode: "P771", finish: "Two Sided", inStock: true, costLevel: 3, manufacturerId: sublime.id, colorRangeId: matte.id, productGroupId: sublimeCollection.id, width: "1220mm", length: "2800mm" },
    { name: "Arctic Grey Matte", productCode: "P713", finish: "Two Sided", inStock: true, costLevel: 3, manufacturerId: sublime.id, colorRangeId: matte.id, productGroupId: sublimeCollection.id, width: "1220mm", length: "2800mm" },
    
    // Sublime Collection - Group 4 (Supermat)
    { name: "Pearl Black Supermat", productCode: "3010", finish: "Two Sided Supermat", inStock: true, costLevel: 4, manufacturerId: sublime.id, colorRangeId: supermat.id, productGroupId: sublimeCollection.id, width: "1220mm", length: "2800mm" },
    { name: "Snow White Supermat", productCode: "3012", finish: "Two Sided Supermat", inStock: true, costLevel: 4, manufacturerId: sublime.id, colorRangeId: supermat.id, productGroupId: sublimeCollection.id, width: "1220mm", length: "2800mm" },
    { name: "London Blues Supermat", productCode: "3011", finish: "Two Sided Supermat", inStock: true, costLevel: 4, manufacturerId: sublime.id, colorRangeId: supermat.id, productGroupId: sublimeCollection.id, width: "1220mm", length: "2800mm" },
    { name: "Forest Green Supermat", productCode: "3027", finish: "Two Sided Supermat", inStock: true, costLevel: 4, manufacturerId: sublime.id, colorRangeId: supermat.id, productGroupId: sublimeCollection.id, width: "1220mm", length: "2800mm" },
    
    // Uniboard Collection
    { name: "Classic Maple", productCode: "290", finish: "Dolomite Finish", inStock: true, costLevel: 2, supplierId: whitewood.id, manufacturerId: uniboard.id, productGroupId: uniboardCollection.id, width: "4ft", length: "8ft" },
    { name: "Canvas", productCode: "K21", finish: "Calico Finish", inStock: true, costLevel: 3, supplierId: whitewood.id, manufacturerId: uniboard.id, productGroupId: uniboardCollection.id, width: "4ft", length: "8ft" },
    { name: "Canadian Gray", productCode: "168", finish: "Dolomite Finish", inStock: true, costLevel: 2, supplierId: whitewood.id, manufacturerId: uniboard.id, productGroupId: uniboardCollection.id, width: "4ft", length: "8ft" },
    { name: "Charcoal", productCode: "123", finish: "Dolomite Finish", inStock: true, costLevel: 2, supplierId: whitewood.id, manufacturerId: uniboard.id, productGroupId: uniboardCollection.id, width: "4ft", length: "8ft" },
    { name: "Classic Black", productCode: "631", finish: "Dolomite Finish", inStock: true, costLevel: 2, supplierId: whitewood.id, manufacturerId: uniboard.id, productGroupId: uniboardCollection.id, width: "4ft", length: "8ft" },
    { name: "Skye", productCode: "H54", finish: "Brushed Elm Finish", inStock: true, costLevel: 3, supplierId: whitewood.id, manufacturerId: uniboard.id, productGroupId: uniboardCollection.id, width: "4ft", length: "8ft" },
    { name: "Nizza", productCode: "K13", finish: "Rivera Finish", inStock: true, costLevel: 3, supplierId: whitewood.id, manufacturerId: uniboard.id, colorRangeId: rivera.id, productGroupId: uniboardCollection.id, width: "4ft", length: "8ft" },
    { name: "Mistral", productCode: "K14", finish: "Rivera Finish", inStock: true, costLevel: 3, supplierId: whitewood.id, manufacturerId: uniboard.id, colorRangeId: rivera.id, productGroupId: uniboardCollection.id, width: "4ft", length: "8ft" },
    { name: "Cannes", productCode: "K15", finish: "Rivera Finish", inStock: true, costLevel: 3, supplierId: whitewood.id, manufacturerId: uniboard.id, colorRangeId: rivera.id, productGroupId: uniboardCollection.id, width: "4ft", length: "8ft" },
    { name: "Chiffon", productCode: "K60", finish: "Nobella Finish", inStock: true, costLevel: 4, supplierId: whitewood.id, manufacturerId: uniboard.id, colorRangeId: nobella.id, productGroupId: uniboardCollection.id, width: "4ft", length: "8ft" },
    { name: "Silk", productCode: "K61", finish: "Nobella Finish", inStock: true, costLevel: 4, supplierId: whitewood.id, manufacturerId: uniboard.id, colorRangeId: nobella.id, productGroupId: uniboardCollection.id, width: "4ft", length: "8ft" },
    { name: "Feather White", productCode: "K62", finish: "Nobella Finish", inStock: true, costLevel: 4, supplierId: whitewood.id, manufacturerId: uniboard.id, colorRangeId: nobella.id, productGroupId: uniboardCollection.id, width: "4ft", length: "8ft" },
    
    // Super Mat Colors
    { name: "Willow Grey Super Mat", productCode: "802", finish: "Super Mat Finish", inStock: true, costLevel: 1, manufacturerId: uniboard.id, productGroupId: supermatColors.id, width: "1550mm", length: "2770mm" },
    { name: "Sunset Grey Super Mat", productCode: "805", finish: "Super Mat Finish", inStock: true, costLevel: 1, manufacturerId: uniboard.id, productGroupId: supermatColors.id, width: "1550mm", length: "2770mm" },
    { name: "Arctic White Super Mat", productCode: "505", finish: "Super Mat Finish", inStock: true, costLevel: 1, manufacturerId: uniboard.id, productGroupId: supermatColors.id, width: "1550mm", length: "2770mm" },
    { name: "Canadian Grey Super Mat", productCode: "168", finish: "Super Mat Finish", inStock: true, costLevel: 1, manufacturerId: uniboard.id, productGroupId: supermatColors.id, width: "1550mm", length: "2770mm" },
    { name: "Nova Black Super Mat", productCode: "888", finish: "Super Mat Finish", inStock: false, costLevel: 3, manufacturerId: uniboard.id, productGroupId: supermatColors.id, width: "1550mm", length: "2770mm" },
    { name: "Sage Super Mat", productCode: "K79", finish: "Super Mat Finish", inStock: true, costLevel: 4, manufacturerId: uniboard.id, productGroupId: supermatColors.id, width: "1550mm", length: "2770mm" },
  ];

  const createdMaterials = await db.insert(materials).values(materialData).returning();

  // Add thickness variations for some materials
  const thicknessData = createdMaterials.slice(0, 15).flatMap(m => [
    { materialId: m.id, thickness: '5/8"' },
    { materialId: m.id, thickness: '3/4"' },
  ]);

  // Add 1" thickness to some materials
  thicknessData.push(
    ...createdMaterials.slice(0, 5).map(m => ({ materialId: m.id, thickness: '1"' }))
  );

  await db.insert(materialThicknesses).values(thicknessData);

  console.log(`Seeded ${createdMaterials.length} materials with thicknesses`);
}
