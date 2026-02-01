import Image from "next/image";

// Brand icons for Google Calendar and Notion using official PNG assets
type IconSize = "sm" | "md" | "lg";

interface IconProps {
  className?: string;
  size?: IconSize;
}

const ICON_SIZES: Record<IconSize, number> = {
  sm: 14,
  md: 20,
  lg: 24,
};

export function GoogleCalendarIcon({ className, size = "sm" }: IconProps) {
  const dimension = ICON_SIZES[size];
  return (
    <Image
      src="/icons/google-calendar.png"
      alt=""
      width={dimension}
      height={dimension}
      className={className}
      aria-hidden="true"
    />
  );
}

export function NotionIcon({ className, size = "sm" }: IconProps) {
  const dimension = ICON_SIZES[size];
  return (
    <Image
      src="/icons/notion.png"
      alt=""
      width={dimension}
      height={dimension}
      className={className}
      aria-hidden="true"
    />
  );
}
