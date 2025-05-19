import AWS from "aws-sdk";

import { dynamoDb } from "../infra/dynamoDb";
import { Appointment } from "../domain/Appointment";
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

export async function createAppointment(appointment: Appointment) {
  // Save in DynamoDB
  await dynamoDb.send(
    new PutCommand({
      TableName: "Appointments",
      Item: appointment,
    })
  );
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

  await dynamoDb.send(
    new UpdateCommand({
      TableName: "Appointments",
      Key: { insuredId: appointment.insuredId },
      UpdateExpression: "SET #st = :s",
      ExpressionAttributeNames: {
        "#st": "status",
      },
      ExpressionAttributeValues: {
        ":s": "completed",
      },
    })
  );
}

export async function getAppointment(insuredId: string) {
  try {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: "Appointments",
        Key: { insuredId },
      })
    );

    return result.Item;
  } catch (error) {
    console.error("Error al obtener el appointment:", error);
    throw new Error("No se pudo obtener el appointment");
  }
}

export async function updatePendingAppointment(
  insuredId: string,
  status: string
) {
  try {
    await dynamoDb.send(
      new UpdateCommand({
        TableName: "Appointments",
        Key: { insuredId },
        UpdateExpression: "SET #st = :s",
        ExpressionAttributeNames: {
          "#st": "status",
        },
        ExpressionAttributeValues: {
          ":s": status,
        },
      })
    );
  } catch (error) {
    console.error("Error al actualizar el appointment:", error);
    throw new Error("No se pudo actualizar el appointment");
  }
}
