import type { FC } from "react";

export interface SubNavItemType {
  label: string;
  href: string;
  icon?: FC<{ className?: string }>;
  badge?: string | number;
}

export interface NavItemType {
  label: string;
  href: string;
  id?: string;
  step?: string;
  sub?: string;
  icon?: FC<{ className?: string }>;
  items?: SubNavItemType[];
  badge?: string | number;
}
