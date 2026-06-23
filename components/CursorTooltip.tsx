"use client";

import { useState, useCallback } from "react";

type Props = {
  text: string;
  enabled: boolean;
  children: React.ReactNode;
};

export default function CursorTooltip({ text, enabled, children }: Props) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  const onMove = useCallback((e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <div
      onMouseMove={enabled ? onMove : undefined}
      onMouseEnter={enabled ? () => setVisible(true) : undefined}
      onMouseLeave={enabled ? () => setVisible(false) : undefined}
    >
      {children}
      {enabled && visible && (
        <div
          className="fixed z-50 pointer-events-none text-xs text-white/80 bg-black/70 backdrop-blur-sm rounded-md px-2.5 py-1 whitespace-nowrap"
          style={{ left: pos.x + 14, top: pos.y + 14 }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
