"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

type AdCardProps = {
  name: string;
  headline: string;
  imageUrl: string;
  videoUrl: string;
  permalinkUrl: string | null;
  className: string;
};

export function AdCard({ name, headline, imageUrl, videoUrl, permalinkUrl, className }: AdCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const hasImage = !!imageUrl && !imageFailed;
  const hasVideo = !!videoUrl;

  const openInNewTab = (url: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (hasImage) {
    return (
      <div className="absolute inset-0">
        <img
          src={imageUrl}
          alt={headline}
          loading="lazy"
          onError={() => setImageFailed(true)}
          onClick={permalinkUrl ? openInNewTab(permalinkUrl) : undefined}
          className={cn(className, permalinkUrl && "cursor-pointer")}
        />
        {hasVideo && (
          <button
            type="button"
            onClick={openInNewTab(videoUrl)}
            aria-label="Reproducir video"
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="flex items-center justify-center size-12 rounded-full bg-black/50 backdrop-blur border border-white/20 transition hover:bg-black/70">
              <Play className="size-5 text-white fill-white" />
            </span>
          </button>
        )}
      </div>
    );
  }

  if (hasVideo) {
    return (
      <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center gap-3 px-4 text-center">
        <button
          type="button"
          onClick={openInNewTab(videoUrl)}
          aria-label="Reproducir video"
          className="flex items-center justify-center size-12 rounded-full bg-black/50 backdrop-blur border border-white/20 transition hover:bg-black/70"
        >
          <Play className="size-5 text-white fill-white" />
        </button>
        <p className="text-sm font-medium text-white/80 line-clamp-2">{name}</p>
      </div>
    );
  }

  if (imageFailed) {
    return (
      <div className="absolute inset-0 bg-neutral-800 flex flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-sm font-medium text-white/80 line-clamp-2">{name}</p>
        {permalinkUrl && (
          <a
            href={permalinkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
          >
            Ver en Meta →
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-neutral-800 flex flex-col items-center justify-center gap-1 px-4 text-center">
      <p className="text-sm font-medium text-white/80 line-clamp-2">{name}</p>
      <p className="text-xs text-white/40">Sin preview disponible</p>
    </div>
  );
}
