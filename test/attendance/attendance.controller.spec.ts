/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from '../../src/attendance/attendance.controller';
import { AttendanceService } from '../../src/attendance/attendance.service';
import { CreateAttendanceDto } from '../../src/attendance/dto/create-attendance.dto';
import {
  AttendanceType,
  Attendance,
} from '../../src/attendance/entities/attendance.entity';
import { AttendanceReportDto } from '../../src/attendance/dto/attendance-report.dto';

describe('AttendanceController', () => {
  let controller: AttendanceController;
  let service: AttendanceService;

  const mockAttendanceService = {
    marcarEntrada: jest.fn(),
    marcarSalida: jest.fn(),
    obtenerAsistencias: jest.fn(),
    generarReporte: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        {
          provide: AttendanceService,
          useValue: mockAttendanceService,
        },
      ],
    }).compile();

    controller = module.get<AttendanceController>(AttendanceController);
    service = module.get<AttendanceService>(AttendanceService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('marcarEntrada', () => {
    const createEntradaDto: CreateAttendanceDto = {
      employeeId: 1,
      tipo: AttendanceType.ENTRADA,
      latitud: -12.046374,
      longitud: -77.042793,
      horaRegistro: '2025-11-20T08:00:00.000Z',
    };

    const mockEntrada = {
      id: 1,
      ...createEntradaDto,
      horaRegistro: new Date('2025-11-20T08:00:00.000Z'),
      employee: null,
    } as unknown as Attendance;

    it('debe registrar una entrada exitosamente', async () => {
      mockAttendanceService.marcarEntrada.mockResolvedValue(mockEntrada);

      const result = await controller.marcarEntrada(createEntradaDto);

      expect(result).toEqual(mockEntrada);
      expect(service.marcarEntrada).toHaveBeenCalledWith(createEntradaDto);
      expect(service.marcarEntrada).toHaveBeenCalledTimes(1);
    });

    it('debe llamar al servicio con los parámetros correctos', async () => {
      mockAttendanceService.marcarEntrada.mockResolvedValue(mockEntrada);

      await controller.marcarEntrada(createEntradaDto);

      expect(service.marcarEntrada).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: 1,
          tipo: AttendanceType.ENTRADA,
          latitud: -12.046374,
          longitud: -77.042793,
        }),
      );
    });

    it('debe propagar excepciones del servicio', async () => {
      const error = new Error('Empleado no encontrado');
      mockAttendanceService.marcarEntrada.mockRejectedValue(error);

      await expect(controller.marcarEntrada(createEntradaDto)).rejects.toThrow(
        'Empleado no encontrado',
      );
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

    const mockSalida: Attendance = {
      id: 2,
      ...createSalidaDto,
      horaRegistro: new Date('2025-11-20T16:00:00.000Z'),
    } as Attendance;

    it('debe registrar una salida exitosamente', async () => {
      mockAttendanceService.marcarSalida.mockResolvedValue(mockSalida);

      const result = await controller.marcarSalida(createSalidaDto);

      expect(result).toEqual(mockSalida);
      expect(service.marcarSalida).toHaveBeenCalledWith(createSalidaDto);
      expect(service.marcarSalida).toHaveBeenCalledTimes(1);
    });

    it('debe llamar al servicio con los parámetros correctos', async () => {
      mockAttendanceService.marcarSalida.mockResolvedValue(mockSalida);

      await controller.marcarSalida(createSalidaDto);

      expect(service.marcarSalida).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: 1,
          tipo: AttendanceType.SALIDA,
          horaRegistro: '2025-11-20T16:00:00.000Z',
        }),
      );
    });

    it('debe propagar excepciones del servicio', async () => {
      const error = new Error('No hay entrada registrada');
      mockAttendanceService.marcarSalida.mockRejectedValue(error);

      await expect(controller.marcarSalida(createSalidaDto)).rejects.toThrow(
        'No hay entrada registrada',
      );
    });
  });

  describe('obtenerAsistencias', () => {
    const employeeId = 1;
    const mockAsistencias: Attendance[] = [
      {
        id: 1,
        employeeId: 1,
        tipo: AttendanceType.ENTRADA,
        latitud: -12.046374,
        longitud: -77.042793,
        horaRegistro: new Date('2025-11-20T08:00:00.000Z'),
      } as Attendance,
      {
        id: 2,
        employeeId: 1,
        tipo: AttendanceType.SALIDA,
        latitud: -12.046374,
        longitud: -77.042793,
        horaRegistro: new Date('2025-11-20T16:00:00.000Z'),
      } as Attendance,
    ];

    it('debe retornar lista de asistencias del empleado', async () => {
      mockAttendanceService.obtenerAsistencias.mockResolvedValue(
        mockAsistencias,
      );

      const result = await controller.obtenerAsistencias(employeeId);

      expect(result).toEqual(mockAsistencias);
      expect(service.obtenerAsistencias).toHaveBeenCalledWith(employeeId);
      expect(service.obtenerAsistencias).toHaveBeenCalledTimes(1);
    });

    it('debe pasar el employeeId correctamente al servicio', async () => {
      mockAttendanceService.obtenerAsistencias.mockResolvedValue(
        mockAsistencias,
      );

      await controller.obtenerAsistencias(employeeId);

      expect(service.obtenerAsistencias).toHaveBeenCalledWith(1);
    });

    it('debe retornar array vacío si no hay asistencias', async () => {
      mockAttendanceService.obtenerAsistencias.mockResolvedValue([]);

      const result = await controller.obtenerAsistencias(employeeId);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('debe propagar excepciones del servicio', async () => {
      const error = new Error('Empleado no encontrado');
      mockAttendanceService.obtenerAsistencias.mockRejectedValue(error);

      await expect(controller.obtenerAsistencias(employeeId)).rejects.toThrow(
        'Empleado no encontrado',
      );
    });
  });

  describe('generarReporte', () => {
    const employeeId = 1;
    const startDateStr = '2025-11-01';
    const endDateStr = '2025-11-20';

    const mockReporte: AttendanceReportDto = {
      employeeId: 1,
      reportPeriod: {
        startDate: startDateStr,
        endDate: endDateStr,
      },
      employeeName: 'Juan Pérez',
      totalDaysExpected: 15,
      daysAttended: 12,
      daysAbsent: 3,
      lateArrivals: 2,
      attendancePercentage: 80,
      lateArrivalDetails: [
        {
          date: '2025-11-05',
          scheduledTime: '08:00',
          actualTime: '09:00',
          minutesLate: 60,
        },
      ],
    };

    it('debe generar reporte con fechas proporcionadas', async () => {
      mockAttendanceService.generarReporte.mockResolvedValue(mockReporte);

      const result = await controller.generarReporte(
        employeeId,
        startDateStr,
        endDateStr,
      );

      expect(result).toEqual(mockReporte);
      expect(service.generarReporte).toHaveBeenCalledWith(
        employeeId,
        new Date(startDateStr),
        new Date(endDateStr),
      );
    });

    it('debe usar fechas por defecto si no se proporcionan', async () => {
      mockAttendanceService.generarReporte.mockResolvedValue(mockReporte);

      await controller.generarReporte(
        employeeId,
        undefined as unknown as string,
        undefined as unknown as string,
      );

      expect(service.generarReporte).toHaveBeenCalledWith(
        employeeId,
        expect.any(Date),
        expect.any(Date),
      );
    });

    it('debe usar fecha de inicio del mes actual por defecto', async () => {
      mockAttendanceService.generarReporte.mockResolvedValue(mockReporte);

      await controller.generarReporte(
        employeeId,
        undefined as unknown as string,
        endDateStr as unknown as string,
      );

      const call = mockAttendanceService.generarReporte.mock.calls[0];
      const startDate = call[1] as Date;

      expect(startDate.getDate()).toBe(1);
    });

    it('debe usar fecha actual como fecha de fin por defecto', async () => {
      mockAttendanceService.generarReporte.mockResolvedValue(mockReporte);
      const today = new Date();

      await controller.generarReporte(
        employeeId,
        startDateStr,
        undefined as unknown as string,
      );

      const call = mockAttendanceService.generarReporte.mock.calls[0];
      const endDate = call[2] as Date;

      expect(endDate.getDate()).toBe(today.getDate());
      expect(endDate.getMonth()).toBe(today.getMonth());
    });

    it('debe propagar excepciones del servicio', async () => {
      const error = new Error('Empleado no tiene turno asignado');
      mockAttendanceService.generarReporte.mockRejectedValue(error);

      await expect(
        controller.generarReporte(employeeId, startDateStr, endDateStr),
      ).rejects.toThrow('Empleado no tiene turno asignado');
    });

    it('debe retornar reporte con estadísticas correctas', async () => {
      mockAttendanceService.generarReporte.mockResolvedValue(mockReporte);

      const result = await controller.generarReporte(
        employeeId,
        startDateStr,
        endDateStr,
      );

      expect(result.daysAttended).toBe(12);
      expect(result.daysAbsent).toBe(3);
      expect(result.lateArrivals).toBe(2);
      expect(result.attendancePercentage).toBe(80);
    });

    it('debe incluir detalles de tardanzas en el reporte', async () => {
      mockAttendanceService.generarReporte.mockResolvedValue(mockReporte);

      const result = await controller.generarReporte(
        employeeId,
        startDateStr,
        endDateStr,
      );

      expect(result.lateArrivalDetails).toBeDefined();
      expect(result.lateArrivalDetails?.length).toBeGreaterThan(0);
      expect(result.lateArrivalDetails?.[0]).toHaveProperty('date');
      expect(result.lateArrivalDetails?.[0]).toHaveProperty('minutesLate');
    });
  });
});
