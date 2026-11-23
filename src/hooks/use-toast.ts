import { toast } from '@/components/ui/sonner'

export type Toast = typeof toast

export const useToast = (): Toast => toast

export { toast }
