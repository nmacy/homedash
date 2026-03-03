"use client";

import { useState, useCallback } from "react";

export function useEditMode() {
  const [editing, setEditing] = useState(false);

  const enterEditMode = useCallback(() => setEditing(true), []);
  const exitEditMode = useCallback(() => setEditing(false), []);
  const toggleEditMode = useCallback(() => setEditing((prev) => !prev), []);

  return { editing, enterEditMode, exitEditMode, toggleEditMode };
}
