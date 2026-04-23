import { Octokit } from '@octokit/rest';
import axios from 'axios';

export const getOctokit = (token: string) => new Octokit({ auth: token });

export const GithubService = {
  getOctokit: (token: string) => new Octokit({ auth: token }),

  fetchContent: async (url: string) => {
    try {
      let rawUrl = url;
      if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
        rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      }
      const res = await axios.get(rawUrl);
      return typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
    } catch (err) {
      console.error('Github Fetch Error:', err);
      throw new Error('Failed to fetch from GitHub. Ensure the URL is public.');
    }
  },

  getPRDetails: async (token: string, owner: string, repo: string, pullNumber: number) => {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.pulls.get({ owner, repo, pull_number: pullNumber });
    return data;
  },

  updateFileOnBranch: async (token: string, owner: string, repo: string, path: string, content: string, message: string, branch: string) => {
    const octokit = new Octokit({ auth: token });

    const bytes = new TextEncoder().encode(content);
    const base64 = btoa(String.fromCharCode(...bytes));

    const attemptUpdate = async () => {
      // 1. Get the current file SHA
      let sha: string | undefined;
      try {
        const { data: fileData } = await octokit.rest.repos.getContent({ owner, repo, path, ref: branch });
        if (!Array.isArray(fileData) && 'sha' in fileData) sha = fileData.sha;
      } catch (e) {
        console.log('File does not exist yet or error getting content:', e);
      }

      // 2. Create or update the file
      return await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: base64,
        sha,
        branch
      });
    };

    try {
      return await attemptUpdate();
    } catch (err: unknown) {
      const error = err as { status: number };
      if (error.status === 409) {
        console.warn(`Conflict (409) for ${path}. Retrying once with fresh SHA...`);
        return await attemptUpdate();
      }
      throw error;
    }
  },

  mergePR: async (token: string, owner: string, repo: string, pullNumber: number) => {
    const octokit = new Octokit({ auth: token });
    await octokit.rest.pulls.merge({
      owner,
      repo,
      pull_number: pullNumber,
      merge_method: 'squash'
    });
  },

  createBranch: async (token: string, owner: string, repo: string, branchName: string, baseBranch: string = 'main') => {
    const octokit = new Octokit({ auth: token });
    // 1. Get base branch SHA
    const { data: ref } = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${baseBranch}` });
    // 2. Create new ref
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha
    });
  },

  createPullRequest: async (token: string, owner: string, repo: string, title: string, head: string, base: string, body: string) => {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body
    });
    return data;
  },

  getRepoTree: async (token: string, owner: string, repo: string, branch: string = 'main') => {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: 'true'
    });
    return data.tree;
  },

  approvePullRequest: async (token: string, owner: string, repo: string, pullNumber: number) => {
    const octokit = new Octokit({ auth: token });
    await octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      event: 'APPROVE',
      body: '🤖 [CodeReview.AI] Autonomous approval for auto-merge.'
    });
  },

  getBranches: async (token: string, owner: string, repo: string) => {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.repos.listBranches({ owner, repo, per_page: 100 });
    return data;
  },

  getIssues: async (token: string, owner: string, repo: string) => {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.issues.listForRepo({ owner, repo, state: 'open', per_page: 50 });
    return data.filter(i => !i.pull_request); // Only real issues, not PRs
  }
};

export const decodeBase64UTF8 = (base64Str: string) => {
  const binString = atob(base64Str.replace(/\n/g, ''));
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};
