import { ActivityItem } from "./ActivityItem";
import { EmptyState } from "@/components/common/EmptyState";
import { Activity } from "lucide-react";
import { formatDate } from "@/lib/formatters";

function groupByDate(activities) {
  const groups = new Map();
  for (const activity of activities) {
    const day = formatDate(activity.createdAt);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day).push(activity);
  }
  return groups;
}

function dayLabel(dateStr) {
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return dateStr;
}

export function ActivityFeed({ activities = [], onSelect }) {
  if (activities.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No activities yet"
        description="Activities like calls, emails, and meetings will appear here."
      />
    );
  }

  const groups = groupByDate(activities);

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([date, items]) => (
        <div key={date}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {dayLabel(date)}
          </p>
          <div>
            {items.map((activity, i) => (
              <ActivityItem
                key={activity.id ?? i}
                activity={activity}
                onSelect={onSelect}
                isLast={i === items.length - 1}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
