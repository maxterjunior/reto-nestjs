import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance, AttendanceType } from './entities/attendance.entity';
import { Employee } from '../employees/entities/employee.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { AttendanceReportDto } from './dto/attendance-report.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async marcarEntrada(createAttendanceDto: CreateAttendanceDto) {
    // Validar que el empleado existe
    const employee = await this.employeeRepository.findOne({
      where: { id: createAttendanceDto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException(
        `Empleado con ID ${createAttendanceDto.employeeId} no encontrado`,
      );
    }

    const horaRegistro = new Date(createAttendanceDto.horaRegistro);

    // Validar que la hora de entrada no sea futura
    const ahora = new Date();
    if (horaRegistro > ahora) {
      throw new BadRequestException(
        'No se puede registrar una entrada con una fecha futura',
      );
    }

    // Validar que no haya una entrada reciente sin salida
    const ultimaEntrada = await this.attendanceRepository.findOne({
      where: {
        employeeId: createAttendanceDto.employeeId,
        tipo: AttendanceType.ENTRADA,
      },
      order: { horaRegistro: 'DESC' },
    });

    if (ultimaEntrada) {
      // Buscar si existe una salida posterior a la última entrada
      const salidaPosterior = await this.attendanceRepository.findOne({
        where: {
          employeeId: createAttendanceDto.employeeId,
          tipo: AttendanceType.SALIDA,
        },
        order: { horaRegistro: 'DESC' },
      });

      // Si no hay salida o la salida es anterior a la última entrada
      if (
        !salidaPosterior ||
        salidaPosterior.horaRegistro < ultimaEntrada.horaRegistro
      ) {
        throw new BadRequestException(
          `El empleado ya tiene una entrada registrada sin salida`,
        );
      }

      // Validar que la nueva entrada sea posterior a la última salida
      if (horaRegistro <= salidaPosterior.horaRegistro) {
        throw new BadRequestException(
          'La hora de entrada debe ser posterior a la última salida registrada',
        );
      }
    }

    const attendance = this.attendanceRepository.create({
      ...createAttendanceDto,
      tipo: AttendanceType.ENTRADA,
      horaRegistro,
    });

    return this.attendanceRepository.save(attendance);
  }

  async marcarSalida(createAttendanceDto: CreateAttendanceDto) {
    // Validar que el empleado existe
    const employee = await this.employeeRepository.findOne({
      where: { id: createAttendanceDto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException(
        `Empleado con ID ${createAttendanceDto.employeeId} no encontrado`,
      );
    }

    const horaRegistro = new Date(createAttendanceDto.horaRegistro);

    const { inicioDia, finDia } = this.obtenerRangoDia(horaRegistro);

    // Buscar entrada del mismo día
    const entradaMismoDia = await this.attendanceRepository.findOne({
      where: {
        employeeId: createAttendanceDto.employeeId,
        tipo: AttendanceType.ENTRADA,
        horaRegistro: Between(inicioDia, finDia),
      },
      order: { horaRegistro: 'DESC' },
    });

    if (!entradaMismoDia) {
      throw new BadRequestException(
        'No hay una entrada registrada para marcar salida',
      );
    }

    // Verificar si ya existe una salida para esa entrada del mismo día
    const salidaMismoDia = await this.attendanceRepository.findOne({
      where: {
        employeeId: createAttendanceDto.employeeId,
        tipo: AttendanceType.SALIDA,
        horaRegistro: Between(inicioDia, finDia),
      },
      order: { horaRegistro: 'DESC' },
    });

    if (
      salidaMismoDia &&
      salidaMismoDia.horaRegistro >= entradaMismoDia.horaRegistro
    ) {
      throw new BadRequestException(
        'Ya existe un registro de salida para la entrada de hoy',
      );
    }

    // Validar que la hora de salida sea posterior a la entrada del mismo día
    if (horaRegistro <= entradaMismoDia.horaRegistro) {
      throw new BadRequestException(
        'La hora de salida debe ser posterior a la hora de entrada',
      );
    }

    const attendance = this.attendanceRepository.create({
      ...createAttendanceDto,
      tipo: AttendanceType.SALIDA,
      horaRegistro,
    });

    return this.attendanceRepository.save(attendance);
  }

  async obtenerAsistencias(employeeId: number) {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(
        `Empleado con ID ${employeeId} no encontrado`,
      );
    }

    return this.attendanceRepository.find({
      where: { employeeId },
      order: { horaRegistro: 'DESC' },
    });
  }

  async generarReporte(
    employeeId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<AttendanceReportDto> {
    // Validar que el empleado existe y obtener su turno
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
      relations: ['shift'],
    });

    if (!employee) {
      throw new NotFoundException(
        `Empleado con ID ${employeeId} no encontrado`,
      );
    }

    if (!employee.shift) {
      throw new BadRequestException(
        `El empleado con ID ${employeeId} no tiene un turno asignado`,
      );
    }

    // Definir rangos completos de los días
    const { inicioDia: inicioRango } = this.obtenerRangoDia(startDate);
    const { finDia: finRango } = this.obtenerRangoDia(endDate);

    // Obtener todas las asistencias del empleado en el período
    const attendances = await this.attendanceRepository.find({
      where: {
        employeeId,
        horaRegistro: Between(inicioRango, finRango),
      },
      order: { horaRegistro: 'ASC' },
    });

    // Calcular días laborales esperados (excluyendo fines de semana)
    const totalDaysExpected = this.calcularDiasLaborales(startDate, endDate);

    // Agrupar entradas por día
    const entradasPorDia = new Map<string, Attendance>();
    const lateArrivalDetails: Array<{
      date: string;
      scheduledTime: string;
      actualTime: string;
      minutesLate: number;
    }> = [];

    attendances
      .filter((a) => a.tipo === AttendanceType.ENTRADA)
      .forEach((attendance) => {
        const fecha = attendance.horaRegistro.toISOString().split('T')[0];
        entradasPorDia.set(fecha, attendance);

        // Calcular tardanzas
        const horaEntrada = this.extraerHora(attendance.horaRegistro);
        const horaEsperada = employee.shift.horaInicio;
        const tolerancia = employee.shift.toleranciaMinutos;

        const minutosLlegada = this.convertirHoraAMinutos(horaEntrada);
        const minutosEsperados = this.convertirHoraAMinutos(horaEsperada);
        const diferenciaMinutos = minutosLlegada - minutosEsperados;

        if (diferenciaMinutos > tolerancia) {
          lateArrivalDetails.push({
            date: fecha,
            scheduledTime: horaEsperada,
            actualTime: horaEntrada,
            minutesLate: diferenciaMinutos,
          });
        }
      });

    const daysAttended = entradasPorDia.size;
    const daysAbsent = totalDaysExpected - daysAttended;
    const lateArrivals = lateArrivalDetails.length;
    const attendancePercentage =
      totalDaysExpected > 0
        ? Math.round((daysAttended / totalDaysExpected) * 100)
        : 0;

    return {
      employeeId,
      employeeName: `${employee.nombre} ${employee.apellido}`,
      totalDaysExpected,
      daysAttended,
      daysAbsent,
      lateArrivals,
      attendancePercentage,
      reportPeriod: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      lateArrivalDetails,
    };
  }

  private calcularDiasLaborales(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      // Excluir sábados (6) y domingos (0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  private extraerHora(fecha: Date): string {
    return fecha.toISOString().split('T')[1].substring(0, 5);
  }

  private convertirHoraAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  private obtenerRangoDia(fecha: Date): { inicioDia: Date; finDia: Date } {
    const inicioDia = new Date(fecha);
    inicioDia.setUTCHours(0, 0, 0, 0);

    const finDia = new Date(fecha);
    finDia.setUTCHours(23, 59, 59, 999);

    return { inicioDia, finDia };
  }
}
