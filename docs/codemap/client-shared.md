# Client Shared Components & Lib Code Map

### `client/src/components/error-boundary.tsx`
*React component for error-boundary.*

- **Class** `ErrorBoundary` - Class implementing error boundary.

### `client/src/components/layouts/app-layout.tsx`
*React component for app-layout.*

- **Interface** `AppLayoutProps` - Interface defining structure for app layout props.
- **Component** `AppLayout({ children, activePath = '/dashboard' }: import("E:/Shiva Ram/Projects/slotly/client/src/components/layouts/app-layout").AppLayoutProps)` - React component rendering app layout.

### `client/src/components/layouts/auth-layout.tsx`
*React component for auth-layout.*

- **Component** `AuthLayout({
  children,
  subtitle,
}: { children: React.ReactNode; subtitle?: string | undefined; })` - React component rendering auth layout.

### `client/src/components/layouts/public-layout.tsx`
*React component for public-layout.*

- **Component** `PublicLayout({ children }: { children: React.ReactNode; })` - React component rendering public layout.

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
- **Component** `CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>)` - React component rendering card description.
- **Component** `CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)` - React component rendering card content.
- **Component** `CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)` - React component rendering card footer.

### `client/src/components/ui/checkbox.tsx`
*React component for checkbox.*

- **Interface** `CheckboxProps` extends `Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange'
>` - Interface defining structure for checkbox props.
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

### `client/src/components/ui/switch.tsx`
*React component for switch.*

- **Interface** `SwitchProps` extends `Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>` - Interface defining structure for switch props.
- **Const** `Switch`: `React.ForwardRefExoticComponent<import("E:/Shiv...` - Constant representing switch.

### `client/src/components/ui/table.tsx`
*React component for table.*

- **Component** `Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>)` - React component rendering table.
- **Component** `TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>)` - React component rendering table header.
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
*Core implementation for api-client in client/src/lib.*

- **Function** `setAccessToken(token: string | null)`: `void` - Function performing set access token.
- **Function** `getAccessToken()`: `string | null` - Function performing get access token.
- **Function** `apiClient(endpoint: string, options: RequestInit)`: `Promise<T>` - Function performing api client.

### `client/src/lib/query-provider.tsx`
*Core implementation for query-provider in client/src/lib.*

- **Component** `QueryProvider({ children }: { children: React.ReactNode; })` - React component rendering query provider.

### `client/src/lib/utils.ts`
*Core implementation for utils in client/src/lib.*

- **Function** `cn(inputs: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/clsx").ClassValue[])`: `string` - Function performing cn.

