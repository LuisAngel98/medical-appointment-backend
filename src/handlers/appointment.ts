import { APIGatewayProxyHandler } from "aws-lambda";
import { Appointment, AppointmentRequest } from "../domain/Appointment";
import {
  createAppointment,
  getAppointment,
  isScheduleIdUnique,
} from "../services/appointmentService";
import { insuredExists } from "../services/insuredService";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    //create appointment
    if (event.httpMethod === "POST") {
      if (!event.body) {
        return response(400, "Request body is missing");
      }
      let parsedBody: AppointmentRequest;
      try {
        parsedBody = JSON.parse(event.body);
      } catch {
        return response(400, "Invalid JSON format");
      }
      const { insuredId, scheduleId, countryISO } = parsedBody;

      if (typeof insuredId !== "string" || !insuredId.trim()) {
        return response(400, "Invalid or missing 'insuredId'");
      }

      if (typeof scheduleId !== "number" || scheduleId <= 0) {
        return response(400, "Invalid or missing 'scheduleId'");
      }

      if (!["PE", "CL"].includes(countryISO)) {
        return response(400, "Invalid or missing 'countryISO'");
      }
      const appointmentData: Appointment = {
        insuredId,
        scheduleId,
        countryISO,
        status: "pending",
      };
      // Check if the insured exists
      const exists = await insuredExists(insuredId);
      if (!exists) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Insured not found" }),
        };
      }
      const scheduleIdexist = await isScheduleIdUnique(
        appointmentData.scheduleId,
        appointmentData.countryISO
      );
      if (!scheduleIdexist) {
        return {
          statusCode: 409,
          body: JSON.stringify({
            message: "Schedule ID already exists",
            status: "conflict",
          }),
        };
      }

      await createAppointment(appointmentData);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Appointment processed",
          status: "pending",
        }),
      };
    }
    if (event.httpMethod === "GET") {
      const insuredId = event.pathParameters?.insuredId;
      if (!insuredId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "insuredId is required" }),
        };
      }

      const appointment = await getAppointment(insuredId);
      if (!appointment) {
        return {
          statusCode: 404,
          body: JSON.stringify({ message: "Appointment not found" }),
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify(appointment),
      };
    }
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
        error: error.message,
      }),
    };
  }
};

const response = (statusCode: number, message: string) => ({
  statusCode,
  body: JSON.stringify({ message }),
});
