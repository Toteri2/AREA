import { Injectable } from '@nestjs/common';


@Injectable()
export class GmailService {

  findAll() {
    return `This action returns all gmail`;
  }

  findOne(id: number) {
    return `This action returns a #${id} gmail`;
  }

  remove(id: number) {
    return `This action removes a #${id} gmail`;
  }
}
