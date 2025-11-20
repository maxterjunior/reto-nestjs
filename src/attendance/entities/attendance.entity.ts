import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Employee } from '../../employees/entities/employee.entity';

export enum AttendanceType {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
}

@Entity('attendances')
export class Attendance {
  @ApiProperty({
    description: 'ID único del registro de asistencia',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'ID del empleado',
    example: 1,
  })
  @Column()
  employeeId: number;

  @ManyToOne(() => Employee, (employee) => employee.attendances)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @ApiProperty({
    description: 'Tipo de registro',
    enum: AttendanceType,
    example: AttendanceType.ENTRADA,
  })
  @Column({
    type: 'varchar',
    length: 20,
    enum: AttendanceType,
  })
  tipo: AttendanceType;

  @ApiProperty({
    description: 'Latitud de la ubicación del registro',
    example: -12.046374,
  })
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitud: number;

  @ApiProperty({
    description: 'Longitud de la ubicación del registro',
    example: -77.042793,
  })
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitud: number;

  @ApiProperty({
    description: 'Fecha y hora del registro',
    example: '2025-11-20T08:30:00.000Z',
  })
  @Column({ type: 'datetime' })
  horaRegistro: Date;

  @ApiProperty({
    description: 'Fecha de creación del registro en el sistema',
    example: '2025-11-20T08:30:05.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;
}

@Entity('shifts')
export class Shift {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 100,
  })
  nombre: string;

  @Column({ type: 'time' })
  horaInicio: string;

  @Column({ type: 'time' })
  horaFin: string;

  @Column({ type: 'int' })
  toleranciaMinutos: number;

  @OneToMany(() => Employee, (employee) => employee.shift)
  employees: Employee[];

  @CreateDateColumn()
  createdAt: Date;
}
