/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { lateArrivalEmailTemplate } from './templates/late-arrival.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Configurar el transporter de nodemailer
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendLateArrivalNotification(data: {
    employeeName: string;
    scheduledTime: string;
    actualTime: string;
    minutesLate: number;
    date: string;
    email: string;
  }): Promise<void> {
    try {
      const htmlContent = lateArrivalEmailTemplate({
        employeeName: data.employeeName,
        scheduledTime: data.scheduledTime,
        actualTime: data.actualTime,
        minutesLate: data.minutesLate,
        date: data.date,
      });

      const mailOptions = {
        from: this.configService.get<string>('SMTP_USER'),
        to: data.email,
        subject: `⚠️ Alerta de Tardanza - ${data.employeeName}`,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email de tardanza enviado a ${data.email} para el empleado ${data.employeeName}`,
      );
    } catch (error) {
      this.logger.error(
        `Error al enviar email de tardanza: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Método para verificar la configuración del servicio de email
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Conexión SMTP verificada correctamente');
      return true;
    } catch (error) {
      this.logger.error(
        `Error al verificar conexión SMTP: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
}
