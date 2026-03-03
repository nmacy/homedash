"use client";

import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "./ServiceCard";
import type { Category } from "@/lib/schema";

interface CategorySectionProps {
  id: string;
  category: Category;
  categoryIndex: number;
  editing: boolean;
  onEditCategory: () => void;
  onDeleteCategory: () => void;
  onAddService: () => void;
  onEditService: (serviceIndex: number) => void;
  onDeleteService: (serviceIndex: number) => void;
  onMoveService: (fromIndex: number, toIndex: number) => void;
}

export function CategorySection({
  id,
  category,
  categoryIndex,
  editing,
  onEditCategory,
  onDeleteCategory,
  onAddService,
  onEditService,
  onDeleteService,
  onMoveService,
}: CategorySectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !editing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const serviceIds = category.services.map((_, i) => `svc-${categoryIndex}-${i}`);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = serviceIds.indexOf(active.id as string);
    const to = serviceIds.indexOf(over.id as string);
    if (from !== -1 && to !== -1) onMoveService(from, to);
  }

  return (
    <section
      ref={setNodeRef}
      style={style}
      className="w-full min-w-[220px] max-w-full rounded-lg border border-flame-accent/20 p-3 sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)]"
    >
      <div className="mb-2 flex items-center gap-1.5">
        {editing && (
          <button
            className="shrink-0 cursor-grab touch-none text-foreground/30 hover:text-foreground/60"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
        <h2 className="text-sm font-normal uppercase tracking-wide text-flame-accent">
          {category.name}
        </h2>
        {editing && (
          <div className="ml-auto flex gap-0.5">
            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-40 hover:opacity-100" onClick={onEditCategory}>
              <Pencil className="h-2.5 w-2.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive opacity-40 hover:opacity-100" onClick={onDeleteCategory}>
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          </div>
        )}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={serviceIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-0">
            {category.services.map((service, serviceIndex) => (
              <ServiceCard
                key={serviceIds[serviceIndex]}
                id={serviceIds[serviceIndex]}
                service={service}
                editing={editing}
                onEdit={() => onEditService(serviceIndex)}
                onDelete={() => onDeleteService(serviceIndex)}
              />
            ))}
            {editing && (
              <button
                onClick={onAddService}
                className="flex h-9 items-center justify-center gap-1.5 rounded border border-dashed border-flame-accent/30 px-2 text-[10px] uppercase text-flame-accent/60 transition-colors hover:bg-black/20 hover:text-flame-accent"
              >
                <Plus className="h-3 w-3" />
                Add service
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}
