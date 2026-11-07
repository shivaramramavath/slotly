// Tiny websocket gateway fixture.
import { WebSocketGateway, SubscribeMessage } from '@nestjs/websockets';

@WebSocketGateway({ namespace: '/tiny' })
export class TinyGateway {
  @SubscribeMessage('ping')
  handlePing(): string {
    return 'pong';
  }
}
