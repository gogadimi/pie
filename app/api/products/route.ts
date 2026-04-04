import { NextRequest, NextResponse } from "next/server";

// -------------------------------------------------------------------
// Mock data store — replace with Drizzle + PostgreSQL when DB is live
// -------------------------------------------------------------------

interface Product {
  id: string;
  name: string;
  sku: string;
  currentPrice: string;
  costPrice: string;
  currency: string;
  category: string;
  source: "manual" | "shopify" | "stripe";
  status: "active" | "archived";
  createdAt: string;
  competitorCount: number;
  lastScraped: string;
  priceChange7d: number; // percentage
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: "a1b2c3d4",
    name: "Ergonomic Office Chair Pro",
    sku: "CHAIR-PRO-001",
    currentPrice: "459.99",
    costPrice: "220.00",
    currency: "EUR",
    category: "Furniture",
    source: "shopify",
    status: "active",
    createdAt: "2025-11-12T08:30:00Z",
    competitorCount: 5,
    lastScraped: "2026-04-04T18:00:00Z",
    priceChange7d: 2.3,
  },
  {
    id: "e5f6g7h8",
    name: "Wireless Mechanical Keyboard TKL",
    sku: "KB-WL-TKL",
    currentPrice: "129.95",
    costPrice: "62.00",
    currency: "EUR",
    category: "Electronics",
    source: "manual",
    status: "active",
    createdAt: "2025-12-03T10:15:00Z",
    competitorCount: 8,
    lastScraped: "2026-04-04T16:30:00Z",
    priceChange7d: -4.1,
  },
  {
    id: "i9j0k1l2",
    name: "Noise-Cancelling Headphones X1",
    sku: "HP-NC-X1",
    currentPrice: "249.00",
    costPrice: "110.00",
    currency: "EUR",
    category: "Electronics",
    source: "stripe",
    status: "active",
    createdAt: "2026-01-08T14:00:00Z",
    competitorCount: 12,
    lastScraped: "2026-04-04T20:15:00Z",
    priceChange7d: 0,
  },
  {
    id: "m3n4o5p6",
    name: "Standing Desk Converter",
    sku: "DESK-STD-02",
    currentPrice: "389.00",
    costPrice: "190.00",
    currency: "EUR",
    category: "Furniture",
    source: "shopify",
    status: "archived",
    createdAt: "2025-09-20T09:45:00Z",
    competitorCount: 3,
    lastScraped: "2026-03-30T12:00:00Z",
    priceChange7d: -1.2,
  },
  {
    id: "q7r8s9t0",
    name: "USB-C Docking Station 12-in-1",
    sku: "DOCK-USB12",
    currentPrice: "89.99",
    costPrice: "38.50",
    currency: "EUR",
    category: "Electronics",
    source: "manual",
    status: "active",
    createdAt: "2026-02-14T11:20:00Z",
    competitorCount: 15,
    lastScraped: "2026-04-04T22:00:00Z",
    priceChange7d: 5.8,
  },
  {
    id: "u1v2w3x4",
    name: "4K Webcam Auto-Focus",
    sku: "CAM-4K-AF",
    currentPrice: "179.00",
    costPrice: "75.00",
    currency: "EUR",
    category: "Electronics",
    source: "stripe",
    status: "active",
    createdAt: "2026-03-01T16:10:00Z",
    competitorCount: 7,
    lastScraped: "2026-04-04T14:45:00Z",
    priceChange7d: -8.6,
  },
];

// ---- GET /api/products ------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q") ?? "";
  const status = searchParams.get("status") as
    | "active"
    | "archived"
    | null;
  const category = searchParams.get("category") ?? "";

  let results = [...MOCK_PRODUCTS];

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q),
    );
  }

  if (status) {
    results = results.filter((p) => p.status === status);
  }

  if (category) {
    results = results.filter((p) => p.category === category);
  }

  return NextResponse.json({
    success: true,
    data: results,
    total: results.length,
  });
}

// ---- POST /api/products -----------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 },
      );
    }

    if (!body.currentPrice || isNaN(Number(body.currentPrice))) {
      return NextResponse.json(
        { error: "Valid price is required" },
        { status: 400 },
      );
    }

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: body.name,
      sku: body.sku || `SKU-${Date.now().toString(36).toUpperCase()}`,
      currentPrice: Number(body.currentPrice).toFixed(2),
      costPrice: body.costPrice
        ? Number(body.costPrice).toFixed(2)
        : "0.00",
      currency: body.currency ?? "EUR",
      category: body.category ?? "Uncategorized",
      source: body.source ?? "manual",
      status: "active",
      createdAt: new Date().toISOString(),
      competitorCount: 0,
      lastScraped: "",
      priceChange7d: 0,
    };

    MOCK_PRODUCTS.push(newProduct);

    return NextResponse.json(
      { success: true, data: newProduct },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }
}
