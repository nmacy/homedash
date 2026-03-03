"use client";

import { useState, useCallback } from "react";
import type { Config, Category, Service } from "@/lib/schema";

export function useConfig(initialConfig: Config) {
  const [config, setConfig] = useState<Config>(initialConfig);
  const [savedConfig, setSavedConfig] = useState<Config>(initialConfig);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Failed to fetch config");
      const data: Config = await res.json();
      setConfig(data);
      setSavedConfig(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }, []);

  const saveConfig = useCallback(async (): Promise<boolean> => {
    if (!config) return false;
    try {
      setSaving(true);
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Failed to save config");
      const data: Config = await res.json();
      setConfig(data);
      setSavedConfig(data);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return false;
    } finally {
      setSaving(false);
    }
  }, [config]);

  const discardChanges = useCallback(() => {
    setConfig(savedConfig);
  }, [savedConfig]);

  const hasChanges = JSON.stringify(config) !== JSON.stringify(savedConfig);

  const updateTitle = useCallback((title: string) => {
    setConfig((prev) => ({ ...prev, title }));
  }, []);

  const addCategory = useCallback((category: Category) => {
    setConfig((prev) => ({ ...prev, categories: [...prev.categories, category] }));
  }, []);

  const updateCategory = useCallback((index: number, category: Category) => {
    setConfig((prev) => {
      const categories = [...prev.categories];
      categories[index] = category;
      return { ...prev, categories };
    });
  }, []);

  const deleteCategory = useCallback((index: number) => {
    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index),
    }));
  }, []);

  const addService = useCallback((categoryIndex: number, service: Service) => {
    setConfig((prev) => {
      const categories = [...prev.categories];
      categories[categoryIndex] = {
        ...categories[categoryIndex],
        services: [...categories[categoryIndex].services, service],
      };
      return { ...prev, categories };
    });
  }, []);

  const updateService = useCallback(
    (categoryIndex: number, serviceIndex: number, service: Service) => {
      setConfig((prev) => {
        const categories = [...prev.categories];
        const services = [...categories[categoryIndex].services];
        services[serviceIndex] = service;
        categories[categoryIndex] = { ...categories[categoryIndex], services };
        return { ...prev, categories };
      });
    },
    []
  );

  const deleteService = useCallback(
    (categoryIndex: number, serviceIndex: number) => {
      setConfig((prev) => {
        const categories = [...prev.categories];
        const services = categories[categoryIndex].services.filter(
          (_, i) => i !== serviceIndex
        );
        categories[categoryIndex] = { ...categories[categoryIndex], services };
        return { ...prev, categories };
      });
    },
    []
  );

  const moveCategory = useCallback((fromIndex: number, toIndex: number) => {
    setConfig((prev) => {
      const categories = [...prev.categories];
      const [moved] = categories.splice(fromIndex, 1);
      categories.splice(toIndex, 0, moved);
      return { ...prev, categories };
    });
  }, []);

  const moveService = useCallback(
    (categoryIndex: number, fromIndex: number, toIndex: number) => {
      setConfig((prev) => {
        const categories = [...prev.categories];
        const services = [...categories[categoryIndex].services];
        const [moved] = services.splice(fromIndex, 1);
        services.splice(toIndex, 0, moved);
        categories[categoryIndex] = { ...categories[categoryIndex], services };
        return { ...prev, categories };
      });
    },
    []
  );

  const reloadConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Failed to fetch config");
      const data: Config = await res.json();
      setConfig(data);
      setSavedConfig(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }, []);

  return {
    config,
    error,
    saving,
    hasChanges,
    fetchConfig,
    saveConfig,
    discardChanges,
    reloadConfig,
    updateTitle,
    addCategory,
    updateCategory,
    deleteCategory,
    addService,
    updateService,
    deleteService,
    moveCategory,
    moveService,
  };
}
