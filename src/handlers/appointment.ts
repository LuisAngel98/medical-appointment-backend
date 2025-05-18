import { APIGatewayProxyHandler } from "aws-lambda";
import { Appointment } from "../domain/Appointment";
import {
  createAppointment,
  getAppointment,
} from "../services/appointmentService";

export const handler: APIGatewayProxyHandler = async (event) => {
  const { insuredId, scheduleId, countryISO } = JSON.parse(event.body || "{}");
  const appointmentData: Appointment = {
    insuredId,
    scheduleId,
    countryISO,
    status: "pending",
  };
  try {
    //create appointment
    if (event.httpMethod === "POST") {
      await createAppointment(appointmentData);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Appointment processed",
          status: "completed",
        }),
      };
    }
    //get appointment bby id
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
