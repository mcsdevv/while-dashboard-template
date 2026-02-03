import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Calendar,
  CalendarDays,
  CalendarRange,
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
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  children?: NavItem[];
  external?: boolean;
}

export const navigation: NavItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    id: "calendar",
    title: "Calendar",
    href: "/calendar",
    icon: CalendarRange,
  },
  {
    id: "activity",
    title: "Activity",
    href: "/activity",
    icon: Activity,
  },
  {
    id: "events",
    title: "Events",
    href: "/events",
    icon: CalendarDays,
  },
  {
    id: "webhooks",
    title: "Webhooks",
    href: "/webhooks",
    icon: Radio,
  },
  {
    id: "connections",
    title: "Connections",
    href: "/connections",
    icon: Link2,
    children: [
      {
        id: "connections-google",
        title: "Google Calendar",
        href: "/connections/google",
        icon: Calendar,
      },
      {
        id: "connections-notion",
        title: "Notion",
        href: "/connections/notion",
        icon: Database,
      },
    ],
  },
  {
    id: "field-mapping",
    title: "Field Mapping",
    href: "/field-mapping",
    icon: GitBranch,
  },
  {
    id: "setup-wizard",
    title: "Setup Wizard",
    href: "/setup/1",
    icon: Sparkles,
  },
  {
    id: "settings",
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    id: "help",
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
