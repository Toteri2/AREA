import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Bienvenue sur l\'AREA, par contre va sur le front stp';
  }
}
