export class LateArrivalNotificationDto {
  employeeId: number;
  employeeName: string;
  scheduledTime: string;
  actualTime: string;
  minutesLate: number;
  date: string;
  email: string;
}
