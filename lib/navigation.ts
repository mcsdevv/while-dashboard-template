import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Calendar,
  Database,
  GitBranch,
  HelpCircle,
  Home,
  Link2,
  Radio,
  Settings,
  Sparkles,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  children?: NavItem[];
  external?: boolean;
}

export const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Activity",
    href: "/activity",
    icon: Activity,
  },
  {
    title: "Connections",
    href: "/connections",
    icon: Link2,
    children: [
      {
        title: "Google Calendar",
        href: "/connections/google",
        icon: Calendar,
      },
      {
        title: "Notion",
        href: "/connections/notion",
        icon: Database,
      },
    ],
  },
  {
    title: "Field Mapping",
    href: "/field-mapping",
    icon: GitBranch,
  },
  {
    title: "Webhooks",
    href: "/webhooks",
    icon: Radio,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Setup Wizard",
    href: "/setup/1",
    icon: Sparkles,
  },
  {
    title: "Help",
    href: "https://while.so/docs",
    icon: HelpCircle,
    external: true,
  },
];

export const footerLinks = [
  { href: "https://while.so/docs", label: "Docs" },
  { href: "https://while.so/support", label: "Support" },
  { href: "https://github.com/mcsdevv/while", label: "GitHub" },
  { href: "https://while.so/terms", label: "Terms" },
];
