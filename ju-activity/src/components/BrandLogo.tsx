import { cn } from "@/lib/utils";

type BrandLogoProps = {
  subtitle?: string;
  orientation?: "horizontal" | "vertical";
  size?: number;
  className?: string;
  showLabel?: boolean;
  titleClassName?: string;
  subtitleClassName?: string;
  imageClassName?: string;
  withHalo?: boolean;
};

export const BrandLogo = ({
  subtitle,
  orientation = "horizontal",
  size = 48,
  className,
  showLabel = true,
  titleClassName = "text-foreground",
  subtitleClassName = "text-muted-foreground",
  imageClassName,
  withHalo = false,
}: BrandLogoProps) => (
  <div
    className={cn(
      "flex items-center gap-3",
      orientation === "vertical" && "flex-col",
      className,
    )}
  >
    <img
      src="/ju-icon.svg"
      alt="JU-AMS logo"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn(
        "rounded-2xl",
        withHalo &&
          "rounded-3xl border border-white/10 bg-white/5 p-2 shadow-[0_12px_30px_rgba(11,17,32,0.35)] backdrop-blur",
        imageClassName,
      )}
    />
    {showLabel && (
      <div
        className={cn(
          "flex flex-col leading-tight",
          orientation === "vertical" && "items-center text-center",
        )}
      >
        <span className={cn("font-bold tracking-tight", titleClassName)}>JU-AMS</span>
        {subtitle && (
          <span className={cn("text-xs", subtitleClassName)}>{subtitle}</span>
        )}
      </div>
    )}
  </div>
);
