import axios from 'axios';
import { GROQ_BASE_URL, GROQ_MODEL } from '../config';

export const analyzeCode = async (code: string, apiKey: string, focusModes: string[], language: string) => {
  const response = await axios.post(
    `${GROQ_BASE_URL}/chat/completions`,
    {
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an elite production-grade code reviewer. 
          Analyze the provided code specifically for: ${focusModes.join(', ')}.
          
          IMPORTANT: You MUST communicate entirely in ${language}. 
          Detect the programming language and provide a "Production Grade" score (0-100).
          
          ABSOLUTELY CRITICAL RULE: For EVERY single suggestion, critique, or change you propose, you MUST professionally cite your exact source. 
          Format your reasoning and source professionally for each point like this:
          
          > 📚 **Source:** [Source Name] - [Full URL]
          > 🧠 **Reasoning:** [Explain reasoning]
          
          FORMATTING: Use Markdown. Use 'diff' for code improvements.`
        },
        {
          role: 'user',
          content: `Review this code:\n\n\`\`\`\n${code}\n\`\`\``
        }
      ],
      temperature: 0.2
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.choices[0].message.content;
};

export const analyzePR = async (combinedDiff: string, apiKey: string) => {
  const prompt = `You are a Senior Lead Software Engineer & Security Auditor. 
Review the following GitHub Pull Request diff patches for PRODUCTION-READY code.
You must output a strictly valid JSON object containing exactly one key: "reviews". 
The value of "reviews" must be an array of objects.

Focus Areas:
1. Security: Look for leaks, insecure patterns, or vulnerabilities.
2. Performance: Identify inefficient loops, redundant calls, or memory issues.
3. Architecture: Suggest better patterns or clean code practices.
4. Bugs: Catch potential logical flaws.

Only comment on actual, critical issues. If the code is solid, return { "reviews": [] }.

Each object in the array must have:
- "path": The exact file path.
- "line": The exact line number in the patched file (right-side).
- "body": A technical, concise comment with a suggested fix.

PULL REQUEST DIFF:
${combinedDiff}`;

  const response = await axios.post(
    `${GROQ_BASE_URL}/chat/completions`,
    {
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an AI code reviewer. Always output raw JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const content: string = response.data.choices[0].message.content;
  try {
    return JSON.parse(content);
  } catch (e) {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error(e || 'Failed to parse AI response as JSON');
  }
};
export const generateCodeFix = async (code: string, issues: string, apiKey: string) => {
  const response = await axios.post(
    `${GROQ_BASE_URL}/chat/completions`,
    {
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a Staff Software Engineer. Fix the provided code to be production-grade, secure, and performant. Return ONLY the raw code. No markdown code blocks, no explanations, no text before or after the code.'
        },
        {
          role: 'user',
          content: `FIX THESE ISSUES:\n${issues}\n\nIN THIS CODE:\n${code}`
        }
      ],
      temperature: 0.1
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.choices[0].message.content.trim().replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '');
};

export const planEngineeringTask = async (taskDescription: string, repoTree: string, apiKey: string) => {
  const prompt = `You are a Lead Software Engineer. Plan the implementation of the following task.
  TASK: ${taskDescription}
  
  REPOSITORY STRUCTURE:
  ${repoTree}
  
  You must output a strictly valid JSON object:
  {
    "plan": "Short summary of the approach",
    "filesToModify": ["path/to/file1.ts", "path/to/file2.tsx"],
    "filesToCreate": ["path/to/newfile.ts"],
    "branchName": "feature/short-description"
  }`;

  const response = await axios.post(
    `${GROQ_BASE_URL}/chat/completions`,
    {
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'You are an engineering planner. Output raw JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    },
    {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    }
  );

  return JSON.parse(response.data.choices[0].message.content);
};

export const resolveMergeConflict = async (baseCode: string, headCode: string, fileName: string, apiKey: string) => {
  const response = await axios.post(
    `${GROQ_BASE_URL}/chat/completions`,
    {
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert Lead Developer. You must resolve a merge conflict between two versions of a file.
          VERSION A (Base/Main) and VERSION B (Head/Feature).
          Combine the changes from both versions intelligently. Ensure the code is syntactically correct and preserves functionality from both sides where appropriate.
          
          RETURN ONLY THE RAW MERGED CODE. NO EXPLANATIONS. NO MARKDOWN.`
        },
        {
          role: 'user',
          content: `FILE: ${fileName}\n\nVERSION A (Base):\n${baseCode}\n\nVERSION B (Head):\n${headCode}`
        }
      ],
      temperature: 0.1
    },
    {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    }
  );

  return response.data.choices[0].message.content.trim().replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '');
};
