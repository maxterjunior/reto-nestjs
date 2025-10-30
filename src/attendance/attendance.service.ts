import {
    Injectable,
    NotFoundException
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
    ) { }

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

        const attendance = this.attendanceRepository.create({
            ...createAttendanceDto,
            tipo: AttendanceType.ENTRADA,
            horaRegistro: new Date(createAttendanceDto.horaRegistro),
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
            throw new NotFoundException(`Empleado con ID ${employeeId} no encontrado`);
        }

        return this.attendanceRepository.find({
            where: { employeeId },
            order: { horaRegistro: 'DESC' },
        });
    }
}
