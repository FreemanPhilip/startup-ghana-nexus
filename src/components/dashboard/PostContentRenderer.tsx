import { useState, useRef, useEffect, Fragment } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface PostContentRendererProps {
  content: string;
  maxLines?: number;
  className?: string;
  onHashtagClick?: (tag: string) => void;
  onMentionClick?: (name: string) => void;
}

/** Parse post content into segments: text, #hashtag, @mention */
function parseContent(text: string) {
  // Match #hashtags and @mentions (support multi-word mentions in brackets: @[John Doe])
  const regex = /(#[\w\u00C0-\u024F]+)|(@\[([^\]]+)\])|(@[\w\u00C0-\u024F]+)/g;
  const segments: { type: "text" | "hashtag" | "mention"; value: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    if (match[1]) {
      segments.push({ type: "hashtag", value: match[1] });
    } else if (match[2]) {
      // @[Full Name] -> display as @Full Name
      segments.push({ type: "mention", value: match[3] });
    } else if (match[4]) {
      segments.push({ type: "mention", value: match[4].slice(1) });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }
  return segments;
}

const PostContentRenderer = ({
  content,
  maxLines = 3,
  className = "",
  onHashtagClick,
  onMentionClick,
}: PostContentRendererProps) => {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      // Check if content overflows the clamped height
      setIsClamped(el.scrollHeight > el.clientHeight + 2);
    }
  }, [content]);

  const segments = parseContent(content);

  return (
    <div>
      <div
        ref={textRef}
        className={`text-sm leading-relaxed whitespace-pre-wrap ${className} ${
          !expanded ? `line-clamp-${maxLines}` : ""
        }`}
        style={!expanded ? { display: "-webkit-box", WebkitLineClamp: maxLines, WebkitBoxOrient: "vertical", overflow: "hidden" } : undefined}
      >
        {segments.map((seg, i) => {
          if (seg.type === "hashtag") {
            return (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); onHashtagClick?.(seg.value); }}
                className="text-primary font-medium hover:underline"
              >
                {seg.value}
              </button>
            );
          }
          if (seg.type === "mention") {
            return (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); onMentionClick?.(seg.value); }}
                className="text-primary font-semibold hover:underline"
              >
                @{seg.value}
              </button>
            );
          }
          return <Fragment key={i}>{seg.value}</Fragment>;
        })}
      </div>
      {isClamped && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <>Show less <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>...see more</>
          )}
        </button>
      )}
    </div>
  );
};

export default PostContentRenderer;
