import { Request, Response } from "express";
import { GitHubService } from "../services/github-service";

export class GitHubController {
  async getRepositories(req: Request, res: Response) {
    try {
      const { accessToken } = (req as any).user as { accessToken: string };
      const githubService = new GitHubService(accessToken);
      const repositories = await githubService.getUserRepositories();
      res.json(repositories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch repositories" });
    }
  }

  async getPullRequests(req: Request, res: Response) {
    try {
      const { owner, repo } = req.params;
      const { accessToken } = (req as any).user as { accessToken: string };
      const githubService = new GitHubService(accessToken);
      const pullRequests = await githubService.getRepoPullRequests(owner, repo);
      res.json(pullRequests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pull requests" });
    }
  }
}
