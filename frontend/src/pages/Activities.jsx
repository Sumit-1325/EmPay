import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ActivityFeed } from "@/components/crm/ActivityFeed";
import { Button } from "@/components/ui/button";

const TYPES = ["All", "Call", "Email", "Meeting", "Note", "Deal"];

const SAMPLE_ACTIVITIES = [
  { id: 1,  type: "call",    title: "Intro call with Priya",        description: "Discussed pain points and Q2 goals.",       contactName: "Priya Shah",  createdAt: new Date().toISOString() },
  { id: 2,  type: "email",   title: "Proposal sent to Acme Corp",   description: "Sent updated pricing proposal (v3).",        contactName: "Acme Corp",   createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 3,  type: "meeting", title: "Product demo — TechCo",        description: "Walkthrough of the new analytics dashboard.", contactName: "TechCo",      createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 4,  type: "note",    title: "Note on GlobalBiz deal",       description: "CFO wants ROI projections by Friday.",       contactName: "GlobalBiz",   createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 5,  type: "deal",    title: "Stage changed: Negotiation",   description: "TechCo deal moved from Proposal to Negotiation.", contactName: "TechCo", createdAt: new Date(Date.now() - 90000000).toISOString() },
  { id: 6,  type: "call",    title: "Follow-up call — StartupX",    description: "Budget confirmed, awaiting legal approval.",  contactName: "StartupX",   createdAt: new Date(Date.now() - 172800000).toISOString() },
];

export default function Activities() {
  const [activeType, setActiveType] = useState("All");

  const filtered = activeType === "All"
    ? SAMPLE_ACTIVITIES
    : SAMPLE_ACTIVITIES.filter((a) => a.type === activeType.toLowerCase());

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Activities"
        breadcrumbs={[{ label: "Activities" }]}
        actions={[
          <Button key="add" size="sm">
            <Plus size={15} /> Log Activity
          </Button>,
        ]}
      />

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeType === type
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="max-w-2xl">
        <ActivityFeed activities={filtered} />
      </div>
    </div>
  );
}
