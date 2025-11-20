/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EmailService } from '../email/email.service';
import { LateArrivalNotificationDto } from '../dto/late-arrival-notification.dto';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  @Process('late-arrival')
  async handleLateArrival(job: Job<LateArrivalNotificationDto>) {
    this.logger.log(
      `Procesando notificación de tardanza para empleado: ${job.data.employeeName}`,
    );

    try {
      await this.emailService.sendLateArrivalNotification({
        employeeName: job.data.employeeName,
        scheduledTime: job.data.scheduledTime,
        actualTime: job.data.actualTime,
        minutesLate: job.data.minutesLate,
        date: job.data.date,
        email: job.data.email,
      });

      this.logger.log(
        `Notificación de tardanza procesada exitosamente para: ${job.data.employeeName}`,
      );
    } catch (error) {
      this.logger.error(
        `Error al procesar notificación de tardanza: ${error.message}`,
        error.stack,
      );
      throw error; // Bull reintentará el job
    }
  }
}
