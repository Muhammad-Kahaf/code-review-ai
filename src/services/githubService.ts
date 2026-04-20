import { Octokit } from '@octokit/rest';
import axios from 'axios';

export const getOctokit = (token: string) => new Octokit({ auth: token });

export const fetchGithubContent = async (url: string) => {
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
};

export const decodeBase64UTF8 = (base64Str: string) => {
  const binString = atob(base64Str.replace(/\n/g, ''));
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};
