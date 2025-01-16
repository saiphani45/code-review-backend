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
  async getPullRequestFiles(req: Request, res: Response) {
    try {
      const { owner, repo, pull_number } = req.params;
      console.log({
        owner: owner,
        repo: repo,
        pull_number: pull_number,
      });
      const pullNumber: any = pull_number;
      const { accessToken } = (req as any).user;
      console.log("accessToken", accessToken);
      const githubService = new GitHubService(accessToken);
      const files = await githubService.getPullRequestFiles(
        owner,
        repo,
        pullNumber
      );
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch PR files" });
    }
  }

  async getPullRequestComments(req: Request, res: Response) {
    try {
      const { owner, repo, pull_number } = req.params;
      const { access_token } = (req as any).user;

      const githubService = new GitHubService(access_token);
      const comments = await githubService.getPullRequestComments(
        owner,
        repo,
        Number(pull_number)
      );

      res.json(comments);
    } catch (error) {
      console.error("Error fetching PR comments:", error);
      res.status(500).json({ error: "Failed to fetch pull request comments" });
    }
  }
  async createPullRequestComment(req: Request, res: Response) {
    try {
      const { owner, repo, pull_number } = req.params;
      const { body, path, line, position } = req.body;
      const { access_token } = (req as any).user;

      const githubService = new GitHubService(access_token);
      const comment = await githubService.createPullRequestComment(
        owner,
        repo,
        Number(pull_number),
        {
          body,
          path,
          line,
          position,
        }
      );

      res.json(comment);
    } catch (error) {
      console.error("Error creating PR comment:", error);
      res.status(500).json({ error: "Failed to create pull request comment" });
    }
  }

  async submitPullRequestReview(req: Request, res: Response) {
    try {
      const { owner, repo, pull_number } = req.params;
      const { event, body } = req.body;
      const { access_token } = (req as any).user;

      const githubService = new GitHubService(access_token);
      const review = await githubService.submitPullRequestReview(
        owner,
        repo,
        Number(pull_number),
        event,
        body
      );

      res.json(review);
    } catch (error) {
      console.error("Error submitting PR review:", error);
      res.status(500).json({ error: "Failed to submit pull request review" });
    }
  }
}
