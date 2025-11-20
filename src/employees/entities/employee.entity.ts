import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Attendance, Shift } from '../../attendance/entities/attendance.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 100 })
  apellido: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  numeroDocumento: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ nullable: true })
  shiftId: number;

  @OneToMany(() => Attendance, (attendance) => attendance.employee)
  attendances: Attendance[];

  @ManyToOne(() => Shift, (shift) => shift.employees)
  @JoinColumn({ name: 'shiftId' })
  shift: Shift;
}
