/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import bull from 'bull';
import { LateArrivalNotificationDto } from './dto/late-arrival-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue('notifications') private notificationsQueue: bull.Queue,
  ) {}

  async queueLateArrivalNotification(
    data: LateArrivalNotificationDto,
  ): Promise<void> {
    try {
      await this.notificationsQueue.add('late-arrival', data, {
        attempts: 3, // Reintentar hasta 3 veces si falla
        backoff: {
          type: 'exponential',
          delay: 5000, // Esperar 5 segundos antes del primer reintento
        },
        removeOnComplete: true,
        removeOnFail: false,
      });

      this.logger.log(
        `Notificación de tardanza agregada a la cola para: ${data.employeeName}`,
      );
    } catch (error) {
      this.logger.error(
        `Error al agregar notificación a la cola: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
