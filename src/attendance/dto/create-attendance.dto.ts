import { IsNotEmpty, IsNumber, IsDateString, IsEnum, IsLatitude, IsLongitude } from 'class-validator';
import { AttendanceType } from '../entities/attendance.entity';

export class CreateAttendanceDto {
    @IsNotEmpty()
    @IsNumber()
    employeeId: number;

    @IsNotEmpty()
    @IsEnum(AttendanceType)
    tipo: AttendanceType;

    @IsNotEmpty()
    @IsLatitude()
    latitud: number;

    @IsNotEmpty()
    @IsLongitude()
    longitud: number;

    @IsNotEmpty()
    @IsDateString()
    horaRegistro: string;
}
