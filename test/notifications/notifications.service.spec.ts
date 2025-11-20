/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { getQueueToken } from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';
import { LateArrivalNotificationDto } from '../../src/notifications/dto/late-arrival-notification.dto';
import { NotificationsService } from '../../src/notifications/notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getQueueToken('notifications'),
          useValue: mockQueue,
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

    service = module.get<NotificationsService>(NotificationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('queueLateArrivalNotification', () => {
    const mockNotificationData: LateArrivalNotificationDto = {
      employeeId: 1,
      employeeName: 'Juan Pérez',
      scheduledTime: '08:00',
      actualTime: '09:30',
      minutesLate: 90,
      date: '2025-11-20',
      email: 'rrhh@empresa.com',
    };

    it('debe agregar notificación a la cola exitosamente', async () => {
      mockQueue.add.mockResolvedValue({ id: 1 });

      await service.queueLateArrivalNotification(mockNotificationData);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'late-arrival',
        mockNotificationData,
        expect.objectContaining({
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        }),
      );
    });

    it('debe lanzar error si falla al agregar a la cola', async () => {
      const error = new Error('Queue error');
      mockQueue.add.mockRejectedValue(error);

      await expect(
        service.queueLateArrivalNotification(mockNotificationData),
      ).rejects.toThrow('Queue error');
    });

    it('debe configurar reintentos correctamente', async () => {
      mockQueue.add.mockResolvedValue({ id: 1 });

      await service.queueLateArrivalNotification(mockNotificationData);

      const callArgs = mockQueue.add.mock.calls[0][2];
      expect(callArgs.attempts).toBe(3);
      expect(callArgs.backoff).toEqual({
        type: 'exponential',
        delay: 5000,
      });
    });
  });
});
