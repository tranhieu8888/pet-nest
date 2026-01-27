const User = require("../models/userModel");

const getAllUsers = async () => {
    try {
        return await User.find();
    } catch (error) {
        throw new Error("Error fetching users: " + error.message);
    }
};

const createUser = async (userData) => {
    try {
        const newUser = new User(userData);
        await newUser.save();
        return newUser;
    } catch (error) {
        throw new Error("Error creating user: " + error.message);
    }
};

module.exports = {
    getAllUsers,
    createUser,
};
