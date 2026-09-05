import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { normaliseName } from "@/lib/ingredients";
import type { Ingredient } from "@/types";

type WoolworthsProduct = {
  search_term?: string;
  name?: string;
  price?: number;
  package_size?: string | null;
  image_url?: string | null;
  url?: string | null;
};

const parsePackageSize = (value: string | null | undefined) => {
  const match = value?.match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml|x)\b/i);
  if (!match) return { size: 1, unit: "x" };

  return {
    size: Number(match[1]),
    unit: match[2].toLowerCase(),
  };
};

const loadProducts = async (): Promise<WoolworthsProduct[]> => {
  const filePath = path.join(process.cwd(), "output", "products.json");
  const contents = await readFile(filePath, "utf8");
  const products: unknown = JSON.parse(contents);

  if (!Array.isArray(products)) {
    throw new Error("Woolworths product catalogue must be an array");
  }

  return products as WoolworthsProduct[];
};

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const ingredients =
      typeof body === "object" && body !== null && "ingredients" in body
        ? body.ingredients
        : null;

    if (!Array.isArray(ingredients)) {
      return NextResponse.json(
        { error: "ingredients must be an array" },
        { status: 400 },
      );
    }

    const products = await loadProducts();
    const productBySearchTerm = new Map<string, WoolworthsProduct>();

    for (const product of products) {
      if (!product.search_term || !product.name) continue;
      const key = normaliseName(product.search_term);
      if (!productBySearchTerm.has(key)) {
        productBySearchTerm.set(key, product);
      }
    }

    const resolvedIngredients = (ingredients as Ingredient[]).map(
      (ingredient) => {
        const product = productBySearchTerm.get(normaliseName(ingredient.name));
        if (!product) return ingredient;
        const packageSize = parsePackageSize(product.package_size);

        return {
          ...ingredient,
          productName: product.name,
          productImageUrl: product.image_url ?? null,
          productUrl: product.url ?? null,
          productPackageSize: packageSize.size,
          productPackageUnit: packageSize.unit,
          productPrice: product.price ?? 0,
        };
      },
    );

    return NextResponse.json({ ingredients: resolvedIngredients });
  } catch {
    return NextResponse.json(
      { error: "Unable to resolve Woolworths products" },
      { status: 500 },
    );
  }
}
