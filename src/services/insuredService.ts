import { dynamoDb } from "../infra/dynamoDb";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

export async function insuredExists(insuredId: string): Promise<boolean> {
  const params = {
    TableName: "Insured",
    Key: { insuredId },
  };

  const command = new GetCommand(params);
  const result = await dynamoDb.send(command);
  return !!result.Item;
}
