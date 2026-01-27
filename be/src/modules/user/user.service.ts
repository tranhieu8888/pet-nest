import User from "./user.model";

export const getAllUsers = async () => {
  try {
    const users = await User.find();
    return users;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error("Error fetching users: " + error.message);
    }
    throw error;
  }
};

export const createUser = async (userData: any) => {
  try {
    const newUser = new User(userData);
    await newUser.save();
    return newUser;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error("Error creating user: " + error.message);
    }
    throw error;
  }
};