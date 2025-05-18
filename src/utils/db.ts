import mysql from "mysql2";

export const getConnection = (countryISO: string) => {
  const config = {
    host: countryISO === "PE" ? "localhost" : "localhost",
    port: countryISO === "PE" ? 3306 : 3307,
    user: "root",
    password: "password",
    database: countryISO === "PE" ? "appointments_pe" : "appointments_cl",
  };

  return mysql.createConnection(config);
};
