# Client Shared Components & Lib Code Map

### `client/src/components/error-boundary.tsx`
*React component for error-boundary.*

- **Class** `ErrorBoundary` - Class implementing error boundary.

### `client/src/components/layouts/app-header.tsx`
*Primary application header component implementing sys0 transparent lockup, scroll styling, and plain-text navigation.*

- **Interface** `AppHeaderProps` - Props for AppHeader component.
- **Component** `AppHeader({
  compact = false,
  className = '',
  hasUnreadNotifications = true,
}: import("E:/Shiva Ram/Projects/slotly/client/src/components/layouts/app-header").AppHeaderProps)` - React component rendering responsive app header with wordmark lockup, plain nav, and user avatar.

### `client/src/components/layouts/app-layout.tsx`
*React component for app-layout composing AppHeader, PageContainer, and auth protection.*

- **Interface** `AppLayoutProps` - Interface defining structure for app layout props.
- **Component** `AppLayout({
  children,
  compact = false,
  fluid = false,
}: import("E:/Shiva Ram/Projects/slotly/client/src/components/layouts/app-layout").AppLayoutProps)` - React component rendering app layout with authentication route protection and sys0 styling.

### `client/src/components/layouts/app-nav.tsx`
*Main navigation bar component rendering plain-text active-underlined route links.*

- **Interface** `AppNavProps` - Props for AppNav component.
- **Function** `isNavActive(pathname: string | null | undefined, targetHref: string)`: `boolean` - Helper determining whether a navigation link matches current path by first segment.
- **Component** `AppNav({
  className = '',
  onLinkClick,
  orientation = 'horizontal',
}: import("E:/Shiva Ram/Projects/slotly/client/src/components/layouts/app-nav").AppNavProps)` - React component rendering accessible, plain-text header navigation.

### `client/src/components/layouts/auth-layout.tsx`
*React component for auth-layout.*

- **Component** `AuthLayout({
  children,
  subtitle,
}: { children: React.ReactNode; subtitle?: string | undefined; })` - React component rendering auth layout.

### `client/src/components/layouts/page-container.tsx`
*Reusable page container constraining layout to visual specification width and padding.*

- **Interface** `PageContainerProps` extends `HTMLAttributes<HTMLDivElement>` - Props for PageContainer component.
- **Component** `PageContainer({
  children,
  fluid = false,
  className = '',
  ...props
}: import("E:/Shiva Ram/Projects/slotly/client/src/components/layouts/page-container").PageContainerProps)` - React component rendering constrained or fluid page container.

### `client/src/components/layouts/page-header.tsx`
*Reusable page header component matching sys0 visual hierarchy specifications.*

- **Interface** `PageHeaderProps` - Props for PageHeader component.
- **Component** `PageHeader({
  title,
  description,
  actions,
  className = '',
}: import("E:/Shiva Ram/Projects/slotly/client/src/components/layouts/page-header").PageHeaderProps)` - React component rendering standard page header with title, description, and action controls.
- **Component** `PageHeaderSkeleton({ className = '' }: { className?: string | undefined; })` - Skeleton placeholder component for PageHeader during loading state.

### `client/src/components/layouts/public-layout.tsx`
*React component for public-layout.*

- **Component** `PublicLayout({ children }: { children: React.ReactNode; })` - React component rendering public layout.

### `client/src/components/layouts/user-menu.tsx`
*User profile avatar dropdown menu component matching sys0 visual header standards.*

- **Component** `UserMenu()` - React component rendering 32px circular avatar with user dropdown actions.

### `client/src/components/ui/badge.tsx`
*React component for badge.*

- **Interface** `BadgeProps` extends `React.HTMLAttributes<HTMLSpanElement>` - Interface defining structure for badge props.
- **Component** `Badge({ className, variant = 'neutral', ...props }: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/badge").BadgeProps)` - React component rendering badge.

### `client/src/components/ui/button.tsx`
*React component for button.*

- **Interface** `ButtonProps` extends `React.ButtonHTMLAttributes<HTMLButtonElement>` - Interface defining structure for button props.
- **Const** `Button`: `React.ForwardRefExoticComponent<import("E:/Shiv...` - Constant representing button.

### `client/src/components/ui/card.tsx`
*React component for card.*

