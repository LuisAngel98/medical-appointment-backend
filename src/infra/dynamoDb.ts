import { DynamoDB } from "aws-sdk";

export const dynamoDb = new DynamoDB.DocumentClient({
  region: "localhost",
  endpoint: "http://localhost:8000",
});
