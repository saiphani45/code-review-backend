import { mockFiles, mockComments } from "./mockApi";

const BASE_URL = "http://localhost:8000/api";

export const apiClient = {
  async getPullRequestFiles(owner: string, repo: string, pullNumber: number) {
    // For development, return mock data
    if (process.env.NODE_ENV === "development") {
      return mockFiles;
    }

    const response = await fetch(
      `${BASE_URL}/github/repos/${owner}/${repo}/pulls/${pullNumber}/files`
    );
    return response.json();
  },

  async getPullRequestComments(
    owner: string,
    repo: string,
    pullNumber: number
  ) {
    // For development, return mock data
    if (process.env.NODE_ENV === "development") {
      return mockComments;
    }

    const response = await fetch(
      `${BASE_URL}/github/repos/${owner}/${repo}/pulls/${pullNumber}/comments`
    );
    return response.json();
  },

  async createComment(
    owner: string,
    repo: string,
    pullNumber: number,
    comment: any
  ) {
    // For development, simulate API call
    if (process.env.NODE_ENV === "development") {
      return {
        id: Math.random(),
        user: {
          id: 1,
          login: "testuser",
          avatar_url: "https://github.com/identicons/test.png",
          html_url: "https://github.com/testuser",
        },
        body: comment.body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        path: comment.path,
        line: comment.line,
      };
    }

    const response = await fetch(
      `${BASE_URL}/github/repos/${owner}/${repo}/pulls/${pullNumber}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(comment),
      }
    );
    return response.json();
  },
};
