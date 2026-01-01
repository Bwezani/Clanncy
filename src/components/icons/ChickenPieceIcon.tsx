import { cn } from "@/lib/utils";

export default function ChickenPieceIcon({ className }: { className?: string }) {
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
      <path d="M14.9 12.1a5 5 0 0 1-7.1 7.1l-2.8-2.8c-2-2-2-5.1 0-7.1l7.1-7.1c2-2 5.1-2 7.1 0l2.8 2.8c2 2 2 5.1 0 7.1l-7.1 7.1z" />
      <path d="M12 15l-4 4" />
      <path d="M16 4l4 4" />
      <path d="m2.5 13.5 6 6" />
    </svg>
  );
}
