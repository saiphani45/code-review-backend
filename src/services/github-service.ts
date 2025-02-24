import { Octokit } from "@octokit/rest"; // @octokit/rest, passport-github2, and passport are libraries that allow you to authenticate users with GitHub

export class GitHubService {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
      timeZone: "UTC",
    });
  }

  async getUserRepositories() {
    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        sort: "updated",
        direction: "desc",
        per_page: 100,
      });
      return data;
    } catch (error) {
      console.error("Error fetching repositories:", error);
      throw error;
    }
  }

  async getRepoPullRequests(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.pulls.list({
        owner,
        repo,
        state: "open",
        sort: "updated",
        direction: "desc",
      });
      return data;
    } catch (error) {
      console.error("Error fetching pull requests:", error);
      throw error;
    }
  }
  async getRepoPullRequest(owner: string, repo: string, pullNumber: number) {
    try {
      const { data } = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
      });
      return data;
    } catch (error) {
      console.error("Error fetching pull request:", error);
      throw error;
    }
  }

  async getPullRequestFiles(owner: string, repo: string, pullNumber: number) {
    try {
      const { data } = await this.octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
      });
      return data;
    } catch (error) {
      console.error("Error fetching PR files:", error);
      throw error;
    }
  }

  async getPullRequestComments(
    owner: string,
    repo: string,
    pullNumber: number
  ) {
    const { data } = await this.octokit.pulls.listReviewComments({
      owner,
      repo,
      pull_number: pullNumber,
    });
    return data;
  }

  async createPullRequestComment(
    owner: string,
    repo: string,
    pullNumber: number,
    params: {
      body: string;
      path?: string;
      line?: number;
      position?: number;
    }
  ) {
    const { data } = await this.octokit.pulls.createReviewComment({
      owner,
      repo,
      pull_number: pullNumber,
      ...params,
    });
    return data;
  }

  async submitPullRequestReview(
    owner: string,
    repo: string,
    pullNumber: number,
    event: string,
    body?: string
  ) {
    const { data } = await this.octokit.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      event,
      body,
    });
    return data;
  }
}
