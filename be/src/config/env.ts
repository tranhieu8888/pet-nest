import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || "9999",
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI || "",
};