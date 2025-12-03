import type { icons } from "lucide-react";

export type IconName = keyof typeof icons;

export type NavigationItem = {
  title: string;
  href: string;
  icon?: IconName;
  badge?: string;
};
