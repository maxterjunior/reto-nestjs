/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsProcessor } from '../../../src/notifications/processors/notifications.processor';
import { EmailService } from '../../../src/notifications/email/email.service';
import { Job } from 'bull';
import { LateArrivalNotificationDto } from '../../../src/notifications/dto/late-arrival-notification.dto';

describe('NotificationsProcessor', () => {
  let processor: NotificationsProcessor;
  let emailService: EmailService;

  const mockEmailService = {
    sendLateArrivalNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsProcessor,
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    })
      .setLogger({
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
      })
      .compile();

    processor = module.get<NotificationsProcessor>(NotificationsProcessor);
    emailService = module.get<EmailService>(EmailService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('handleLateArrival', () => {
    const mockJobData: LateArrivalNotificationDto = {
      employeeId: 1,
      employeeName: 'Juan Pérez',
      scheduledTime: '08:00',
      actualTime: '09:30',
      minutesLate: 90,
      date: '2025-11-20',
      email: 'rrhh@empresa.com',
    };

    const mockJob = {
      id: 1,
      data: mockJobData,
      attemptsMade: 0,
      opts: {},
    } as Job<LateArrivalNotificationDto>;

    it('debe procesar notificación de tardanza exitosamente', async () => {
      mockEmailService.sendLateArrivalNotification.mockResolvedValue(undefined);

      await processor.handleLateArrival(mockJob);

      expect(emailService.sendLateArrivalNotification).toHaveBeenCalledWith({
        employeeName: mockJobData.employeeName,
        scheduledTime: mockJobData.scheduledTime,
        actualTime: mockJobData.actualTime,
        minutesLate: mockJobData.minutesLate,
        date: mockJobData.date,
        email: mockJobData.email,
      });
    });

    it('debe lanzar error si falla el envío del email', async () => {
      const error = new Error('Email sending failed');
      mockEmailService.sendLateArrivalNotification.mockRejectedValue(error);

      await expect(processor.handleLateArrival(mockJob)).rejects.toThrow(
        'Email sending failed',
      );
      expect(emailService.sendLateArrivalNotification).toHaveBeenCalled();
    });

    it('debe llamar al emailService con los datos correctos del job', async () => {
      mockEmailService.sendLateArrivalNotification.mockResolvedValue(undefined);

      await processor.handleLateArrival(mockJob);

      expect(emailService.sendLateArrivalNotification).toHaveBeenCalledTimes(1);
      expect(emailService.sendLateArrivalNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeName: 'Juan Pérez',
          scheduledTime: '08:00',
          actualTime: '09:30',
          minutesLate: 90,
        }),
      );
    });

    it('debe manejar errores de red y relanzarlos para retry', async () => {
      const networkError = new Error('Network timeout');
      mockEmailService.sendLateArrivalNotification.mockRejectedValue(
        networkError,
      );

      await expect(processor.handleLateArrival(mockJob)).rejects.toThrow(
        'Network timeout',
      );
    });

    it('debe procesar múltiples jobs consecutivos correctamente', async () => {
      mockEmailService.sendLateArrivalNotification.mockResolvedValue(undefined);

      const job1 = {
        ...mockJob,
        id: 1,
        data: { ...mockJobData, employeeId: 1 },
      };
      const job2 = {
        ...mockJob,
        id: 2,
        data: { ...mockJobData, employeeId: 2 },
      };

      await processor.handleLateArrival(
        job1 as Job<LateArrivalNotificationDto>,
      );
      await processor.handleLateArrival(
        job2 as Job<LateArrivalNotificationDto>,
      );

      expect(emailService.sendLateArrivalNotification).toHaveBeenCalledTimes(2);
    });
  });
});
