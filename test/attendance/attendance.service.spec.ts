/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceService } from '../../src/attendance/attendance.service';
import {
  Attendance,
  AttendanceType,
} from '../../src/attendance/entities/attendance.entity';
import { Employee } from '../../src/employees/entities/employee.entity';
import { NotificationsService } from '../../src/notifications/notifications.service';
import { CreateAttendanceDto } from '../../src/attendance/dto/create-attendance.dto';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceRepository: Repository<Attendance>;
  let employeeRepository: Repository<Employee>;
  let notificationsService: NotificationsService;

  const mockAttendanceRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockEmployeeRepository = {
    findOne: jest.fn(),
  };

  const mockNotificationsService = {
    queueLateArrivalNotification: jest.fn(),
  };

  const mockEmployee = {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    numeroDocumento: '12345678',
    email: 'juan@test.com',
    shift: {
      id: 1,
      nombre: 'Turno Mañana',
      horaInicio: '08:00',
      horaFin: '16:00',
      toleranciaMinutos: 15,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getRepositoryToken(Attendance),
          useValue: mockAttendanceRepository,
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: mockEmployeeRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
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

    service = module.get<AttendanceService>(AttendanceService);
    attendanceRepository = module.get<Repository<Attendance>>(
      getRepositoryToken(Attendance),
    );
    employeeRepository = module.get<Repository<Employee>>(
      getRepositoryToken(Employee),
    );
    notificationsService =
      module.get<NotificationsService>(NotificationsService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('marcarEntrada', () => {
    const createEntradaDto: CreateAttendanceDto = {
      employeeId: 1,
      tipo: AttendanceType.ENTRADA,
      latitud: -12.046374,
      longitud: -77.042793,
      horaRegistro: '2025-11-20T08:00:00.000Z',
    };

    it('debe registrar una entrada exitosamente', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      mockAttendanceRepository.findOne.mockResolvedValue(null);
      mockAttendanceRepository.create.mockReturnValue({
        ...createEntradaDto,
        id: 1,
      });
      mockAttendanceRepository.save.mockResolvedValue({
        ...createEntradaDto,
        id: 1,
      });

      const result = await service.marcarEntrada(createEntradaDto);

      expect(result).toBeDefined();
      expect(employeeRepository.findOne).toHaveBeenCalledWith({
        where: { id: createEntradaDto.employeeId },
      });
      expect(attendanceRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el empleado no existe', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(null);

      await expect(service.marcarEntrada(createEntradaDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(employeeRepository.findOne).toHaveBeenCalledWith({
        where: { id: createEntradaDto.employeeId },
      });
    });

    it('debe lanzar BadRequestException si la hora es futura', async () => {
      const futureDto = {
        ...createEntradaDto,
        horaRegistro: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);

      await expect(service.marcarEntrada(futureDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException si ya existe una entrada sin salida', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      mockAttendanceRepository.findOne
        .mockResolvedValueOnce({
          id: 1,
          employeeId: 1,
          tipo: AttendanceType.ENTRADA,
          horaRegistro: new Date('2025-11-20T08:00:00.000Z'),
        })
        .mockResolvedValueOnce(null);

      await expect(service.marcarEntrada(createEntradaDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe enviar notificación cuando la tardanza es >= 60 minutos', async () => {
      // Usar una fecha del pasado para evitar error de fecha futura
      const fechaPasada = new Date();
      fechaPasada.setDate(fechaPasada.getDate() - 1); // Ayer
      fechaPasada.setHours(9, 30, 0, 0); // 9:30 AM

      const lateDto = {
        ...createEntradaDto,
        horaRegistro: fechaPasada.toISOString(), // 90 minutos tarde (si el turno es 08:00)
      };

      const savedAttendance = {
        id: 1,
        employeeId: 1,
        tipo: AttendanceType.ENTRADA,
        latitud: -12.046374,
        longitud: -77.042793,
        horaRegistro: fechaPasada,
        employee: null,
      };

      // Mock para verificar empleado inicial y obtener shift
      mockEmployeeRepository.findOne
        .mockResolvedValueOnce(mockEmployee)
        .mockResolvedValueOnce({
          ...mockEmployee,
          shift: mockEmployee.shift,
        });
      // Mock para buscar ultimaEntrada
      mockAttendanceRepository.findOne.mockResolvedValueOnce(null);
      mockAttendanceRepository.create.mockReturnValue(savedAttendance);
      mockAttendanceRepository.save.mockResolvedValue(savedAttendance);
      mockNotificationsService.queueLateArrivalNotification.mockResolvedValue(
        undefined,
      );

      await service.marcarEntrada(lateDto);

      expect(
        notificationsService.queueLateArrivalNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: mockEmployee.id,
          employeeName: `${mockEmployee.nombre} ${mockEmployee.apellido}`,
          minutesLate: expect.any(Number),
        }),
      );
    });

    it('no debe enviar notificación cuando la tardanza es < 60 minutos', async () => {
      const onTimeDto = {
        ...createEntradaDto,
        horaRegistro: '2025-11-20T08:10:00.000Z', // 10 minutos tarde
      };

      mockEmployeeRepository.findOne
        .mockResolvedValueOnce(mockEmployee)
        .mockResolvedValueOnce({
          ...mockEmployee,
          shift: mockEmployee.shift,
        });
      mockAttendanceRepository.findOne.mockResolvedValue(null);
      mockAttendanceRepository.create.mockReturnValue({ ...onTimeDto, id: 1 });
      mockAttendanceRepository.save.mockResolvedValue({ ...onTimeDto, id: 1 });

      await service.marcarEntrada(onTimeDto);

      expect(
        notificationsService.queueLateArrivalNotification,
      ).not.toHaveBeenCalled();
    });
  });

  describe('marcarSalida', () => {
    const createSalidaDto: CreateAttendanceDto = {
      employeeId: 1,
      tipo: AttendanceType.SALIDA,
      latitud: -12.046374,
      longitud: -77.042793,
      horaRegistro: '2025-11-20T16:00:00.000Z',
    };

    it('debe registrar una salida exitosamente', async () => {
      const mockEntrada = {
        id: 1,
        employeeId: 1,
        tipo: AttendanceType.ENTRADA,
        horaRegistro: new Date('2025-11-20T08:00:00.000Z'),
        latitud: -12.046374,
        longitud: -77.042793,
        employee: null,
      };

      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      // Mock para buscar entrada del mismo día y salida (2 llamadas)
      mockAttendanceRepository.findOne
        .mockResolvedValueOnce(mockEntrada) // entradaMismoDia
        .mockResolvedValueOnce(null); // salidaMismoDia no existe
      mockAttendanceRepository.create.mockReturnValue({
        ...createSalidaDto,
        id: 2,
      });
      mockAttendanceRepository.save.mockResolvedValue({
        ...createSalidaDto,
        id: 2,
      });

      const result = await service.marcarSalida(createSalidaDto);

      expect(result).toBeDefined();
      expect(attendanceRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el empleado no existe', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(null);

      await expect(service.marcarSalida(createSalidaDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar BadRequestException si no hay entrada del mismo día', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      // Mock para que no encuentre entrada del mismo día
      mockAttendanceRepository.findOne.mockResolvedValue(null);

      await expect(service.marcarSalida(createSalidaDto)).rejects.toThrow(
        'No hay una entrada registrada para marcar salida',
      );
    });

    it('debe lanzar BadRequestException si ya existe una salida para la entrada', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      mockAttendanceRepository.findOne
        .mockResolvedValueOnce({
          id: 1,
          employeeId: 1,
          tipo: AttendanceType.ENTRADA,
          horaRegistro: new Date('2025-11-20T08:00:00.000Z'),
        })
        .mockResolvedValueOnce({
          id: 2,
          employeeId: 1,
          tipo: AttendanceType.SALIDA,
          horaRegistro: new Date('2025-11-20T16:00:00.000Z'),
        });

      await expect(service.marcarSalida(createSalidaDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar BadRequestException si la salida es anterior a la entrada', async () => {
      const invalidSalidaDto = {
        ...createSalidaDto,
        horaRegistro: '2025-11-20T07:00:00.000Z', // Antes de la entrada
      };

      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      mockAttendanceRepository.findOne
        .mockResolvedValueOnce({
          id: 1,
          employeeId: 1,
          tipo: AttendanceType.ENTRADA,
          horaRegistro: new Date('2025-11-20T08:00:00.000Z'),
        })
        .mockResolvedValueOnce(null);

      await expect(service.marcarSalida(invalidSalidaDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('obtenerAsistencias', () => {
    it('debe retornar lista de asistencias del empleado', async () => {
      const mockAsistencias = [
        {
          id: 1,
          employeeId: 1,
          tipo: AttendanceType.ENTRADA,
          horaRegistro: new Date('2025-11-20T08:00:00.000Z'),
        },
        {
          id: 2,
          employeeId: 1,
          tipo: AttendanceType.SALIDA,
          horaRegistro: new Date('2025-11-20T16:00:00.000Z'),
        },
      ];

      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      mockAttendanceRepository.find.mockResolvedValue(mockAsistencias);

      const result = await service.obtenerAsistencias(1);

      expect(result).toEqual(mockAsistencias);
      expect(attendanceRepository.find).toHaveBeenCalledWith({
        where: { employeeId: 1 },
        order: { horaRegistro: 'DESC' },
      });
    });

    it('debe lanzar NotFoundException si el empleado no existe', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(null);

      await expect(service.obtenerAsistencias(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('generarReporte', () => {
    const startDate = new Date('2025-11-01');
    const endDate = new Date('2025-11-20');

    it('debe generar reporte exitosamente', async () => {
      const mockAsistencias = [
        {
          id: 1,
          employeeId: 1,
          tipo: AttendanceType.ENTRADA,
          horaRegistro: new Date('2025-11-05T08:00:00.000Z'),
        },
        {
          id: 2,
          employeeId: 1,
          tipo: AttendanceType.ENTRADA,
          horaRegistro: new Date('2025-11-06T09:30:00.000Z'),
        },
      ];

      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      mockAttendanceRepository.find.mockResolvedValue(mockAsistencias);

      const result = await service.generarReporte(1, startDate, endDate);

      expect(result).toBeDefined();
      expect(result.employeeId).toBe(1);
      expect(result.employeeName).toBe('Juan Pérez');
      expect(result.daysAttended).toBe(2);
      expect(result.lateArrivals).toBeGreaterThanOrEqual(0);
      expect(result.attendancePercentage).toBeGreaterThanOrEqual(0);
    });

    it('debe lanzar NotFoundException si el empleado no existe', async () => {
      mockEmployeeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.generarReporte(999, startDate, endDate),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar BadRequestException si el empleado no tiene turno asignado', async () => {
      const employeeSinTurno = { ...mockEmployee, shift: null };
      mockEmployeeRepository.findOne.mockResolvedValue(employeeSinTurno);

      await expect(
        service.generarReporte(1, startDate, endDate),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.generarReporte(1, startDate, endDate),
      ).rejects.toThrow('no tiene un turno asignado');
    });

    it('debe calcular correctamente las tardanzas', async () => {
      const mockAsistencias = [
        {
          id: 1,
          employeeId: 1,
          tipo: AttendanceType.ENTRADA,
          horaRegistro: new Date('2025-11-05T08:00:00.000Z'), // A tiempo
        },
        {
          id: 2,
          employeeId: 1,
          tipo: AttendanceType.ENTRADA,
          horaRegistro: new Date('2025-11-06T08:30:00.000Z'), // 30 min tarde (con tolerancia = OK)
        },
        {
          id: 3,
          employeeId: 1,
          tipo: AttendanceType.ENTRADA,
          horaRegistro: new Date('2025-11-07T09:00:00.000Z'), // 60 min tarde
        },
      ];

      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      mockAttendanceRepository.find.mockResolvedValue(mockAsistencias);

      const result = await service.generarReporte(1, startDate, endDate);

      expect(result.lateArrivals).toBeGreaterThan(0);
      expect(result.lateArrivalDetails).toBeDefined();
    });

    it('debe calcular correctamente días ausentes', async () => {
      const mockAsistencias = [
        {
          id: 1,
          employeeId: 1,
          tipo: AttendanceType.ENTRADA,
          horaRegistro: new Date('2025-11-05T08:00:00.000Z'),
        },
      ];

      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      mockAttendanceRepository.find.mockResolvedValue(mockAsistencias);

      const result = await service.generarReporte(1, startDate, endDate);

      expect(result.daysAttended).toBe(1);
      expect(result.daysAbsent).toBeGreaterThan(0);
      expect(result.totalDaysExpected).toBeGreaterThan(result.daysAttended);
    });
  });

  describe('calcularDiasLaborales', () => {
    it('debe excluir fines de semana del conteo', () => {
      const start = new Date('2025-11-03'); // Lunes
      const end = new Date('2025-11-09'); // Domingo

      // Acceder al método privado para testing
      const result = service['calcularDiasLaborales'](start, end);

      // 7 días - 2 días de fin de semana = 5 días laborales
      expect(result).toBe(5);
    });
  });

  describe('convertirHoraAMinutos', () => {
    it('debe convertir hora correctamente a minutos', () => {
      const result1 = service['convertirHoraAMinutos']('08:00');
      const result2 = service['convertirHoraAMinutos']('09:30');
      const result3 = service['convertirHoraAMinutos']('16:00');

      expect(result1).toBe(480); // 8 * 60
      expect(result2).toBe(570); // 9 * 60 + 30
      expect(result3).toBe(960); // 16 * 60
    });
  });
});
