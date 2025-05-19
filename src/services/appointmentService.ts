import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

import { dynamoDb } from "../infra/dynamoDb";
import { Appointment } from "../domain/Appointment";
import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const lambda = new LambdaClient({
  region: "us-east-1",
  endpoint: "http://localhost:3002", // si usas local
});

export async function createAppointment(appointment: Appointment) {
  // Save in DynamoDB
  await dynamoDb.send(
    new PutCommand({
      TableName: "Appointments",
      Item: appointment,
    })
  );

  // Save in Lambda
  const countryLambda =
    appointment.countryISO === "PE"
      ? "medical-appointment-backend-dev-appointment_pe"
      : "medical-appointment-backend-dev-appointment_cl";
  const params = {
    FunctionName: countryLambda,
    InvocationType: "RequestResponse" as const,
    Payload: new TextEncoder().encode(JSON.stringify(appointment)),
  };
  const command = new InvokeCommand(params);
  await lambda.send(command);

  // Update status in DynamoDB
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
export async function isScheduleIdUnique(
  scheduleId: number,
  countryISO: string
): Promise<boolean> {
  const result = await dynamoDb.send(
    new ScanCommand({
      TableName: "Appointments",
      FilterExpression: "#sid = :sid AND #ciso = :ciso",
      ExpressionAttributeNames: {
        "#sid": "scheduleId",
        "#ciso": "countryISO",
      },
      ExpressionAttributeValues: {
        ":sid": scheduleId,
        ":ciso": countryISO,
      },
      Limit: 1,
    })
  );
  return (result.Items?.length ?? 0) === 0;
}
