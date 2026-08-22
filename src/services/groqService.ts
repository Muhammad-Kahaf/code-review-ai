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
  const prompt = `You are an elite AI Code Reviewer. Review the following GitHub Pull Request diff patches.
You must output a strictly valid JSON object containing exactly one key: "reviews". The value of "reviews" must be an array of objects.
Each object represents a specific issue on a specific line of code and must have exactly these keys:
- "path": The exact file path (e.g. "src/App.tsx")
- "line": The exact line number in the patched file where the comment applies (guess the exact right-side post-patch line number based on the @@ diff headers).
- "body": The markdown comment describing the issue or suggestion.

Only comment on actual issues (security, bugs, bad practices). If everything looks perfect, return { "reviews": [] }.

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
  } catch (e: any) {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error(e?.message || 'Failed to parse AI response as JSON');
  }
};
