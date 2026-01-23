import type { KeyboardEvent as ReactKeyboardEvent } from "react";

export const isMarkShotKey = (event: KeyboardEvent | ReactKeyboardEvent) =>
  event.key?.toLowerCase() === "b" || event.code === "KeyB";
