import {
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsEnum,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AttendanceType } from '../entities/attendance.entity';

export class CreateAttendanceDto {
  @ApiProperty({
    description: 'ID del empleado',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  employeeId: number;

  @ApiProperty({
    description: 'Tipo de registro de asistencia',
    enum: AttendanceType,
    example: AttendanceType.ENTRADA,
  })
  @IsNotEmpty()
  @IsEnum(AttendanceType)
  tipo: AttendanceType;

  @ApiProperty({
    description: 'Latitud de la ubicación del registro',
    example: -12.046374,
    type: Number,
    minimum: -90,
    maximum: 90,
  })
  @IsNotEmpty()
  @IsLatitude()
  latitud: number;

  @ApiProperty({
    description: 'Longitud de la ubicación del registro',
    example: -77.042793,
    type: Number,
    minimum: -180,
    maximum: 180,
  })
  @IsNotEmpty()
  @IsLongitude()
  longitud: number;

  @ApiProperty({
    description: 'Fecha y hora del registro en formato ISO 8601',
    example: '2025-11-20T08:30:00.000Z',
    type: String,
  })
  @IsNotEmpty()
  @IsDateString()
  horaRegistro: string;
}