- **Component** `Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)` - React component rendering card.
- **Component** `CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)` - React component rendering card header.
- **Component** `CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>)` - React component rendering card title.
- **Component** `CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>)` - React component rendering card description.
- **Component** `CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)` - React component rendering card content.
- **Component** `CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)` - React component rendering card footer.

### `client/src/components/ui/checkbox.tsx`
*React component for checkbox.*

- **Interface** `CheckboxProps` extends `Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>` - Interface defining structure for checkbox props.
- **Const** `Checkbox`: `React.ForwardRefExoticComponent<import("E:/Shiv...` - Constant representing checkbox.

### `client/src/components/ui/combobox.tsx`
*React component for combobox.*

- **Interface** `ComboboxOption` - Interface defining structure for combobox option.
- **Interface** `ComboboxProps` - Interface defining structure for combobox props.
- **Component** `Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className,
}: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/combobox").ComboboxProps)` - React component rendering combobox.

### `client/src/components/ui/confirm-dialog.tsx`
*React component for confirm-dialog.*

- **Interface** `ConfirmDialogProps` - Interface defining structure for confirm dialog props.
- **Component** `ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
}: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/confirm-dialog").ConfirmDialogProps)` - React component rendering confirm dialog.

### `client/src/components/ui/dialog.tsx`
*React component for dialog.*

- **Interface** `DialogProps` - Interface defining structure for dialog props.
- **Component** `Dialog({ open, onOpenChange, children }: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/dialog").DialogProps)` - React component rendering dialog.
- **Component** `DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)` - React component rendering dialog header.
- **Component** `DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>)` - React component rendering dialog title.
- **Component** `DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>)` - React component rendering dialog description.
- **Component** `DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)` - React component rendering dialog footer.

### `client/src/components/ui/empty-state.tsx`
*React component for empty-state.*

- **Interface** `EmptyStateProps` - Interface defining structure for empty state props.
- **Component** `EmptyState({ icon, title, description, action, className }: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/empty-state").EmptyStateProps)` - React component rendering empty state.

### `client/src/components/ui/input.tsx`
*React component for input.*

- **Type** `InputProps` - Type alias for input props.
- **Const** `Input`: `React.ForwardRefExoticComponent<import("E:/Shiv...` - Constant representing input.

### `client/src/components/ui/kbd.tsx`
*React component for kbd.*

- **Component** `Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>)` - React component rendering kbd.

### `client/src/components/ui/logo.tsx`
*React component for logo.*

- **Interface** `LogoProps` - Interface defining structure for logo props.
- **Component** `Logo({ className, href = '/' }: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/logo").LogoProps)` - React component rendering logo.

### `client/src/components/ui/progress-bars.tsx`
*Three-bar progression indicator glyph component matching visual specification.*

- **Interface** `BarIndicatorConfig` - Configuration describing active count and color token for progress bars.
- **Interface** `ProgressBarsProps` - Props for ProgressBars component.
- **Function** `getIndicatorConfig(status: "draft" | "building" | "ready" | "pending_approval" | "published" | "archived")`: `import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/progress-bars").BarIndicatorConfig` - Pure helper mapping project lifecycle status to bar indicator count and color token.
- **Component** `ProgressBars({ status, className = '' }: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/progress-bars").ProgressBarsProps)` - React component rendering three-bar indicator glyph with increasing heights (6px, 10px, 14px).

### `client/src/components/ui/select.tsx`
*React component for select.*

- **Type** `SelectProps` - Type alias for select props.
- **Const** `Select`: `React.ForwardRefExoticComponent<import("E:/Shiv...` - Constant representing select.

### `client/src/components/ui/sheet.tsx`
*React component for sheet.*

- **Interface** `SheetProps` - Interface defining structure for sheet props.
- **Component** `Sheet({ open, onOpenChange, side = 'right', children }: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/sheet").SheetProps)` - React component rendering sheet.
- **Component** `SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)` - React component rendering sheet header.
- **Component** `SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>)` - React component rendering sheet title.
- **Component** `SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>)` - React component rendering sheet description.

### `client/src/components/ui/skeleton.tsx`
*React component for skeleton.*

- **Component** `Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)` - React component rendering skeleton.

### `client/src/components/ui/status-indicator.tsx`
*Status indicator component combining progress bars with monospace status label.*

