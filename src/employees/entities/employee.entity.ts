import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

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

  @OneToMany('Attendance', 'employee')
  attendances: any[];

  @ManyToOne('Shift', 'employees')
  @JoinColumn({ name: 'shiftId' })
  shift: any;
}
