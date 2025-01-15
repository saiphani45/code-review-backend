import { Router } from "express";
import { GitHubController } from "../controllers/github-controller";
import { authMiddleware } from "../middleware/middleware";

const router = Router();
const githubController = new GitHubController();

router.get("/repositories", authMiddleware, githubController.getRepositories);
router.get(
  "/repos/:owner/:repo/pulls",
  authMiddleware,
  githubController.getPullRequests
);

export default router;
