type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  initials: string;
  avatarUrl?: string;
  size?: AvatarSize;
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: "w-6 h-6 text-[9px]",
  md: "w-8 h-8 text-[11px]",
  lg: "w-9 h-9 text-[12px]",
};

export default function Avatar({
  initials,
  avatarUrl,
  size = "md",
}: AvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={initials}
        className={`shrink-0 rounded-full object-cover ${sizeStyles[size]}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-bg-hover font-medium text-text-primary ${sizeStyles[size]}`}
    >
      {initials}
    </div>
  );
}
