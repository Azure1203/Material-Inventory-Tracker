import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCostLevelDisplay(level: number): string {
  return "$".repeat(Math.min(level, 5));
}

export function thumbUrl(src: string, width: number): string {
  if (!src || !src.startsWith("/objects/")) return src;
  return `${src}?w=${width}`;
}

export function getCostLevelColor(level: number): string {
  switch (level) {
    case 1:
      return "text-green-600 dark:text-green-400";
    case 2:
      return "text-lime-600 dark:text-lime-400";
    case 3:
      return "text-yellow-600 dark:text-yellow-400";
    case 4:
      return "text-orange-600 dark:text-orange-400";
    case 5:
      return "text-red-600 dark:text-red-400";
    default:
      return "text-muted-foreground";
  }
}
