'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      style={{
        '--normal-bg': '#ffffff',
        '--normal-border': 'var(--border)',
        '--normal-text': 'var(--foreground)',
        '--success-bg': '#ffffff',
        '--success-border': '#bbf7d0',
        '--success-text': '#16a34a',
        '--error-bg': '#ffffff',
        '--error-border': '#fecaca',
        '--error-text': '#dc2626',
        '--warning-bg': '#ffffff',
        '--warning-border': '#fef08a',
        '--warning-text': '#d97706',
        '--info-bg': '#ffffff',
        '--info-border': '#bfdbfe',
        '--info-text': '#2563eb',
      } as React.CSSProperties}
      {...props}
    />
  )
}

export { Toaster }
