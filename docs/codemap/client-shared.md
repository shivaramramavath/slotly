# Client Shared Components & Lib Code Map

### `client/src/components/error-boundary.tsx`
*(no description)*

- **Class** `ErrorBoundary`

### `client/src/components/layouts/app-layout.tsx`
*(no description)*

- **Interface** `AppLayoutProps`
- **Component** `AppLayout({ children, activePath = '/dashboard' }: import("E:/Shiva Ram/Projects/slotly/client/src/components/layouts/app-layout").AppLayoutProps)`

### `client/src/components/layouts/auth-layout.tsx`
*(no description)*

- **Component** `AuthLayout({
  children,
  subtitle,
}: { children: React.ReactNode; subtitle?: string | undefined; })`

### `client/src/components/layouts/public-layout.tsx`
*(no description)*

- **Component** `PublicLayout({ children }: { children: React.ReactNode; })`

### `client/src/components/ui/badge.tsx`
*(no description)*

- **Interface** `BadgeProps` extends `React.HTMLAttributes<HTMLSpanElement>`
- **Component** `Badge({ className, variant = 'neutral', ...props }: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/badge").BadgeProps)`

### `client/src/components/ui/button.tsx`
*(no description)*

- **Interface** `ButtonProps` extends `React.ButtonHTMLAttributes<HTMLButtonElement>`
- **Const** `Button`: `React.ForwardRefExoticComponent<import("E:/Shiv...`

### `client/src/components/ui/card.tsx`
*(no description)*

- **Component** `Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)`
- **Component** `CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)`
- **Component** `CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>)`
- **Component** `CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>)`
- **Component** `CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)`
- **Component** `CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)`

### `client/src/components/ui/checkbox.tsx`
*(no description)*

- **Interface** `CheckboxProps` extends `Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>`
- **Const** `Checkbox`: `React.ForwardRefExoticComponent<import("E:/Shiv...`

### `client/src/components/ui/combobox.tsx`
*(no description)*

- **Interface** `ComboboxOption`
- **Interface** `ComboboxProps`
- **Component** `Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className,
}: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/combobox").ComboboxProps)`

### `client/src/components/ui/confirm-dialog.tsx`
*(no description)*

- **Interface** `ConfirmDialogProps`
- **Component** `ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
}: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/confirm-dialog").ConfirmDialogProps)`

### `client/src/components/ui/dialog.tsx`
*(no description)*

- **Interface** `DialogProps`
- **Component** `Dialog({ open, onOpenChange, children }: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/dialog").DialogProps)`
- **Component** `DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)`
- **Component** `DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>)`
- **Component** `DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>)`
- **Component** `DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)`

### `client/src/components/ui/empty-state.tsx`
*(no description)*

- **Interface** `EmptyStateProps`
- **Component** `EmptyState({ icon, title, description, action, className }: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/empty-state").EmptyStateProps)`

### `client/src/components/ui/input.tsx`
*(no description)*

- **Type** `InputProps`
- **Const** `Input`: `React.ForwardRefExoticComponent<import("E:/Shiv...`

### `client/src/components/ui/kbd.tsx`
*(no description)*

- **Component** `Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>)`

### `client/src/components/ui/logo.tsx`
*(no description)*

- **Interface** `LogoProps`
- **Component** `Logo({ className, href = '/' }: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/logo").LogoProps)`

### `client/src/components/ui/select.tsx`
*(no description)*

- **Type** `SelectProps`
- **Const** `Select`: `React.ForwardRefExoticComponent<import("E:/Shiv...`

### `client/src/components/ui/sheet.tsx`
*(no description)*

- **Interface** `SheetProps`
- **Component** `Sheet({ open, onOpenChange, side = 'right', children }: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/sheet").SheetProps)`
- **Component** `SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)`
- **Component** `SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>)`
- **Component** `SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>)`

### `client/src/components/ui/skeleton.tsx`
*(no description)*

- **Component** `Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)`

### `client/src/components/ui/switch.tsx`
*(no description)*

- **Interface** `SwitchProps` extends `Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>`
- **Const** `Switch`: `React.ForwardRefExoticComponent<import("E:/Shiv...`

### `client/src/components/ui/table.tsx`
*(no description)*

- **Component** `Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>)`
- **Component** `TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>)`
- **Component** `TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>)`
- **Component** `TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>)`
- **Component** `TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>)`
- **Component** `TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>)`

### `client/src/components/ui/tabs.tsx`
*(no description)*

- **Interface** `TabsProps`
- **Interface** `TabsTriggerProps` extends `React.ButtonHTMLAttributes<HTMLButtonElement>`
- **Interface** `TabsContentProps` extends `React.HTMLAttributes<HTMLDivElement>`
- **Component** `Tabs({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  children,
  className,
}: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/tabs").TabsProps)`
- **Component** `TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)`
- **Component** `TabsTrigger({ value, className, children, ...props }: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/tabs").TabsTriggerProps)`
- **Component** `TabsContent({ value, className, children, ...props }: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/tabs").TabsContentProps)`

### `client/src/components/ui/toast.tsx`
*(no description)*

- **Interface** `ToastItem`
- **Type** `ToastVariant`
- **Component** `ToastContainer()`
- **Zustand Store** `useToastStore` (actions: addToast, removeToast)
- **Const** `toast`: `{ success: (title: string, description?: string...`

### `client/src/components/ui/tooltip.tsx`
*(no description)*

- **Interface** `TooltipProps`
- **Component** `Tooltip({ content, children, className }: import("E:/Shiva Ram/Projects/slotly/client/src/components/ui/tooltip").TooltipProps)`

### `client/src/lib/api-client.ts`
*(no description)*

- **Function** `setAccessToken(token: string | null)`: `void`
- **Function** `getAccessToken()`: `string | null`
- **Function** `apiClient(endpoint: string, options: RequestInit)`: `Promise<T>`

### `client/src/lib/query-provider.tsx`
*(no description)*

- **Component** `QueryProvider({ children }: { children: React.ReactNode; })`

### `client/src/lib/utils.ts`
*(no description)*

- **Function** `cn(inputs: import("E:/Shiva Ram/Projects/slotly/node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/clsx").ClassValue[])`: `string`

