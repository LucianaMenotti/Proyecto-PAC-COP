import { Sequelize } from "sequelize";
import "dotenv/config";

const dialect = (process.env.DB_DIALECT || "mysql").trim().toLowerCase();
const requiredConfig = ["DB_NAME", "DB_USER", "DB_HOST"];
const missingConfig = requiredConfig.filter((key) => !process.env[key]?.trim());

if (missingConfig.length > 0) {
  throw new Error(
    `Falta configurar ${missingConfig.join(", ")} en backend/.env`,
  );
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    dialect,
    logging: false,
  },
);

export default sequelize;
