import { useState, type ReactNode } from 'react'
import {
  Bell,
  Check,
  ChevronDown,
  Command as CommandIcon,
  Copy,
  Download,
  FileText,
  MoreHorizontal,
  Palette,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const Panel = ({ title, description, children }: { title: string; description: string; children: ReactNode }) => (
  <section className="min-w-0 rounded-lg border border-border bg-card p-4">
    <div className="space-y-1">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <div className="mt-4">{children}</div>
  </section>
)

const Stack = ({ children }: { children: ReactNode }) => <div className="flex min-w-0 flex-wrap gap-2">{children}</div>

const events = [
  { title: 'Settings updated', detail: 'Theme preference saved', status: 'Live' },
  { title: 'Backup exported', detail: 'tauri-starter-settings-backup.json', status: 'Done' },
  { title: 'Updater checked', detail: 'No release available', status: 'Idle' },
  { title: 'Shortcut registered', detail: 'CommandOrControl+K', status: 'Active' },
  { title: 'Log redacted', detail: 'Sensitive token removed', status: 'Safe' },
  { title: 'Deep link parsed', detail: 'tauri-starter://settings', status: 'Valid' },
]

export const ComponentsPage = () => {
  const [notifications, setNotifications] = useState(true)
  const [compact, setCompact] = useState(false)
  const [density, setDensity] = useState('comfortable')
  const [channel, setChannel] = useState('latest')

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">Components</h1>
          <Badge variant="outline">shadcn/radix</Badge>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Live primitives and common desktop states used across the Tauri renderer.
        </p>
      </header>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Panel title="Actions" description="Button variants, sizes, icon affordances, and disabled states.">
          <div className="space-y-4">
            <Stack>
              <Button>
                <Sparkles /> Primary
              </Button>
              <Button variant="secondary">
                <ShieldCheck /> Secondary
              </Button>
              <Button variant="outline">
                <Download /> Export
              </Button>
              <Button variant="ghost">
                <Copy /> Copy
              </Button>
              <Button variant="destructive">
                <Trash2 /> Delete
              </Button>
            </Stack>
            <Stack>
              <Button size="xs">Extra small</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="More actions">
                <MoreHorizontal />
              </Button>
              <Button disabled>Disabled</Button>
            </Stack>
          </div>
        </Panel>

        <Panel title="Badges and avatars" description="Compact identity, status, and plan indicators.">
          <div className="space-y-4">
            <Stack>
              <Badge>Pro</Badge>
              <Badge variant="secondary">Local</Badge>
              <Badge variant="outline">Beta</Badge>
              <Badge variant="destructive">Action needed</Badge>
              <Badge variant="ghost">Muted</Badge>
            </Stack>
            <div className="flex flex-wrap items-center gap-3">
              <Avatar fallback="Ada Lovelace" className="size-10" />
              <Avatar fallback="Grace Hopper" className="size-10" />
              <Avatar className="size-10" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Ada Lovelace</p>
                <p className="text-xs text-muted-foreground">Product workspace owner</p>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Inputs" description="Form controls with labels, helper copy, validation, and selections.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="component-email">Email</Label>
              <Input id="component-email" type="email" defaultValue="ada@example.com" />
              <p className="text-xs text-muted-foreground">Used for account and support flows.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="component-token">Access token</Label>
              <Input id="component-token" defaultValue="sk_live_redacted" aria-invalid />
              <p className="text-xs text-destructive">Token values are redacted before logging.</p>
            </div>

            <div className="space-y-2">
              <Label>Update channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="component-notifications">Notifications</Label>
                <Switch id="component-notifications" checked={notifications} onCheckedChange={setNotifications} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="component-compact">Compact sidebar</Label>
                <Switch id="component-compact" checked={compact} onCheckedChange={setCompact} />
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Menus" description="Dropdown menus with shortcuts, checkboxes, and radio groups.">
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="max-w-full">
                  Workspace <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  <FileText /> Open logs
                  <DropdownMenuShortcut>Cmd+L</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings /> Settings
                  <DropdownMenuShortcut>Cmd+,</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={notifications} onCheckedChange={setNotifications}>
                  Notifications
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={density} onValueChange={setDensity}>
                  <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export settings backup</DialogTitle>
                  <DialogDescription>
                    A local JSON backup includes preferences and metadata. Secure values stay in the OS keychain.
                  </DialogDescription>
                </DialogHeader>
                <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
                  <p className="font-medium">tauri-starter-settings-backup.json</p>
                  <p className="text-xs text-muted-foreground">Settings version 10</p>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button>
                      <Download /> Export
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Panel>

        <Panel title="Tabs" description="Segmented navigation for settings sections and compact workflows.">
          <Tabs defaultValue="general">
            <TabsList className="grid h-auto w-full grid-cols-1 sm:grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="rounded-md border border-border p-3">
              <div className="flex items-center gap-3">
                <Palette className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Theme and accent</p>
                  <p className="text-xs text-muted-foreground">System theme with amber accent.</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="security" className="rounded-md border border-border p-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Secure storage</p>
                  <p className="text-xs text-muted-foreground">Four protected slots are present.</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="updates" className="rounded-md border border-border p-3">
              <div className="flex items-center gap-3">
                <Download className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Manual checks</p>
                  <p className="text-xs text-muted-foreground">Latest channel, auto checks disabled.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Panel>

        <Panel title="Command" description="Inline command list used by the global command palette.">
          <Command className="rounded-md border border-border">
            <CommandInput placeholder="Search commands..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                <CommandItem>
                  <Search /> Search settings
                  <CommandShortcut>Cmd+K</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Bell /> Send notification
                  <CommandShortcut>N</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <UserRound /> Open account
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </Panel>

        <Panel title="Scroll area" description="Bounded content regions for logs, diagnostics, and long setting lists.">
          <ScrollArea className="h-64 rounded-md border border-border">
            <div className="divide-y divide-border">
              {events.map((event) => (
                <div key={`${event.title}-${event.detail}`} className="flex items-start justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{event.detail}</p>
                  </div>
                  <Badge variant="outline">{event.status}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Panel>

        <Panel title="Composite row" description="A dense app row with status, actions, and secondary metadata.">
          <div className="rounded-md border border-border">
            <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <CommandIcon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">Command palette</p>
                <p className="truncate text-xs text-muted-foreground">Registered global shortcut and route source.</p>
              </div>
              <Badge variant="secondary">
                <Check /> Ready
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 p-3">
              <p className="text-xs text-muted-foreground">CommandOrControl+K</p>
              <Stack>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
                <Button size="sm">Open</Button>
              </Stack>
            </div>
          </div>
        </Panel>
      </div>
    </section>
  )
}