- **Interface** `StatusIndicatorProps` - Props for StatusIndicator component.
- **Function** `formatStatusLabel(status: "draft" | "building" | "ready" | "pending_approval" | "published" | "archived", blueprintProgress: number | null | undefined)`: `string` - Formats lifecycle status and optional blueprint completion into standard label.
- **Component** `StatusIndicator({
  status,
  blueprintProgress,
  className = '',
}: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/status-indicator").StatusIndicatorProps)` - React component rendering three-bar status glyph paired with monospace text label.

### `client/src/components/ui/surface-card.tsx`
*Reusable surface card container implementing 20px radius, 24px padding, and focus-within ring.*

- **Interface** `SurfaceCardProps` extends `HTMLAttributes<HTMLDivElement>` - Props for SurfaceCard component.
- **Component** `SurfaceCard({
  variant = 'static',
  flush = false,
  children,
  className = '',
  ...props
}: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/surface-card").SurfaceCardProps)` - React component rendering 20px radius surface card matching sys0 visual guidelines.

### `client/src/components/ui/switch.tsx`
*React component for switch.*

- **Interface** `SwitchProps` extends `Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>` - Interface defining structure for switch props.
- **Const** `Switch`: `React.ForwardRefExoticComponent<import("E:/Shiv...` - Constant representing switch.

### `client/src/components/ui/table.tsx`
*React component for table.*

- **Component** `Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>)` - React component rendering table.
- **Component** `TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>)` - React component rendering table header.
- **Component** `TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>)` - React component rendering table body.
- **Component** `TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>)` - React component rendering table row.
- **Component** `TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>)` - React component rendering table head.
- **Component** `TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>)` - React component rendering table cell.

### `client/src/components/ui/tabs.tsx`
*React component for tabs.*

- **Interface** `TabsProps` - Interface defining structure for tabs props.
- **Interface** `TabsTriggerProps` extends `React.ButtonHTMLAttributes<HTMLButtonElement>` - Interface defining structure for tabs trigger props.
- **Interface** `TabsContentProps` extends `React.HTMLAttributes<HTMLDivElement>` - Interface defining structure for tabs content props.
- **Component** `Tabs({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  children,
  className,
}: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/tabs").TabsProps)` - React component rendering tabs.
- **Component** `TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)` - React component rendering tabs list.
- **Component** `TabsTrigger({ value, className, children, ...props }: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/tabs").TabsTriggerProps)` - React component rendering tabs trigger.
- **Component** `TabsContent({ value, className, children, ...props }: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/tabs").TabsContentProps)` - React component rendering tabs content.

### `client/src/components/ui/toast.tsx`
*React component for toast.*

- **Interface** `ToastItem` - Interface defining structure for toast item.
- **Type** `ToastVariant` - Type alias for toast variant.
- **Component** `ToastContainer()` - React component rendering toast container.
- **Zustand Store** `useToastStore` (actions: addToast, removeToast) - Zustand store managing use toast store state.
- **Const** `toast`: `{ success: (title: string, description?: string...` - Constant representing toast.

### `client/src/components/ui/tooltip.tsx`
*React component for tooltip.*

- **Interface** `TooltipProps` - Interface defining structure for tooltip props.
- **Component** `Tooltip({ content, children, className }: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/tooltip").TooltipProps)` - React component rendering tooltip.

### `client/src/lib/api-client.ts`
*Core implementation for api-client with single-flight refresh, cross-tab locks, replay validation, and cleanup.*

- **Function** `setAccessToken(token: string | null)`: `void` - Sets the active in-memory access token and resets proactive refresh scheduling.
- **Function** `getAccessToken()`: `string | null` - Returns the active in-memory access token.
- **Function** `silentRefresh()`: `Promise<string>` - Silently refreshes the access token using the httpOnly cookie.
- **Function** `apiClient(endpoint: string, options: RequestInit)`: `Promise<T>` - Dispatches HTTP requests with automatic auth headers, single-flight refresh on 401, and safe retry.

### `client/src/lib/query-provider.tsx`
*Core implementation for query-provider in client/src/lib.*

- **Component** `QueryProvider({ children }: { children: React.ReactNode; })` - React component rendering query provider.

### `client/src/lib/utils.ts`
*Core implementation for utils in client/src/lib.*

- **Function** `cn(inputs: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/clsx").ClassValue[])`: `string` - Function performing cn.

