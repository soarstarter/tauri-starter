import { Toaster as SonnerToaster, toast } from 'sonner'

type ToasterProps = React.ComponentProps<typeof SonnerToaster>

export const Toaster = (props: ToasterProps) => (
  <SonnerToaster
    theme="system"
    richColors
    closeButton
    toastOptions={{
      classNames: {
        toast:
          'group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border',
      },
    }}
    {...props}
  />
)

export { toast }
