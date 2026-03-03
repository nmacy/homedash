"use client";

import { useState, useEffect } from "react";
import { Settings, Plus } from "lucide-react";
import { toast } from "sonner";
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
import { ThemeToggle } from "@/components/ThemeToggle";
import { CategorySection } from "./CategorySection";
import { EditModeToolbar } from "./EditModeToolbar";
import { ServiceDialog } from "@/components/editors/ServiceDialog";
import { CategoryDialog } from "@/components/editors/CategoryDialog";
import { BackupDialog } from "@/components/editors/BackupDialog";
import { useConfig } from "@/hooks/useConfig";
import { useEditMode } from "@/hooks/useEditMode";
import type { Service, Config } from "@/lib/schema";

interface DialogState {
  type: "service" | "category";
  categoryIndex?: number;
  serviceIndex?: number;
  data?: Service | { name: string; icon?: string };
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning!";
  if (hour >= 12 && hour < 17) return "Good afternoon!";
  if (hour >= 17 && hour < 21) return "Good evening!";
  return "Good night!";
}

function formatDateTime(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface DashboardProps {
  initialConfig: Config;
}

export function Dashboard({ initialConfig }: DashboardProps) {
  const {
    config,
    error,
    saving,
    hasChanges,
    saveConfig,
    discardChanges,
    addCategory,
    updateCategory,
    deleteCategory,
    addService,
    updateService,
    deleteService,
    moveCategory,
    moveService,
    reloadConfig,
  } = useConfig(initialConfig);

  const { editing, toggleEditMode, exitEditMode } = useEditMode();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [backupOpen, setBackupOpen] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setGreeting(getGreeting());
    setDateStr(formatDateTime());
    const interval = setInterval(() => {
      setGreeting(getGreeting());
      setDateStr(formatDateTime());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const categorySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const categoryIds = config.categories.map((_, i) => `cat-${i}`);

  function handleCategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = categoryIds.indexOf(active.id as string);
    const to = categoryIds.indexOf(over.id as string);
    if (from !== -1 && to !== -1) moveCategory(from, to);
  }

  const handleSave = async () => {
    const ok = await saveConfig();
    if (ok) {
      toast.success("Config saved");
      exitEditMode();
    } else {
      toast.error("Failed to save config");
    }
  };

  const handleDiscard = () => {
    discardChanges();
    exitEditMode();
  };

  const handleServiceSubmit = (service: Service) => {
    if (!dialog || dialog.type !== "service") return;
    if (dialog.serviceIndex !== undefined && dialog.categoryIndex !== undefined) {
      updateService(dialog.categoryIndex, dialog.serviceIndex, service);
    } else if (dialog.categoryIndex !== undefined) {
      addService(dialog.categoryIndex, service);
    }
  };

  const handleCategorySubmit = (data: { name: string; icon?: string }) => {
    if (!dialog || dialog.type !== "category") return;
    if (dialog.categoryIndex !== undefined) {
      const existing = config.categories[dialog.categoryIndex];
      updateCategory(dialog.categoryIndex, { ...existing, name: data.name, icon: data.icon });
    } else {
      addCategory({ name: data.name, icon: data.icon, services: [] });
    }
  };

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {editing && (
        <EditModeToolbar
          hasChanges={hasChanges}
          saving={saving}
          onSave={handleSave}
          onDiscard={handleDiscard}
          onExit={handleDiscard}
          onBackup={() => setBackupOpen(true)}
        />
      )}

      <div className="mx-auto w-full max-w-[1400px] px-5 py-8 lg:px-12 lg:py-[40px]">
        {/* Header */}
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl">
              {greeting}
            </h1>
            <p className="mt-0.5 text-xs font-light uppercase tracking-wide text-foreground/70">
              {dateStr}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 pt-1">
            <ThemeToggle />
          </div>
        </header>

        {/* Categories */}
        <DndContext sensors={categorySensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
          <SortableContext items={categoryIds} strategy={rectSortingStrategy}>
            <div className="flex flex-wrap gap-4">
              {config.categories.map((category, categoryIndex) => (
                <CategorySection
                  key={categoryIds[categoryIndex]}
                  id={categoryIds[categoryIndex]}
                  category={category}
                  categoryIndex={categoryIndex}
                  editing={editing}
                  onEditCategory={() =>
                    setDialog({
                      type: "category",
                      categoryIndex,
                      data: { name: category.name, icon: category.icon },
                    })
                  }
                  onDeleteCategory={() => deleteCategory(categoryIndex)}
                  onAddService={() =>
                    setDialog({ type: "service", categoryIndex })
                  }
                  onEditService={(serviceIndex) =>
                    setDialog({
                      type: "service",
                      categoryIndex,
                      serviceIndex,
                      data: category.services[serviceIndex],
                    })
                  }
                  onDeleteService={(serviceIndex) =>
                    deleteService(categoryIndex, serviceIndex)
                  }
                  onMoveService={(from, to) => moveService(categoryIndex, from, to)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {editing && (
          <button
            onClick={() => setDialog({ type: "category" })}
            className="mt-6 flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-flame-accent/30 p-3 text-[10px] uppercase tracking-wider text-flame-accent/60 transition-colors hover:bg-black/20 hover:text-flame-accent"
          >
            <Plus className="h-3 w-3" />
            Add category
          </button>
        )}
      </div>

      {/* Settings button */}
      <button
        onClick={toggleEditMode}
        className="fixed bottom-[10px] left-[10px] z-40 flex h-8 w-8 items-center justify-center rounded-full bg-flame-accent opacity-25 transition-opacity duration-300 hover:cursor-pointer hover:opacity-100"
        title={editing ? "Exit edit mode" : "Enter edit mode"}
      >
        <Settings className="h-3.5 w-3.5 text-background" />
      </button>

      {dialog?.type === "service" && (
        <ServiceDialog
          open
          onOpenChange={(open) => { if (!open) setDialog(null); }}
          service={dialog.data as Service | undefined}
          onSubmit={handleServiceSubmit}
        />
      )}
      {dialog?.type === "category" && (
        <CategoryDialog
          open
          onOpenChange={(open) => { if (!open) setDialog(null); }}
          category={dialog.data as { name: string; icon?: string } | undefined}
          onSubmit={handleCategorySubmit}
        />
      )}
      <BackupDialog
        open={backupOpen}
        onOpenChange={setBackupOpen}
        onRestore={reloadConfig}
      />
    </div>
  );
}
