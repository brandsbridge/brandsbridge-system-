import { MOCK_SUPPLIERS } from "@/lib/mock-data";
import SupplierClient from "./supplier-client";

/**
 * generateStaticParams is required for dynamic routes when using output: 'export'
 * This function must remain in a Server Component file.
 */
export function generateStaticParams() {
  return MOCK_SUPPLIERS.map((s) => ({
    id: s.id,
  }));
}

export default async function SupplierProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupplierClient id={id} />;
}
