import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to AREA, but please use the frontend. If you want to see the API docs, go to /api-docs';
  }
}
