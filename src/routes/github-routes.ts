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
router.get(
  "/repos/:owner/:repo/pulls/:pull_number/files",
  authMiddleware,
  githubController.getPullRequestFiles
);


router.get(
  "/repos/:owner/:repo/pulls/:pull_number/comments",
  authMiddleware,
  githubController.getPullRequestComments
);

router.post(
  "/repos/:owner/:repo/pulls/:pull_number/comments",
  authMiddleware,
  githubController.createPullRequestComment
);

router.post(
  "/repos/:owner/:repo/pulls/:pull_number/reviews",
  authMiddleware,
  githubController.submitPullRequestReview
);

export default router;
