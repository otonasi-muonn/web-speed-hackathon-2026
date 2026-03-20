import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  src: string;
}

/**
 * クリックすると再生・一時停止を切り替えます。
 */
export const PausableMovie = ({ src }: Props) => {
  const thumbSrc = src.replace(".webp", "_thumb.jpg");
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Draw animated WebP to canvas using requestAnimationFrame at 15fps
  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !isLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      ctx.drawImage(img, 0, 0);
      setIsPlaying(false);
      return;
    }

    frameCountRef.current = 0;
    function draw() {
      frameCountRef.current++;
      if (frameCountRef.current % 4 === 0) {
        ctx!.drawImage(img!, 0, 0);
      }
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isLoaded]);

  // Pause/resume the rAF loop
  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !isLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
    } else {
      frameCountRef.current = 0;
      function draw() {
        frameCountRef.current++;
        if (frameCountRef.current % 4 === 0) {
          ctx!.drawImage(img!, 0, 0);
        }
        rafRef.current = requestAnimationFrame(draw);
      }
      rafRef.current = requestAnimationFrame(draw);
      return () => cancelAnimationFrame(rafRef.current);
    }
  }, [isPlaying, isLoaded]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleClick = useCallback(() => {
    setIsPlaying((playing) => !playing);
  }, []);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <div ref={containerRef} className="relative h-full w-full">
        {/* Thumbnail: LCP element shown immediately before canvas is ready */}
        {!isLoaded && (
          <img
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            src={thumbSrc}
          />
        )}
        {isNearViewport && (
          <>
            {/* Hidden img loads the animated WebP in the background */}
            <img ref={imgRef} alt="" className="hidden" onLoad={handleLoad} src={src} />
            {isLoaded && (
              <button
                aria-label="動画プレイヤー"
                className="group absolute inset-0 block h-full w-full"
                onClick={handleClick}
                type="button"
              >
                <canvas ref={canvasRef} className="h-full w-full" />
                <div
                  className={classNames(
                    "absolute left-1/2 top-1/2 flex items-center justify-center w-16 h-16 text-cax-surface-raised text-3xl bg-cax-overlay/50 rounded-full -translate-x-1/2 -translate-y-1/2",
                    {
                      "opacity-0 group-hover:opacity-100": isPlaying,
                    },
                  )}
                >
                  <FontAwesomeIcon iconType={isPlaying ? "pause" : "play"} styleType="solid" />
                </div>
              </button>
            )}
          </>
        )}
      </div>
    </AspectRatioBox>
  );
};
