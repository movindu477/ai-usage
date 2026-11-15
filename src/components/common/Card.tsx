import type { ReactNode, FC } from 'react';
import clsx from 'clsx';
import { dragWindow } from '../../lib/ipc';

interface CardProps {
  children: ReactNode;
  className?: string;
  width?: number | string;
  height?: number | string;
  padding?: boolean;
}

export const Card: FC<CardProps> = ({
  children,
  className,
  width,
  height,
  padding = true,
}) => {
  return (
    <div
      onMouseDown={(e) => {
        // If the user clicked on any interactive element, do not drag
        const target = e.target as HTMLElement;
        if (target.closest('button, input, textarea, select, a, [data-interactive="true"]')) {
          return;
        }
        dragWindow();
      }}
      className={clsx(
        'card relative flex flex-col box-border select-none text-[var(--color-text-1)]',
        'transition-all duration-300 ease-out shadow-2xl overflow-hidden',
        padding ? 'p-3.5' : 'p-0',
        className
      )}
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
      }}
    >
      {/* Top subtle drag pill indicator */}
      <div
        className="w-8 h-1 rounded-full bg-white/10 mx-auto -mt-1.5 mb-1.5 hover:bg-white/25 transition-colors cursor-grab active:cursor-grabbing shrink-0"
        title="Drag widget"
      />
      {children}
    </div>
  );
};
