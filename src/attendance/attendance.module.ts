import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { Attendance } from './entities/attendance.entity';
import { EmployeesModule } from '../employees/employees.module';

@Module({
    imports: [TypeOrmModule.forFeature([Attendance]), EmployeesModule],
    controllers: [AttendanceController],
    providers: [AttendanceService],
})
export class AttendanceModule { }
