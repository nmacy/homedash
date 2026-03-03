"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { IconPicker } from "./IconPicker";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryFormData;
  onSubmit: (data: CategoryFormData) => void;
}

export function CategoryDialog({ open, onOpenChange, category, onSubmit }: CategoryDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: category ?? { name: "", icon: "" },
  });

  const iconValue = watch("icon");

  const handleOpenChange = (next: boolean) => {
    if (!next) reset(category ?? { name: "", icon: "" });
    onOpenChange(next);
  };

  const onFormSubmit = (data: CategoryFormData) => {
    onSubmit(data);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md border-flame-accent/20 bg-background">
        <DialogHeader>
          <DialogTitle className="text-sm font-normal uppercase tracking-widest text-flame-accent">
            {category ? "Edit Category" : "Add Category"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="cat-name" className="text-xs uppercase tracking-wider text-foreground/60">Name</label>
            <Input id="cat-name" {...register("name")} className="border-foreground/20 bg-transparent" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-foreground/60">Icon</label>
            <IconPicker
              value={iconValue}
              onSelect={(name) => setValue("icon", name)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="rounded border border-foreground/20 px-4 py-1.5 text-xs uppercase tracking-wider text-foreground transition-colors hover:bg-foreground/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded border border-flame-accent px-4 py-1.5 text-xs uppercase tracking-wider text-foreground transition-colors hover:bg-flame-accent hover:text-background"
            >
              {category ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
