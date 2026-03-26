export const dynamic = 'force-dynamic';

import InvoiceClient from "./invoice-client";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvoiceClient id={id} />;
}
