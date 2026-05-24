import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeMap = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-6xl",
} as const;

export function Wordmark({ className, size = "md" }: WordmarkProps) {
  return (
    <span
      className={cn(
        "font-serif font-normal italic leading-none",
        sizeMap[size],
        className,
      )}
    >
      App<span className="text-primary not-italic font-medium">Dental</span>
    </span>
  );
}
