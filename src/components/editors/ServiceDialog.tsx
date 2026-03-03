"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceSchema, type Service } from "@/lib/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { IconPicker } from "./IconPicker";

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service;
  onSubmit: (service: Service) => void;
}

export function ServiceDialog({ open, onOpenChange, service, onSubmit }: ServiceDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<Service>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service ?? { name: "", url: "", icon: "", description: "" },
  });

  const iconValue = watch("icon");

  const handleOpenChange = (next: boolean) => {
    if (!next) reset(service ?? { name: "", url: "", icon: "", description: "" });
    onOpenChange(next);
  };

  const onFormSubmit = (data: Service) => {
    onSubmit(data);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md border-flame-accent/20 bg-background">
        <DialogHeader>
          <DialogTitle className="text-sm font-normal uppercase tracking-widest text-flame-accent">
            {service ? "Edit Service" : "Add Service"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs uppercase tracking-wider text-foreground/60">Name</label>
            <Input id="name" {...register("name")} className="border-foreground/20 bg-transparent" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="url" className="text-xs uppercase tracking-wider text-foreground/60">URL</label>
            <Input id="url" {...register("url")} placeholder="http://..." className="border-foreground/20 bg-transparent" />
            {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-xs uppercase tracking-wider text-foreground/60">Description</label>
            <Input id="description" {...register("description")} className="border-foreground/20 bg-transparent" />
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
              {service ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
