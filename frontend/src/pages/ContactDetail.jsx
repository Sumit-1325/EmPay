import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Building2, Edit2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Avatar } from "@/components/common/Avatar";
import { Badge } from "@/components/common/Badge";
import { Tabs } from "@/components/common/Tabs";
import { ActivityFeed } from "@/components/crm/ActivityFeed";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { getInitials } from "@/lib/formatters";

const SAMPLE_CONTACT = {
  id: "c1",
  name: "Priya Shah",
  title: "VP of Operations",
  email: "priya@acme.com",
  phone: "+1 555-0101",
  company: "Acme Corp",
  source: "Inbound",
  avatarUrl: null,
};

const SAMPLE_ACTIVITIES = [
  { id: 1, type: "call",    title: "Intro call",         description: "Discussed pain points.", contactName: "Priya Shah", createdAt: new Date().toISOString() },
  { id: 2, type: "email",   title: "Follow-up email",    description: "Sent product brochure.", contactName: "Priya Shah", createdAt: new Date(Date.now() - 86400000).toISOString() },
];

const RELATED_DEALS = [
  { title: "Acme Corp ERP", value: "$50k", stage: "Negotiation" },
  { title: "Acme Expansion", value: "$20k", stage: "Prospecting" },
];

const TABS = [
  {
    value: "activity",
    label: "Activity",
    content: <ActivityFeed activities={SAMPLE_ACTIVITIES} />,
  },
  {
    value: "notes",
    label: "Notes",
    content: (
      <p className="text-sm text-muted-foreground italic">No notes yet. Click edit to add one.</p>
    ),
  },
];

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const contact = SAMPLE_CONTACT;

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title={contact.name}
        breadcrumbs={[
          { label: "Contacts", href: ROUTES.CONTACTS },
          { label: contact.name },
        ]}
        actions={[
          <Button key="edit" variant="outline" size="sm">
            <Edit2 size={14} /> Edit
          </Button>,
          <Button key="delete" variant="destructive" size="sm">
            <Trash2 size={14} /> Delete
          </Button>,
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <Avatar
                src={contact.avatarUrl}
                initials={getInitials(contact.name)}
                size="xl"
              />
              <div>
                <h2 className="text-xl font-bold text-foreground">{contact.name}</h2>
                {contact.title && <p className="text-sm text-muted-foreground">{contact.title}</p>}
                {contact.source && (
                  <div className="mt-1">
                    <Badge variant="muted">{contact.source}</Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-primary hover:underline">
                  <Mail size={14} /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-foreground">
                  <Phone size={14} /> {contact.phone}
                </a>
              )}
              {contact.company && (
                <span className="flex items-center gap-2 text-foreground">
                  <Building2 size={14} /> {contact.company}
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="rounded-xl border border-border bg-card p-6">
            <Tabs tabs={TABS} defaultValue="activity" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Related Deals</h3>
            {RELATED_DEALS.length === 0 ? (
              <p className="text-xs text-muted-foreground">No related deals.</p>
            ) : (
              <ul className="space-y-2">
                {RELATED_DEALS.map((deal) => (
                  <li key={deal.title} className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                    <p className="text-sm font-medium text-foreground">{deal.title}</p>
                    <div className="mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{deal.value}</span>
                      <Badge variant="outline">{deal.stage}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
