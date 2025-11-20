import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';

export enum AttendanceType {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
}

@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employeeId: number;

  @ManyToOne(() => Employee, (employee) => employee.attendances)
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({
    type: 'varchar',
    length: 20,
    enum: AttendanceType,
  })
  tipo: AttendanceType;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitud: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitud: number;

  @Column({ type: 'datetime' })
  horaRegistro: Date;

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
