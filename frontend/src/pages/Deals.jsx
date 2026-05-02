import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { DealPipeline } from "@/components/crm/DealPipeline";
import { Button } from "@/components/ui/button";

const SAMPLE_DEALS = [
  { id: "d1", title: "Acme Corp ERP",       company: "Acme Corp",   value: 50000, probability: 70, stage: "negotiation", owner: "Alice" },
  { id: "d2", title: "TechCo Platform",     company: "TechCo",      value: 80000, probability: 50, stage: "proposal",    owner: "Bob" },
  { id: "d3", title: "GlobalBiz Migration", company: "GlobalBiz",   value: 30000, probability: 90, stage: "won",         owner: "Carol" },
  { id: "d4", title: "StartupX Seed",       company: "StartupX",    value: 15000, probability: 30, stage: "prospecting", owner: "Dave" },
  { id: "d5", title: "FinTech API License", company: "FinTech Co",  value: 24000, probability: 55, stage: "qualified",   owner: "Alice" },
  { id: "d6", title: "Skynet AI Suite",     company: "Skynet AI",   value: 62000, probability: 40, stage: "proposal",    owner: "Bob" },
  { id: "d7", title: "MegaCorp Infra",      company: "MegaCorp",    value: 120000, probability: 20, stage: "prospecting", owner: "Carol" },
];

export default function Deals() {
  const [deals, setDeals] = useState(SAMPLE_DEALS);

  function handleMove({ dealId, newStage }) {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Pipeline"
        breadcrumbs={[{ label: "Pipeline" }]}
        actions={[
          <Button key="add" size="sm">
            <Plus size={15} /> Add Deal
          </Button>,
        ]}
      />
      <DealPipeline deals={deals} onMove={handleMove} />
    </div>
  );
}
