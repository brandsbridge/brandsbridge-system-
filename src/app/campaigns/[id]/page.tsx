import CampaignClient from "./campaign-client";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CampaignClient id={id} />;
}
