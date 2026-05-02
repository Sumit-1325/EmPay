import { Mail, Phone, Building2 } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { Badge } from "@/components/common/Badge";
import { getInitials } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export function ContactCard({ contact, onSelect, className }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(contact)}
      className={cn(
        "w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all duration-200",
        "hover:scale-[1.02] hover:shadow-md hover:border-border/80",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar
          src={contact.avatarUrl}
          initials={getInitials(contact.name)}
          size="md"
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{contact.name}</p>
          {contact.title && (
            <p className="truncate text-xs text-muted-foreground">{contact.title}</p>
          )}
          {contact.source && (
            <div className="mt-1">
              <Badge variant="muted">{contact.source}</Badge>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        {contact.email && (
          <div className="flex items-center gap-2 truncate">
            <Mail size={12} className="shrink-0" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-2">
            <Phone size={12} className="shrink-0" />
            <span>{contact.phone}</span>
          </div>
        )}
        {contact.company && (
          <div className="flex items-center gap-2 truncate">
            <Building2 size={12} className="shrink-0" />
            <span className="truncate">{contact.company}</span>
          </div>
        )}
      </div>
    </button>
  );
}
