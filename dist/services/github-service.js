"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubService = void 0;
// @octokit/rest, passport-github2, and passport are libraries that allow you to authenticate users with GitHub
const rest_1 = require("@octokit/rest");
class GitHubService {
    constructor(accessToken) {
        this.octokit = new rest_1.Octokit({
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
        }
        catch (error) {
            console.error("Error fetching repositories:", error);
            throw error;
        }
    }
    async getRepoPullRequests(owner, repo) {
        try {
            const { data } = await this.octokit.pulls.list({
                owner,
                repo,
                state: "open",
                sort: "updated",
                direction: "desc",
            });
            return data;
        }
        catch (error) {
            console.error("Error fetching pull requests:", error);
            throw error;
        }
    }
    async getPullRequestFiles(owner, repo, pullNumber) {
        try {
            const { data } = await this.octokit.pulls.listFiles({
                owner,
                repo,
                pull_number: pullNumber,
            });
            return data;
        }
        catch (error) {
            console.error("Error fetching PR files:", error);
            throw error;
        }
    }
}
exports.GitHubService = GitHubService;
