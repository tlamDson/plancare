import { Request, Response } from "express";
import { userRepository } from "../repositories/user.repository";
import { ClerkRequest } from "../../../types/express";
import { updateUserSchema } from "../schemas/user.schema";

export const getUserMe = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const clerkId = req.auth?.userId;
    if (!clerkId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await userRepository.findByClerkId(clerkId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserMe = async (
  req: ClerkRequest,
  res: Response,
): Promise<void> => {
  try {
    const clerkId = req.auth?.userId;
    if (!clerkId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // 1. Validate Input (Security: Prevent Mass Assignment)
    const validationResult = updateUserSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        message: "Invalid input",
        errors: validationResult.error.flatten(),
      });
      return;
    }

    const validatedData = validationResult.data;

    // 2. Efficient Update (Performance: Single DB Hit)
    const updatedUser = await userRepository.updateByClerkId(
      clerkId,
      validatedData,
    );

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
