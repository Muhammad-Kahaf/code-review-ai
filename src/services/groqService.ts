import axios from 'axios';
import { GROQ_BASE_URL, GROQ_MODEL, GROQ_API_KEY } from '../config';

export const analyzeCode = async (
  code: string, 
  apiKey: string = GROQ_API_KEY, 
  focusModes: string[], 
  language: string,
  signal?: AbortSignal
) => {
  const response = await axios.post(
    `${GROQ_BASE_URL}/chat/completions`,
    {
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a Principal Software Architect and Security Auditor conducting an enterprise code inspection.
Analyze the target code systematically across the requested dimensions: ${focusModes.join(', ')}.

COMMUNICATION & TONE:
- Language: ${language}
- Tone: Crisp, technical, objective, and authoritative (like SonarQube / Snyk enterprise audit reports).
- Provide an Executive Summary with an overall "Code Quality & Reliability Index" score (0-100/100).
- Categorize findings into: [CRITICAL DEFECTS], [SECURITY & COMPLIANCE], [PERFORMANCE & RESOURCE EFFICIENCY], and [ARCHITECTURAL REFACTORING].
- For each recommendation, provide concise technical rationale, industry standard references (OWASP, CWE, RFC, ECMAScript, ISO), and clean 'diff' remediation blocks.

CITATIONS & CITATION FORMAT:
For key architectural recommendations, cite standard specifications:
> 📌 **Standard / Reference:** [Standard or Specification Name] (e.g. OWASP ASVS, CWE-89, RFC 7519, Google TypeScript Style Guide)
> 💡 **Architectural Rationale:** [Clear, precise engineering rationale]`
        },
        {
          role: 'user',
          content: `Inspect and audit the following source code:\n\n\`\`\`\n${code}\n\`\`\``
        }
      ],
      temperature: 0.15
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal
    }
  );

  return response.data.choices[0].message.content;
};

export const analyzePR = async (
  combinedDiff: string, 
  apiKey: string = GROQ_API_KEY,
  signal?: AbortSignal
) => {
  const prompt = `You are a Senior Security & QA Lead auditing a GitHub Pull Request diff.
You must output a strictly valid JSON object containing exactly one key: "reviews". The value of "reviews" must be an array of objects.
Each object represents an actionable defect or security vulnerability on a specific line:
- "path": The exact file path (e.g. "src/App.tsx")
- "line": The exact post-patch line number where the issue occurs.
- "body": Professional, actionable markdown explanation and fix.

If no defects or vulnerabilities exist, return { "reviews": [] }.

PULL REQUEST DIFF:
${combinedDiff}`;

  const response = await axios.post(
    `${GROQ_BASE_URL}/chat/completions`,
    {
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an automated code quality and security auditor. Output strictly valid JSON.'
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
      },
      signal
    }
  );

  const content: string = response.data.choices[0].message.content;
  try {
    return JSON.parse(content);
  } catch (e: any) {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error(e?.message || 'Failed to parse audit response as JSON');
  }
};
