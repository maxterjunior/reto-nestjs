/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../../src/notifications/email/email.service';

describe('EmailService', () => {
  let service: EmailService;
  let mockTransporter: any;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        SMTP_HOST: 'smtp.test.com',
        SMTP_PORT: 587,
        SMTP_SECURE: false,
        SMTP_USER: 'test@test.com',
        SMTP_PASS: 'password123',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    // Mock del transporter
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
      verify: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
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

    service = module.get<EmailService>(EmailService);

    // Override del transporter después de la inicialización
    (service as any).transporter = mockTransporter;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendLateArrivalNotification', () => {
    const notificationData = {
      employeeName: 'Juan Pérez',
      scheduledTime: '08:00',
      actualTime: '09:30',
      minutesLate: 90,
      date: '2025-11-20',
      email: 'rrhh@empresa.com',
    };

    it('debe enviar email de tardanza exitosamente', async () => {
      await service.sendLateArrivalNotification(notificationData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'test@test.com',
          to: 'rrhh@empresa.com',
          subject: expect.stringContaining('Juan Pérez'),
          html: expect.any(String),
        }),
      );
    });

    it('debe incluir información correcta en el email', async () => {
      await service.sendLateArrivalNotification(notificationData);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Juan Pérez');
      expect(callArgs.html).toContain('08:00');
      expect(callArgs.html).toContain('09:30');
      expect(callArgs.html).toContain('90');
      expect(callArgs.html).toContain('2025-11-20');
    });

    it('debe lanzar error si falla el envío del email', async () => {
      const error = new Error('SMTP Error');
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(
        service.sendLateArrivalNotification(notificationData),
      ).rejects.toThrow('SMTP Error');
    });

    it('debe usar la dirección de email configurada como remitente', async () => {
      await service.sendLateArrivalNotification(notificationData);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.from).toBe('test@test.com');
    });

    it('debe formatear el asunto del email correctamente', async () => {
      await service.sendLateArrivalNotification(notificationData);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.subject).toBe('⚠️ Alerta de Tardanza - Juan Pérez');
    });
  });

  describe('verifyConnection', () => {
    it('debe retornar true cuando la conexión SMTP es exitosa', async () => {
      mockTransporter.verify.mockResolvedValue(true);

      const result = await service.verifyConnection();

      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('debe retornar false cuando la conexión SMTP falla', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      const result = await service.verifyConnection();

      expect(result).toBe(false);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('debe manejar errores de verificación sin lanzar excepciones', async () => {
      mockTransporter.verify.mockRejectedValue(
        new Error('Network timeout error'),
      );

      await expect(service.verifyConnection()).resolves.toBe(false);
    });
  });
});
