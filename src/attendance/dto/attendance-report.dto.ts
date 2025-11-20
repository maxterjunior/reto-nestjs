import { ApiProperty } from '@nestjs/swagger';

class LateArrivalDetailDto {
  @ApiProperty({
    description: 'Fecha de la tardanza',
    example: '2025-11-05',
  })
  date: string;

  @ApiProperty({
    description: 'Hora programada de entrada según el turno',
    example: '08:00',
  })
  scheduledTime: string;

  @ApiProperty({
    description: 'Hora real de llegada del empleado',
    example: '09:25',
  })
  actualTime: string;

  @ApiProperty({
    description: 'Minutos de retraso',
    example: 85,
  })
  minutesLate: number;
}

class ReportPeriodDto {
  @ApiProperty({
    description: 'Fecha de inicio del período del reporte',
    example: '2025-11-01',
  })
  startDate: string;

  @ApiProperty({
    description: 'Fecha de fin del período del reporte',
    example: '2025-11-20',
  })
  endDate: string;
}

export class AttendanceReportDto {
  @ApiProperty({
    description: 'ID del empleado',
    example: 1,
  })
  employeeId: number;

  @ApiProperty({
    description: 'Nombre completo del empleado',
    example: 'Juan Pérez',
  })
  employeeName: string;

  @ApiProperty({
    description:
      'Total de días laborales esperados en el período (excluye fines de semana)',
    example: 14,
  })
  totalDaysExpected: number;

  @ApiProperty({
    description: 'Días que el empleado asistió',
    example: 12,
  })
  daysAttended: number;

  @ApiProperty({
    description: 'Días que el empleado estuvo ausente',
    example: 2,
  })
  daysAbsent: number;

  @ApiProperty({
    description:
      'Número total de tardanzas registradas (considerando tolerancia del turno)',
    example: 3,
  })
  lateArrivals: number;

  @ApiProperty({
    description: 'Porcentaje de asistencia del empleado',
    example: 86,
  })
  attendancePercentage: number;

  @ApiProperty({
    description: 'Período cubierto por el reporte',
    type: ReportPeriodDto,
  })
  reportPeriod: ReportPeriodDto;

  @ApiProperty({
    description: 'Detalle de cada tardanza registrada en el período',
    type: [LateArrivalDetailDto],
    required: false,
  })
  lateArrivalDetails?: LateArrivalDetailDto[];
}
