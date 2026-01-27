import { Router } from "express";
import userController from "./user.controller";

const router = Router();

// Route to get all users
router.get("/", userController.getAllUsers);

// Route to create a new user
router.post("/", userController.createUser);

export default router;
