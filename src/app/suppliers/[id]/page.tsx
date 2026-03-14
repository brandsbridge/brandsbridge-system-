import SupplierClient from "./supplier-client";

export default async function SupplierProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupplierClient id={id} />;
}
