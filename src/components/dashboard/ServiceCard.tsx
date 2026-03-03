"use client";

import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/components/DynamicIcon";
import type { Service } from "@/lib/schema";

interface ServiceCardProps {
  id: string;
  service: Service;
  editing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function ServiceCard({ id, service, editing, onEdit, onDelete }: ServiceCardProps) {
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

  const inner = (
    <>
      {editing && (
        <button
          className="shrink-0 cursor-grab touch-none text-foreground/30 hover:text-foreground/60"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3 w-3" />
        </button>
      )}
      <div className="flex h-6 w-6 shrink-0 items-center justify-center text-foreground">
        <DynamicIcon name={service.icon} className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1 truncate uppercase">
        <div className="truncate text-xs font-medium leading-tight text-foreground">
          {service.name}
        </div>
        <div className="truncate text-[10px] font-normal leading-tight text-flame-accent">
          {service.description ?? "\u00A0"}
        </div>
      </div>
      {editing && (
        <div className="flex shrink-0 gap-0.5">
          <Button variant="ghost" size="icon" className="h-5 w-5 opacity-40 hover:opacity-100" onClick={onEdit}>
            <Pencil className="h-2.5 w-2.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive opacity-40 hover:opacity-100" onClick={onDelete}>
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </div>
      )}
    </>
  );

  const cls = "group flex h-9 items-center gap-2 rounded px-1.5 transition-all duration-100 hover:bg-black/20";

  if (editing) {
    return (
      <div ref={setNodeRef} style={style} className={cls}>
        {inner}
      </div>
    );
  }

  return (
    <a ref={setNodeRef} style={style} href={service.url} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  );
}
