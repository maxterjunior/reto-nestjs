import { Controller, Post, Get, Body, Param, ParseIntPipe } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Controller('attendance')
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) { }

    @Post('entrada')
    marcarEntrada(@Body() createAttendanceDto: CreateAttendanceDto) {
        return this.attendanceService.marcarEntrada(createAttendanceDto);
    }

    @Post('salida')
    marcarSalida(@Body() createAttendanceDto: CreateAttendanceDto) {
        return this.attendanceService.marcarSalida(createAttendanceDto);
    }

    @Get('employee/:id')
    obtenerAsistencias(@Param('id', ParseIntPipe) employeeId: number) {
        return this.attendanceService.obtenerAsistencias(employeeId);
    }
}
