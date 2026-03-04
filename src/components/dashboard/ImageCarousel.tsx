import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  className?: string;
}

type AspectMode = "landscape" | "portrait" | "square";

const ImageCarousel = ({ images, className = "" }: ImageCarouselProps) => {
  const [current, setCurrent] = useState(0);
  const [aspectMode, setAspectMode] = useState<AspectMode>("square");
  const imgRef = useRef<HTMLImageElement>(null);

  // Detect dominant aspect ratio from first image
  useEffect(() => {
    if (images.length === 0) return;
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      if (ratio > 1.15) setAspectMode("landscape");
      else if (ratio < 0.85) setAspectMode("portrait");
      else setAspectMode("square");
    };
    img.src = images[0];
  }, [images]);

  if (images.length === 0) return null;

  const aspectClass =
    aspectMode === "portrait"
      ? "aspect-[4/5]"
      : aspectMode === "landscape"
      ? "aspect-video"
      : "aspect-square";

  const prev = () => setCurrent(i => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setCurrent(i => (i === images.length - 1 ? 0 : i + 1));

  if (images.length === 1) {
    return (
      <div className={`w-full bg-muted ${aspectClass} overflow-hidden ${className}`}>
        <img
          src={images[0]}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      <div className={`w-full bg-muted ${aspectClass} overflow-hidden`}>
        <img
          ref={imgRef}
          src={images[current]}
          alt=""
          className="w-full h-full object-cover transition-opacity duration-200"
        />
      </div>

      {/* Nav arrows */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-background"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-background"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? "w-4 bg-primary" : "w-1.5 bg-foreground/40"
            }`}
          />
        ))}
      </div>

      {/* Counter */}
      <span className="absolute top-3 right-3 rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-medium">
        {current + 1}/{images.length}
      </span>
    </div>
  );
};

export default ImageCarousel;
