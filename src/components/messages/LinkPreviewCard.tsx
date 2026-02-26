import { useState, useEffect } from "react";
import { ExternalLink, Globe } from "lucide-react";

interface LinkPreviewCardProps {
  url: string;
  isMe: boolean;
}

const getDomain = (url: string) => {
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "");
  } catch {
    return url;
  }
};

const getFaviconUrl = (url: string) => {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return null;
  }
};

const getDisplayTitle = (url: string) => {
  const domain = getDomain(url);
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "");
    if (!path || path === "/") return domain;
    // Clean up path to readable title
    const segment = path.split("/").filter(Boolean).pop() || "";
    return segment
      .replace(/[-_]/g, " ")
      .replace(/\.[^.]+$/, "")
      .replace(/\b\w/g, c => c.toUpperCase())
      .slice(0, 40) || domain;
  } catch {
    return domain;
  }
};

const LinkPreviewCard = ({ url, isMe }: LinkPreviewCardProps) => {
  const domain = getDomain(url);
  const favicon = getFaviconUrl(url);
  const title = getDisplayTitle(url);

  // Detect meeting links
  const isMeeting = /meet\.google|zoom\.us|teams\.microsoft|whereby/.test(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-lg border overflow-hidden transition-colors my-1.5 max-w-[280px] ${
        isMe
          ? "border-primary-foreground/20 bg-primary-foreground/10 hover:bg-primary-foreground/15"
          : "border-border bg-muted/50 hover:bg-muted"
      }`}
    >
      {/* Colored top bar */}
      <div className={`h-1 ${isMeeting ? "bg-green-500" : "bg-primary/60"}`} />

      <div className="px-3 py-2.5 space-y-1">
        {/* Domain + favicon row */}
        <div className="flex items-center gap-1.5">
          {favicon ? (
            <img
              src={favicon}
              alt=""
              className="h-3.5 w-3.5 rounded-sm shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className={`text-[10px] uppercase tracking-wider font-medium truncate ${
            isMe ? "text-primary-foreground/60" : "text-muted-foreground"
          }`}>
            {domain}
          </span>
        </div>

        {/* Title */}
        <p className={`text-xs font-semibold leading-snug line-clamp-2 ${
          isMe ? "text-primary-foreground" : "text-foreground"
        }`}>
          {isMeeting ? "📹 Join Meeting" : title}
        </p>

        {/* URL preview */}
        <div className="flex items-center gap-1">
          <ExternalLink className={`h-2.5 w-2.5 shrink-0 ${
            isMe ? "text-primary-foreground/50" : "text-muted-foreground"
          }`} />
          <span className={`text-[9px] truncate ${
            isMe ? "text-primary-foreground/50" : "text-muted-foreground"
          }`}>
            {url.length > 45 ? url.slice(0, 45) + "…" : url}
          </span>
        </div>
      </div>
    </a>
  );
};

export default LinkPreviewCard;
