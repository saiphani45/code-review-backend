"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubConfig = void 0;
exports.githubConfig = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL ||
        "http://localhost:3000/api/auth/github/callback",
    scope: ["repo", "user"],
};
