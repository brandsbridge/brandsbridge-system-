import { MOCK_CUSTOMERS } from "@/lib/mock-data";
import CustomerClient from "./customer-client";

/**
 * generateStaticParams is required for dynamic routes when using output: 'export'
 * This function must remain in a Server Component file.
 */
export function generateStaticParams() {
  return MOCK_CUSTOMERS.map((c) => ({
    id: c.id,
  }));
}

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerClient id={id} />;
}
