export class AttendanceReportDto {
  employeeId: number;
  employeeName: string;
  totalDaysExpected: number;
  daysAttended: number;
  daysAbsent: number;
  lateArrivals: number;
  attendancePercentage: number;
  reportPeriod: {
    startDate: string;
    endDate: string;
  };
  lateArrivalDetails?: Array<{
    date: string;
    scheduledTime: string;
    actualTime: string;
    minutesLate: number;
  }>;
}
