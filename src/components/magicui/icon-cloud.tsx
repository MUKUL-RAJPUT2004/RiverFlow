"use client";

import React, { useEffect, useRef, useState } from "react";
import * as simpleIcons from "simple-icons";
import type { SimpleIcon } from "simple-icons";

interface Icon {
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  id: number;
}

interface IconCloudProps {
  icons?: string[];
  images?: string[];
  width?: number;
  height?: number;
  radius?: number;
  iconSize?: number;
  }

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function IconCloud({ icons, images, width = 400, height = 400, radius = 100, iconSize = 40 }: IconCloudProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [iconPositions, setIconPositions] = useState<Icon[]>([]);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [targetRotation, setTargetRotation] = useState<{
    x: number;
    y: number;
    startX: number;
    startY: number;
    distance: number;
    startTime: number;
    duration: number;
  } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const rotationRef = useRef(rotation);
  const iconCanvasesRef = useRef<HTMLCanvasElement[]>([]);
  const imagesLoadedRef = useRef<boolean[]>([]);

  // Create icon canvases once when icons/images change
  useEffect(() => {
    const items = icons || images || [];
    if (!items.length) return;

    imagesLoadedRef.current = new Array(items.length).fill(false);

    const newIconCanvases = items.map((item, index) => {
      const offscreen = document.createElement("canvas");
      offscreen.width = iconSize;
      offscreen.height = iconSize;
      const offCtx = offscreen.getContext("2d");

      if (offCtx) {
        if (images) {
          // Handle image URLs directly
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = item as string;
          img.onload = () => {
            offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
            offCtx.beginPath();
            offCtx.arc(iconSize / 2, iconSize / 2, iconSize / 2, 0, Math.PI * 2);
            offCtx.closePath();
            offCtx.clip();
            offCtx.drawImage(img, 0, 0, iconSize, iconSize);
            imagesLoadedRef.current[index] = true;
          };
          img.onerror = () => {
             console.error(`Failed to load image: ${item}`);
          };
        } else {
          // Handle SVG icons from slugs
          const slug = item as string;
          
          // Convert slug to proper camelCase format for simple-icons
          const toCamelCase = (str: string) => {
            return str
              .replace(/[-_\.](.)/g, (_, char) => char.toUpperCase())
              .replace(/^(.)/, char => char.toLowerCase());
          };
          
          const iconKey = `si${toCamelCase(slug).charAt(0).toUpperCase()}${toCamelCase(slug).slice(1)}` as keyof typeof simpleIcons;
          
          console.log(`Mapping slug: ${slug} -> ${iconKey}`);
          
          try {
            const icon = simpleIcons[iconKey] as unknown as SimpleIcon | undefined;
            if (icon) {
              const svgString = icon.svg;
              if (svgString) {
                const img = new Image();
                const svgWithColor = svgString.replace('<svg', '<svg fill="#666"');
                img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgWithColor);
                img.onload = () => {
                  offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
                  offCtx.drawImage(img, Math.max(0, (iconSize - (iconSize - 4)) / 2), Math.max(0, (iconSize - (iconSize - 4)) / 2), iconSize - 4, iconSize - 4);
                  imagesLoadedRef.current[index] = true;
                };
                img.onerror = () => {
                  console.error(`Failed to load icon SVG for slug: ${slug}`);
                  // Fallback to GitHub icon
                  const fallbackIcon = simpleIcons.siGithub as unknown as SimpleIcon | undefined;
                  if (fallbackIcon) {
                    const fallbackImg = new Image();
                    const fallbackSvg = fallbackIcon.svg.replace('<svg', '<svg fill="#666"');
                    fallbackImg.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(fallbackSvg);
                    fallbackImg.onload = () => {
                      offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
                      offCtx.drawImage(fallbackImg, Math.max(0, (iconSize - (iconSize - 4)) / 2), Math.max(0, (iconSize - (iconSize - 4)) / 2), iconSize - 4, iconSize - 4);
                      imagesLoadedRef.current[index] = true;
                    };
                  }
                };
              }
            } else {
              console.warn(`Icon not found for slug: ${slug}, trying fallback`);
              // Try fallback to GitHub icon
              const fallbackIcon = simpleIcons.siGithub as unknown as SimpleIcon | undefined;
              if (fallbackIcon) {
                const img = new Image();
                const svgWithColor = fallbackIcon.svg.replace('<svg', '<svg fill="#666"');
                img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgWithColor);
                img.onload = () => {
                  offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
                  offCtx.drawImage(img, Math.max(0, (iconSize - (iconSize - 4)) / 2), Math.max(0, (iconSize - (iconSize - 4)) / 2), iconSize - 4, iconSize - 4);
                  imagesLoadedRef.current[index] = true;
                };
              }
            }
          } catch (error) {
            console.error(`Error processing icon for slug: ${slug}`, error);
          }
        }
      }
      return offscreen;
    });

    iconCanvasesRef.current = newIconCanvases;
  }, [icons, images]);

  // Generate initial icon positions on a sphere
  useEffect(() => {
    const items = icons || images || [];
    const newIcons: Icon[] = [];
    const numIcons = items.length || 20;
    const offset = 2 / numIcons;
    const increment = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < numIcons; i++) {
      const y = i * offset - 1 + offset / 2;
      const r = Math.sqrt(1 - y * y);
      const phi = i * increment;

      const x = Math.cos(phi) * r;
      const z = Math.sin(phi) * r;

      newIcons.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
        scale: 1,
        opacity: 1,
        id: i,
      });
    }
    setIconPositions(newIcons);
  }, [icons, images]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !canvasRef.current) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    iconPositions.forEach((icon) => {
      const cosX = Math.cos(rotationRef.current.x);
      const sinX = Math.sin(rotationRef.current.x);
      const cosY = Math.cos(rotationRef.current.y);
      const sinY = Math.sin(rotationRef.current.y);

      const rotatedX = icon.x * cosY - icon.z * sinY;
      const rotatedZ = icon.x * sinY + icon.z * cosY;
      const rotatedY = icon.y * cosX + rotatedZ * sinX;

      const screenX = canvasRef.current!.width / 2 + rotatedX;
      const screenY = canvasRef.current!.height / 2 + rotatedY;

      const scale = (rotatedZ + (2 * radius)) / (3 * radius);
      const hitRadius = (iconSize / 2) * scale;
      const dx = x - screenX;
      const dy = y - screenY;

      if (dx * dx + dy * dy < hitRadius * hitRadius) {
        const targetX = -Math.atan2(
          icon.y,
          Math.sqrt(icon.x * icon.x + icon.z * icon.z)
        );
        const targetY = Math.atan2(icon.x, icon.z);
        const currentX = rotationRef.current.x;
        const currentY = rotationRef.current.y;
        const distance = Math.sqrt(
          Math.pow(targetX - currentX, 2) + Math.pow(targetY - currentY, 2)
        );
        const duration = Math.min(2000, Math.max(800, distance * 1000));
        setTargetRotation({
          x: targetX,
          y: targetY,
          startX: currentX,
          startY: currentY,
          distance,
          startTime: performance.now(),
          duration,
        });
        return;
      }
    });
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });
    }
    if (isDragging) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      rotationRef.current = {
        x: rotationRef.current.x + deltaY * 0.002,
        y: rotationRef.current.y + deltaX * 0.002,
      };
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Animation and rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
      const dx = mousePos.x - centerX;
      const dy = mousePos.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const speed = 0.003 + (distance / maxDistance) * 0.01;

      if (targetRotation) {
        const elapsed = performance.now() - targetRotation.startTime;
        const progress = Math.min(1, elapsed / targetRotation.duration);
        const easedProgress = easeOutCubic(progress);
        rotationRef.current = {
          x:
            targetRotation.startX +
            (targetRotation.x - targetRotation.startX) * easedProgress,
          y:
            targetRotation.startY +
            (targetRotation.y - targetRotation.startY) * easedProgress,
        };
        if (progress >= 1) {
          setTargetRotation(null);
        }
      } else if (!isDragging) {
        rotationRef.current = {
          x: rotationRef.current.x + (dy / canvas.height) * speed,
          y: rotationRef.current.y + (dx / canvas.width) * speed,
        };
      }

      iconPositions.forEach((icon, index) => {
        const cosX = Math.cos(rotationRef.current.x);
        const sinX = Math.sin(rotationRef.current.x);
        const cosY = Math.cos(rotationRef.current.y);
        const sinY = Math.sin(rotationRef.current.y);
        const rotatedX = icon.x * cosY - icon.z * sinY;
        const rotatedZ = icon.x * sinY + icon.z * cosY;
        const rotatedY = icon.y * cosX + rotatedZ * sinX;
        const scale = (rotatedZ + (2 * radius)) / (3 * radius);
        const opacity = Math.max(0.2, Math.min(1, (rotatedZ + (1.5 * radius)) / (2 * radius)));

        ctx.save();
        ctx.translate(
          canvas.width / 2 + rotatedX,
          canvas.height / 2 + rotatedY
        );
        ctx.scale(scale, scale);
        ctx.globalAlpha = opacity;

        if (icons || images) {
          if (
            iconCanvasesRef.current[index] &&
            imagesLoadedRef.current[index]
          ) {
            ctx.drawImage(iconCanvasesRef.current[index], -iconSize / 2, -iconSize / 2, iconSize, iconSize);
          }
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, iconSize / 2, 0, Math.PI * 2);
          ctx.fillStyle = "#4444ff";
          ctx.fill();
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `${Math.round(iconSize * 0.4)}px Arial`;
          ctx.fillText(`${icon.id + 1}`, 0, 0);
        }

        ctx.restore();
      });
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [icons, images, iconPositions, isDragging, mousePos, targetRotation]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="rounded-lg"
      aria-label="Interactive 3D Icon Cloud"
      role="img"
    />
  );
}
