import express, { Response } from "express";
import { authMiddleware } from "../middleware/middleware.js";
import User from "../models/user-model.js";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

const router = express.Router();

// GitHub OAuth exchange function
async function exchangeCodeForToken(code: string) {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
    }),
  });

  const data: any = await response.json();
  console.log("Token exchange response:", data);
  return data.access_token;
}

// Get user data from GitHub
async function getGitHubUser(access_token: string) {
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const userData = await response.json();
    console.log("GitHub user data:", userData);
    return userData;
  } catch (error) {
    console.error("Error fetching GitHub user:", error);
    throw error;
  }
}

// Modified GitHub auth endpoint
router.post("/github", async (req, res) => {
  try {
    const { code } = req.body;
    console.log("Received code:", code);

    if (!code) {
      return res.status(400).json({ message: "Code is required" });
    }

    // Exchange code for access token
    const access_token = await exchangeCodeForToken(code);

    if (!access_token) {
      return res.status(400).json({ message: "Failed to get access token" });
    }

    // Get user data from GitHub
    const githubUser: any = await getGitHubUser(access_token);

    if (!githubUser || !githubUser.id) {
      return res
        .status(400)
        .json({ message: "Failed to get GitHub user data" });
    }

    // Find or create user
    let user = await User.findOne({ github_id: githubUser.id.toString() });

    if (!user) {
      // Create user with optional email
      user = await User.create({
        github_id: githubUser.id.toString(),
        username: githubUser.login,
        email: githubUser.email || `${githubUser.login}@github.com`, // Provide a default email if none exists
        access_token: access_token,
      });
    } else {
      user.access_token = access_token;
      if (githubUser.email) {
        user.email = githubUser.email;
      }
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "24h",
    });

    res.json({ user, token });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// fetches the user info
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
