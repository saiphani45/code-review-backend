import { Request, Response } from "express";
import { GitHubService } from "../services/github-service.js";
import User from "../models/user-model.js";

export class GitHubController {
  constructor() {
    // Bind all methods to maintain 'this' context
    this.getRepositories = this.getRepositories.bind(this);
    this.getPullRequests = this.getPullRequests.bind(this);
    this.getPullRequestFiles = this.getPullRequestFiles.bind(this);
    this.getPullRequestComments = this.getPullRequestComments.bind(this);
    this.createPullRequestComment = this.createPullRequestComment.bind(this);
    this.submitPullRequestReview = this.submitPullRequestReview.bind(this);
  }

  async getRepositories(req: Request, res: Response): Promise<void> {
    try {
      const user = await User.findById((req as any).user.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const githubService = new GitHubService(user.access_token);
      const repositories = await githubService.getUserRepositories();
      res.json(repositories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch repositories" });
    }
  }

  async getPullRequests(req: Request, res: Response): Promise<void> {
    try {
      const { owner, repo } = req.params;
      const user = await User.findById((req as any).user.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const githubService = new GitHubService(user.access_token);
      const pullRequests = await githubService.getRepoPullRequests(owner, repo);
      res.json(pullRequests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pull requests" });
    }
  }
  async getPullRequest(req: Request, res: Response): Promise<void> {
    try {
      const { owner, repo, pullNumber } = req.params;
      const user = await User.findById((req as any).user.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const githubService = new GitHubService(user.access_token);
      const pullRequest = await githubService.getRepoPullRequest(
        owner,
        repo,
        Number(pullNumber)
      );
      res.json(pullRequest);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pull requests" });
    }
  }

  async getPullRequestFiles(req: Request, res: Response): Promise<void> {
    try {
      const { owner, repo, pull_number } = req.params;
      const user = await User.findById((req as any).user.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const githubService = new GitHubService(user.access_token);
      const files = await githubService.getPullRequestFiles(
        owner,
        repo,
        Number(pull_number)
      );
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch PR files" });
    }
  }

  async getPullRequestComments(req: Request, res: Response): Promise<void> {
    try {
      const { owner, repo, pull_number } = req.params;
      const user = await User.findById((req as any).user.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const githubService = new GitHubService(user.access_token);
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

  async createPullRequestComment(req: Request, res: Response): Promise<void> {
    try {
      const { owner, repo, pull_number } = req.params;
      const { body, path, line, position } = req.body;
      const user = await User.findById((req as any).user.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const githubService = new GitHubService(user.access_token);
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

  async submitPullRequestReview(req: Request, res: Response): Promise<void> {
    try {
      const { owner, repo, pull_number } = req.params;
      const { event, body } = req.body;
      const user = await User.findById((req as any).user.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const githubService = new GitHubService(user.access_token);
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
