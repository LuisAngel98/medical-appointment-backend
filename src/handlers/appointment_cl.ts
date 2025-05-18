import { APIGatewayProxyHandler } from "aws-lambda";
import { getConnection } from "../utils/db";

export const handler: APIGatewayProxyHandler = async (event) => {
  const { insuredId, scheduleId, countryISO } = JSON.parse(event.body || "{}");
  const connection = getConnection(countryISO);

  const query = `INSERT INTO appointments (insuredId, scheduleId, countryISO) VALUES (?, ?, ?)`;

  await new Promise((resolve, reject) => {
    connection.query(query, [insuredId, scheduleId, countryISO], (err) => {
      if (err) reject(err);
      resolve(true);
    });
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ status: "completed" }),
  };
};
