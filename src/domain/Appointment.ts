export interface Appointment extends AppointmentRequest {
  status: "pending" | "completed";
}
export interface AppointmentRequest {
  insuredId: string;
  scheduleId: number;
  countryISO: "PE" | "CL";
}
