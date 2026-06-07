import { AppLogoMark } from "@/components/AppLogoMark";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  tagline?: string;
}

const sizes = {
  sm: { box: "h-8 w-8", word: "text-base", tag: "text-[10px]" },
  md: { box: "h-9 w-9", word: "text-lg", tag: "text-xs" },
  lg: { box: "h-14 w-14", word: "text-3xl", tag: "text-sm" },
};

export function AppLogo({
  size = "md",
  showWordmark = true,
  tagline,
}: AppLogoProps) {
  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative ${s.box} shrink-0 overflow-hidden rounded-lg border border-default shadow-sm`}
        aria-hidden
      >
        <AppLogoMark />
      </div>
      {showWordmark && (
        <div>
          <span
            className={`block font-semibold tracking-[0.08em] text-foreground ${s.word}`}
          >
            ShiftMind
          </span>
          {tagline && (
            <span className={`block tracking-wide text-muted ${s.tag}`}>
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
