import { getConnection } from "../infra/db";

export const handler = async (event) => {
  const { insuredId, scheduleId, countryISO } = event;
  console.log("Peru:", event);
  console.log("Peru:", insuredId, scheduleId, countryISO);
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
