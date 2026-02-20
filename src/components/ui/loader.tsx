import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  containerClassName?: string;
}

export function Loader({ className, containerClassName }: LoaderProps) {
  return (
    <div className={cn("flex items-center justify-center py-12", containerClassName)}>
      <div className={cn("loader", className)}></div>
    </div>
  );
}
