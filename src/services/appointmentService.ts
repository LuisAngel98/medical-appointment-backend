import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

import { dynamoDb } from "../infra/dynamoDb";
import { Appointment } from "../domain/Appointment";
import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { log } from "node:console";

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
      ConditionExpression:
        "attribute_not_exists(insuredId) AND attribute_not_exists(scheduleId)",
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
  await updatePendingAppointment(
    appointment.insuredId,
    appointment.scheduleId,
    appointment.status
  );
}

export async function getAppointments(insuredId: string) {
  try {
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: "Appointments",
        FilterExpression: "#iid = :iid",
        ExpressionAttributeNames: {
          "#iid": "insuredId",
        },
        ExpressionAttributeValues: {
          ":iid": insuredId,
        },
      })
    );
    return result.Items ?? [];
  } catch (error) {
    console.error("Error al obtener los appointments:", error);
    throw new Error("No se pudieron obtener los appointments");
  }
}
export async function updatePendingAppointment(
  insuredId: string,
  scheduleId: number,
  status: string
) {
  try {
    await dynamoDb.send(
      new UpdateCommand({
        TableName: "Appointments",
        Key: {
          insuredId: insuredId,
          scheduleId: scheduleId,
        },
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
  insuredId: string,
  scheduleId: number
): Promise<boolean> {
  console.log("Checking if scheduleId is unique");
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: "Appointments",
      KeyConditionExpression: "insuredId = :id AND scheduleId = :sid",
      ExpressionAttributeValues: {
        ":id": insuredId,
        ":sid": scheduleId,
      },
      Limit: 1,
    })
  );

  return (result.Items?.length ?? 0) === 0;
}
