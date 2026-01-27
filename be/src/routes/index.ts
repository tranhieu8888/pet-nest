import { Router } from "express";
import userRoutes from "../modules/user/user.route";

const routes = Router();

routes.use("/users", userRoutes);

export default routes;
