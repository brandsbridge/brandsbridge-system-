
import { MOCK_CAMPAIGNS } from "@/lib/mock-data";
import CampaignClient from "./campaign-client";

export function generateStaticParams() {
  return MOCK_CAMPAIGNS.map((c) => ({
    id: c.id,
  }));
}

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignClient id={id} />;
}
