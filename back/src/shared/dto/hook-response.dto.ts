export class HookResponseDto {
  id: number;
  userId: number;
  service: string;
  eventType?: number;
  lastHistoryId?: string;

  constructor(partial: Partial<HookResponseDto>) {
    Object.assign(this, partial);
  }
}
