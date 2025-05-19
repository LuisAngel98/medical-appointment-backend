import { Appointment } from "../domain/Appointment";
import { getConnection } from "../infra/db";

export const handler = async (event: Appointment) => {
  const { insuredId, scheduleId, countryISO } = event;
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
