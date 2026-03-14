import { MOCK_CUSTOMERS } from "@/lib/mock-data";
import CustomerClient from "./customer-client";

/**
 * generateStaticParams is required for dynamic routes when using output: 'export'
 * This function must return at least one parameter to prevent build errors.
 */
export function generateStaticParams() {
  // If data is empty, return a placeholder to satisfy Next.js build requirements
  if (MOCK_CUSTOMERS.length === 0) {
    return [{ id: 'placeholder' }];
  }
  
  return MOCK_CUSTOMERS.map((c) => ({
    id: c.id,
  }));
}

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerClient id={id} />;
}
