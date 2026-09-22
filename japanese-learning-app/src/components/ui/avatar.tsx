import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

export function Avatar({
  src,
  alt = 'Avatar',
  fallback,
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const [error, setError] = React.useState(false);
  const initials =
    fallback ||
    (alt
      ? alt
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '?');

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full bg-secondary text-secondary-foreground shadow-sm',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !error ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="aspect-square h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-medium">
          {initials}
        </span>
      )}
    </div>
  );
}
