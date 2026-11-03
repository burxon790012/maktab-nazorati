import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(isoOrTime?: string | null): string {
  if (!isoOrTime) return "—";
  if (isoOrTime.includes(":")) return isoOrTime;
  try {
    return new Date(isoOrTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoOrTime;
  }
}
