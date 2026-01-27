import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/database";

connectDB();

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});