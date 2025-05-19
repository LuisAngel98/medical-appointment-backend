import AWS from "aws-sdk";

import { dynamoDb } from "../infra/dynamoDb";

import { Insured } from "../domain/Insured";

import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

export async function getInsured(insuredId: string) {
  try {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: "Insured",
        Key: { insuredId },
      })
    );

    return result.Item;
  } catch (error) {
    console.error("Error al obtener el insured:", error);
    throw new Error("No se pudo obtener el insured");
  }
}
