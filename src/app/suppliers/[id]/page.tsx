import { MOCK_SUPPLIERS } from "@/lib/mock-data";
import SupplierClient from "./supplier-client";

/**
 * generateStaticParams is required for dynamic routes when using output: 'export'
 * This function must return at least one parameter to prevent build errors.
 */
export function generateStaticParams() {
  // If data is empty, return a placeholder to satisfy Next.js build requirements
  if (!MOCK_SUPPLIERS || MOCK_SUPPLIERS.length === 0) {
    return [{ id: 'default' }];
  }

  return MOCK_SUPPLIERS.map((s) => ({
    id: s.id,
  }));
}

export default async function SupplierProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupplierClient id={id} />;
}
