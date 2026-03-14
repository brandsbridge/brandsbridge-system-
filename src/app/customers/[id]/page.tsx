import CustomerClient from "./customer-client";

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerClient id={id} />;
}
