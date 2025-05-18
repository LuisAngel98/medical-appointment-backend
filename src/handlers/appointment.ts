import { APIGatewayProxyHandler } from "aws-lambda";
import { dynamoDb } from "../utils/dynamo";
import AWS from "aws-sdk";

export const handler: APIGatewayProxyHandler = async (event) => {
  const { insuredId, scheduleId, countryISO } = JSON.parse(event.body || "{}");
  console.log("Main:", insuredId, scheduleId, countryISO);

  const appointmentData = {
    insuredId,
    scheduleId,
    countryISO,
    status: "pending",
  };

  await dynamoDb
    .put({
      TableName: "Appointments",
      Item: appointmentData,
    })
    .promise();

  const lambda = new AWS.Lambda({
    region: "us-east-1",
    endpoint: "http://localhost:3002",
  });

  const countryLambda =
    countryISO === "PE"
      ? "medical-appointment-backend-dev-appointment_pe"
      : "medical-appointment-backend-dev-appointment_cl";
  console.log(appointmentData);

  await lambda
    .invoke({
      FunctionName: countryLambda,
      InvocationType: "RequestResponse",
      Payload: JSON.stringify(appointmentData),
    })
    .promise();

  await dynamoDb
    .update({
      TableName: "Appointments",
      Key: { insuredId },
      UpdateExpression: "set status = :s",
      ExpressionAttributeValues: { ":s": "completed" },
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Appointment processed",
      status: "completed",
    }),
  };
};
