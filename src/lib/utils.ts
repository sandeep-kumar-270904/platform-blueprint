import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatStat(value: number | undefined | null, isLoaded: boolean, zeroStateStr: string = "0", isDecimal: boolean = false): React.ReactNode {
  if (!isLoaded) {
    return React.createElement("span", { className: "inline-block h-[1em] w-[2em] rounded animate-pulse bg-current opacity-20 align-middle" });
  }
  if (value === 0 || value === undefined || value === null) {
    return zeroStateStr;
  }
  return isDecimal ? Number(value).toFixed(1) : value.toLocaleString();
}

export function formatTimestamp(dateString: string | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  if (diffInDays < 7) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (diffInDays < 1) {
      const diffInHours = diffInMs / (1000 * 60 * 60);
      if (diffInHours < 1) {
        const diffInMinutes = diffInMs / (1000 * 60);
        return rtf.format(-Math.floor(diffInMinutes), 'minute');
      }
      return rtf.format(-Math.floor(diffInHours), 'hour');
    }
    return rtf.format(-Math.floor(diffInDays), 'day');
  }

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}
