import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  fallback?: string | null
  className?: string
  alt?: string
}

const initialsFor = (value?: string | null): string => {
  if (!value) return ''
  const cleaned = value.trim()
  if (!cleaned) return ''
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const Avatar = ({ src, fallback, className, alt = '' }: AvatarProps) => {
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    setErrored(false)
  }, [src])

  const initials = initialsFor(fallback)
  const showImage = Boolean(src) && !errored

  return (
    <div
      role="img"
      aria-label={alt || fallback || 'avatar'}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-muted text-muted-foreground',
        className
      )}
    >
      {showImage ? (
        <img src={src ?? undefined} alt={alt} className="h-full w-full object-cover" onError={() => setErrored(true)} />
      ) : initials ? (
        <span className="text-[0.65em] font-semibold uppercase tracking-wide">{initials}</span>
      ) : (
        <User className="h-1/2 w-1/2" aria-hidden />
      )}
    </div>
  )
}
