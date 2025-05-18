import AWS from "aws-sdk";

import { dynamoDb } from "../infra/dynamoDb";
import { Appointment } from "../domain/Appointment";

export async function createAppointment(appointment: Appointment) {
  // Save in DynamoDB
  await dynamoDb
    .put({
      TableName: "Appointments",
      Item: appointment,
    })
    .promise();
  const lambda = new AWS.Lambda({
    region: "us-east-1",
    endpoint: "http://localhost:3002",
  });
  const countryLambda =
    appointment.countryISO === "PE"
      ? "medical-appointment-backend-dev-appointment_pe"
      : "medical-appointment-backend-dev-appointment_cl";

  await lambda
    .invoke({
      FunctionName: countryLambda,
      InvocationType: "RequestResponse",
      Payload: JSON.stringify(appointment),
    })
    .promise();

  await dynamoDb
    .update({
      TableName: "Appointments",
      Key: { insuredId: appointment.insuredId },
      UpdateExpression: "set #st = :s",
      ExpressionAttributeNames: {
        "#st": "status",
      },
      ExpressionAttributeValues: {
        ":s": "completed",
      },
    })
    .promise();
}

export async function getAppointment(insuredId: string) {
  const result = await dynamoDb
    .get({
      TableName: "Appointments",
      Key: { insuredId },
    })
    .promise();

  return result.Item;
}
