// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import type { LucideIcon } from 'lucide-react'

export type CapabilityCategory = 'shell' | 'system' | 'data' | 'ops'
export type CapabilityStatus = 'live' | 'packaged-only' | 'os-specific'

export interface TemplateCapability {
  id: string
  labelKey: string
  summaryKey: string
  category: CapabilityCategory
  icon: LucideIcon
  route?: string
  status: CapabilityStatus
  /** Repo paths a buyer should read, shown on the demo page. */
  sourceFiles?: string[]
}
