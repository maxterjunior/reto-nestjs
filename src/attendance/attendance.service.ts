import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance, AttendanceType } from './entities/attendance.entity';
import { Employee } from '../employees/entities/employee.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

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
          `El empleado con ID ${createAttendanceDto.employeeId} ya tiene un registro de entrada activo. Debe registrar primero la salida`,
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

    // Buscar el último registro de entrada sin salida correspondiente
    const ultimaEntrada = await this.attendanceRepository.findOne({
      where: {
        employeeId: createAttendanceDto.employeeId,
        tipo: AttendanceType.ENTRADA,
      },
      order: { horaRegistro: 'DESC' },
    });

    if (!ultimaEntrada) {
      throw new BadRequestException(
        `El empleado con ID ${createAttendanceDto.employeeId} no tiene un registro de entrada previo`,
      );
    }

    // Verificar si ya existe una salida posterior a la última entrada
    const salidaPosterior = await this.attendanceRepository.findOne({
      where: {
        employeeId: createAttendanceDto.employeeId,
        tipo: AttendanceType.SALIDA,
      },
      order: { horaRegistro: 'DESC' },
    });

    if (
      salidaPosterior &&
      salidaPosterior.horaRegistro >= ultimaEntrada.horaRegistro
    ) {
      throw new BadRequestException(
        `El empleado con ID ${createAttendanceDto.employeeId} ya tiene un registro de salida posterior a su última entrada`,
      );
    }

    const horaRegistro = new Date(createAttendanceDto.horaRegistro);

    // Validar que la hora de salida sea posterior a la última entrada
    if (horaRegistro < ultimaEntrada.horaRegistro) {
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
}
