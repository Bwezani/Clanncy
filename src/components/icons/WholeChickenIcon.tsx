import { cn } from "@/lib/utils";

export default function WholeChickenIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("text-foreground", className)}
    >
      <path d="M18.5 15.5c-2-2-5-2-7 0-3.5-3.5-3.5-9.5 0-13 4.5 4.5 4.5 10.5 0 15" />
      <path d="M14.5 11.5c-2-2-5-2-7 0-3.5-3.5-3.5-9.5 0-13 4.5 4.5 4.5 10.5 0 15" />
      <path d="M5.5 15.5c2 2 5 2 7 0" />
      <path d="M12.5 8.5c2 2 5 2 7 0" />
      <path d="M17.5 12.5c.5.5.5 1.5 0 2" />
      <path d="M19.5 14.5c.5.5.5 1.5 0 2" />
      <path d="M14 22V8" />
      <path d="M10 22V9" />
      <path d="M10 14c-1.5 1.5-1.5 4-3 6" />
      <path d="M14 14c1.5 1.5 1.5 4 3 6" />
    </svg>
  );
}
