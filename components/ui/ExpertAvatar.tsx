import Image from "next/image";
import type { ExpertProfile } from "@/data/experts";

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-lg",
};

interface ExpertAvatarProps {
  expert: ExpertProfile;
  size?: "sm" | "md" | "lg";
}

const pixelSizes = { sm: 32, md: 40, lg: 64 };

export function ExpertAvatar({ expert, size = "md" }: ExpertAvatarProps) {
  if (expert.avatarSrc) {
    return (
      <Image
        src={expert.avatarSrc}
        alt={expert.initials}
        width={pixelSizes[size]}
        height={pixelSizes[size]}
        className={`${sizes[size]} rounded-full object-cover shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} ${expert.avatarColor} rounded-full flex items-center justify-center font-bold shrink-0`}
    >
      {expert.initials}
    </div>
  );
}
