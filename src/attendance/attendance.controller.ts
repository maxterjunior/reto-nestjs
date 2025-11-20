import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { AttendanceReportDto } from './dto/attendance-report.dto';
import { Attendance } from './entities/attendance.entity';

@ApiTags('attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('entrada')
  @ApiOperation({
    summary: 'Registrar entrada de empleado',
    description:
      'Registra la hora de entrada de un empleado con su ubicación geográfica. Si el empleado llega con 60 minutos o más de tardanza, se enviará automáticamente una notificación por email a RRHH. El sistema valida que no exista una entrada previa sin salida.',
  })
  @ApiBody({ type: CreateAttendanceDto })
  @ApiResponse({
    status: 201,
    description: 'Entrada registrada exitosamente',
    type: Attendance,
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos, hora futura, o ya existe una entrada sin salida registrada',
  })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  marcarEntrada(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendanceService.marcarEntrada(createAttendanceDto);
  }

  @Post('salida')
  @ApiOperation({
    summary: 'Registrar salida de empleado',
    description:
      'Registra la hora de salida de un empleado. Debe existir una entrada previa del mismo día. La hora de salida debe ser posterior a la hora de entrada.',
  })
  @ApiBody({ type: CreateAttendanceDto })
  @ApiResponse({
    status: 201,
    description: 'Salida registrada exitosamente',
    type: Attendance,
  })
  @ApiResponse({
    status: 400,
    description:
      'No hay entrada registrada para el día, ya existe una salida, o la hora de salida es inválida',
  })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  marcarSalida(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendanceService.marcarSalida(createAttendanceDto);
  }

  @Get('employee/:id')
  @ApiOperation({
    summary: 'Obtener historial de asistencias de un empleado',
    description:
      'Obtiene todos los registros de asistencia (entradas y salidas) de un empleado específico, ordenados por fecha de más reciente a más antigua.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID único del empleado',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de asistencias del empleado',
    type: [Attendance],
  })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  obtenerAsistencias(@Param('id', ParseIntPipe) employeeId: number) {
    return this.attendanceService.obtenerAsistencias(employeeId);
  }

  @Get('report/:id')
  @ApiOperation({
    summary: 'Generar reporte de asistencia de un empleado',
    description:
      'Genera un reporte detallado con estadísticas de asistencia incluyendo: días asistidos, ausencias, tardanzas (considerando la tolerancia del turno), y porcentaje de asistencia. El reporte excluye fines de semana del cálculo de días laborales.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID único del empleado',
    example: 1,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description:
      'Fecha de inicio del período (formato: YYYY-MM-DD). Por defecto: primer día del mes actual',
    example: '2025-11-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description:
      'Fecha de fin del período (formato: YYYY-MM-DD). Por defecto: fecha actual',
    example: '2025-11-20',
  })
  @ApiResponse({
    status: 200,
    description: 'Reporte generado exitosamente',
    type: AttendanceReportDto,
  })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @ApiResponse({
    status: 400,
    description: 'El empleado no tiene un turno asignado',
  })
  generarReporte(
    @Param('id', ParseIntPipe) employeeId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    return this.attendanceService.generarReporte(employeeId, start, end);
  }
}
