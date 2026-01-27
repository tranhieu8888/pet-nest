import { Request, Response } from "express";
import { getAllUsers, createUser } from "./user.service";

const getAllUsersHandler = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
  }
};

const createUserHandler = async (req: Request, res: Response) => {
  try {
    const newUser = await createUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "An error occurred" });
  }
};

export default {
  getAllUsers: getAllUsersHandler,
  createUser: createUserHandler,
};