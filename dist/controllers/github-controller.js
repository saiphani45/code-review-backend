"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubController = void 0;
const github_service_1 = require("../services/github-service");
class GitHubController {
    async getRepositories(req, res) {
        try {
            const { accessToken } = req.user;
            const githubService = new github_service_1.GitHubService(accessToken);
            const repositories = await githubService.getUserRepositories();
            res.json(repositories);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch repositories" });
        }
    }
    async getPullRequests(req, res) {
        try {
            const { owner, repo } = req.params;
            const { accessToken } = req.user;
            const githubService = new github_service_1.GitHubService(accessToken);
            const pullRequests = await githubService.getRepoPullRequests(owner, repo);
            res.json(pullRequests);
        }
        catch (error) {
            res.status(500).json({ error: "Failed to fetch pull requests" });
        }
    }
}
exports.GitHubController = GitHubController;
