import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { DealKanbanCard } from "./DealKanbanCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEAL_STAGES } from "@/constants/dealStages";

function KanbanColumn({ stage, deals, onSelect, isOver }) {
  const ids = deals.map((d) => d.id);
  return (
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/30 transition-colors",
        isOver && "border-primary/40 bg-primary/5"
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <span className="text-sm font-semibold text-foreground">{stage.label}</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {deals.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2.5 p-3 min-h-[120px]">
          {deals.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No deals"
              className="border-none py-8 text-xs"
            />
          ) : (
            deals.map((deal) => (
              <DealKanbanCard key={deal.id} deal={deal} onSelect={onSelect} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function DealPipeline({ deals: initialDeals = [], onMove, onSelect }) {
  const [deals, setDeals] = useState(initialDeals);
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function getDealById(id) {
    return deals.find((d) => d.id === id);
  }

  function getStageForDeal(id) {
    return deals.find((d) => d.id === id)?.stage;
  }

  function handleDragStart({ active }) {
    setActiveId(active.id);
  }

  function handleDragOver({ active, over }) {
    if (!over) { setOverId(null); return; }
    const activeStage = getStageForDeal(active.id);
    // over could be a column id (stage value) or another card id
    const overStage = getStageForDeal(over.id) ?? over.id;
    setOverId(overStage);

    if (activeStage !== overStage) {
      setDeals((prev) =>
        prev.map((d) => (d.id === active.id ? { ...d, stage: overStage } : d))
      );
    }
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null);
    setOverId(null);
    if (!over) return;

    const activeStage = getStageForDeal(active.id);
    const overStage = getStageForDeal(over.id) ?? over.id;

    if (activeStage === overStage && active.id !== over.id) {
      const stageDeals = deals.filter((d) => d.stage === activeStage);
      const oldIdx = stageDeals.findIndex((d) => d.id === active.id);
      const newIdx = stageDeals.findIndex((d) => d.id === over.id);
      const reordered = arrayMove(stageDeals, oldIdx, newIdx);
      setDeals((prev) => [
        ...prev.filter((d) => d.stage !== activeStage),
        ...reordered,
      ]);
    }

    onMove?.({ dealId: active.id, newStage: overStage });
  }

  const activeDeal = activeId ? getDealById(activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {DEAL_STAGES.map((stage) => (
          <KanbanColumn
            key={stage.value}
            stage={stage}
            deals={deals.filter((d) => d.stage === stage.value)}
            onSelect={onSelect}
            isOver={overId === stage.value}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal && (
          <div className="rotate-2 opacity-95 shadow-2xl rounded-xl border border-primary/40 bg-card p-3.5 w-72">
            <p className="text-sm font-semibold text-foreground line-clamp-2">{activeDeal.title}</p>
            {activeDeal.company && (
              <p className="mt-1 text-xs text-muted-foreground truncate">{activeDeal.company}</p>
            )}
            <p className="mt-3 text-sm font-bold text-foreground">
              {activeDeal.value ? `$${(activeDeal.value / 1000).toFixed(0)}K` : "—"}
            </p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
