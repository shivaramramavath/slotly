// Tiny controller fixture.
import { Controller, Get, Post, UseGuards } from '@nestjs/common';

@Controller('tiny')
export class TinyController {
  @Get('hello')
  sayHello(): string {
    return 'hello';
  }

  @Post('secure')
  @UseGuards(class MockGuard {})
  doSecure(): boolean {
    return true;
  }
}
