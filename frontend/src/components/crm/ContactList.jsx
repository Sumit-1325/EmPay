import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { DataTable } from "@/components/common/DataTable";
import { Avatar } from "@/components/common/Avatar";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/formatters";
import { useDebounce } from "@/hooks/useDebounce";

const COLUMNS = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    render: (val, row) => (
      <div className="flex items-center gap-3">
        <Avatar src={row.avatarUrl} initials={getInitials(val)} size="sm" />
        <span className="font-medium text-foreground">{val}</span>
      </div>
    ),
  },
  {
    key: "email",
    header: "Email",
    sortable: true,
    render: (val) => (
      <a href={`mailto:${val}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
        {val}
      </a>
    ),
  },
  { key: "company", header: "Company", sortable: true },
  {
    key: "source",
    header: "Source",
    render: (val) => val ? <Badge variant="muted">{val}</Badge> : "—",
  },
  {
    key: "phone",
    header: "Phone",
    render: (val) => val ?? "—",
  },
];

export function ContactList({ contacts = [], onSelect, onAdd }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);

  const filtered = debouncedQuery
    ? contacts.filter(
        (c) =>
          c.name?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          c.email?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          c.company?.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : contacts;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts…"
            className="h-9 w-full rounded-lg border border-border bg-muted/50 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {onAdd && (
          <Button onClick={onAdd} size="sm" className="ml-auto shrink-0">
            <Plus size={15} />
            Add Contact
          </Button>
        )}
      </div>

      <DataTable
        columns={COLUMNS}
        data={filtered}
        onRowClick={onSelect}
        selectable
        emptyTitle="No contacts found"
        emptyDescription={query ? "Try a different search term." : "Add your first contact to get started."}
      />
    </div>
  );
}
