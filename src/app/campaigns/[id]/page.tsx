import { MOCK_CAMPAIGNS } from "@/lib/mock-data";
import CampaignClient from "./campaign-client";

/**
 * generateStaticParams is required for dynamic routes when using output: 'export'
 * This function must return at least one parameter to prevent build errors.
 */
export function generateStaticParams() {
  // If data is empty, return a placeholder to satisfy Next.js build requirements
  if (!MOCK_CAMPAIGNS || MOCK_CAMPAIGNS.length === 0) {
    return [{ id: 'default' }];
  }

  return MOCK_CAMPAIGNS.map((c) => ({
    id: c.id,
  }));
}

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignClient id={id} />;
}
