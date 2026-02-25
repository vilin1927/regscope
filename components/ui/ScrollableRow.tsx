"use client";

import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScrollableRowProps {
  children: ReactNode;
  className?: string;
  /** CSS color for the fade gradient edges (default: page bg #f8fafc) */
  fadeColor?: string;
}

export function ScrollableRow({
  children,
  className = "",
  fadeColor = "#f8fafc",
}: ScrollableRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeft(scrollLeft > 4);
    setShowRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative group">
      {/* Left fade + arrow */}
      {showLeft && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none rounded-l-xl"
            style={{ background: `linear-gradient(to right, ${fadeColor}, transparent)` }}
          />
          <button
            onClick={() => scroll("left")}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md hover:border-gray-300 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        </>
      )}

      {/* Right fade + arrow */}
      {showRight && (
        <>
          <div
            className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none rounded-r-xl"
            style={{ background: `linear-gradient(to left, ${fadeColor}, transparent)` }}
          />
          <button
            onClick={() => scroll("right")}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md hover:border-gray-300 transition-all sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </>
      )}

      <div
        ref={scrollRef}
        className={`overflow-x-auto scrollbar-hide ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
