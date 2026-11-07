# Golden Fixture Output

### `server/src/modules/sample/sample.controller.ts`
*Tiny controller fixture.*

- **Controller** `TinyController` (base: `/tiny`)
  - `GET /tiny/hello` -> `sayHello()`
  - `POST /tiny/secure` -> `doSecure()` [guards: class MockGuard {}]

### `server/src/modules/sample/sample.gateway.ts`
*Tiny websocket gateway fixture.*

- **Gateway** `TinyGateway` (namespace: `/tiny`)
  - `/tiny: ping` -> `handlePing()`

### `server/src/modules/sample/sample.processor.ts`
*Tiny queue processor fixture.*

- **Queue Processor** `TinyProcessor` (queue: `tiny-queue`)
  - `tiny-queue: tiny-job` -> `TinyProcessor.handleJob()`

### `server/src/modules/sample/sample.schema.ts`
*Tiny mongoose schema fixture.*

- **Mongoose Schema** `TinyItem` (collection: `tiny_items` (indexes: code))

### `packages/contracts/src/sample.ts`
*Tiny zod schema fixture.*

- **Type** `TinyItem`
- **Zod Schema** `TinyItemSchema` -> `TinyItem`

### `client/src/features/sample/hooks/use-tiny.ts`
*Tiny react hook fixture.*

- **Hook** `useTinyCounter(initial: number)`: `number`

### `client/src/app/(dashboard)/@modal/sample/page.tsx`
*Tiny next page with slot fixture.*

- **Route Page:** `/slot:@modal/sample` -> renders `default`
- **Component** `TinyModalPage()`

