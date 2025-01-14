import express, { Response } from "express";
import { authMiddleware } from "../middleware/middleware";
import User from "../models/user-model";
import jwt from "jsonwebtoken";

const router = express.Router();

// Define the AuthRequest interface
interface AuthRequest extends express.Request {
  user?: {
    userId: string;
  };
}

router.post("/github", async (req, res) => {
  try {
    const { github_id, username, email, access_token } = req.body;

    let user = await User.findOne({ github_id });

    if (!user) {
      user = await User.create({
        github_id,
        username,
        email,
        access_token,
      });
    } else {
      user.access_token = access_token;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "24h",
    });

    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Fixed route handler with proper type annotations
router.get(
  "/user",
  authMiddleware,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.user?.userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
