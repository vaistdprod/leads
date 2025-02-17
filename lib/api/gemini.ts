import { GoogleGenerativeAI } from "@google/generative-ai";

interface EnrichmentInput {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  geminiApiKey: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  useGoogleSearch?: boolean;
  enrichmentPrompt?: string;
}

interface EmailInput {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  geminiApiKey: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  emailPrompt?: string;
  senderEmail: string;
}

export interface EnrichmentData {
  companyInfo?: string;
  positionInfo?: string;
  industryTrends?: string;
  commonInterests?: string;
  potentialPainPoints?: string;
  relevantNews?: string;
  [key: string]: string | undefined;
}

export async function enrichLeadData(input: EnrichmentInput): Promise<EnrichmentData> {
  const genAI = new GoogleGenerativeAI(input.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const defaultPrompt = `
    Help me understand more about this lead:
    Name: ${input.firstName} ${input.lastName}
    Company: ${input.company}
    Position: ${input.position}
    Email: ${input.email}

    Please provide:
    1. Company information and background
    2. Position responsibilities and challenges
    3. Industry trends and challenges
    4. Potential common interests or talking points
    5. Possible pain points or needs
    6. Recent news or developments (if any)

    Format the response as JSON with these keys:
    {
      "companyInfo": "...",
      "positionInfo": "...",
      "industryTrends": "...",
      "commonInterests": "...",
      "potentialPainPoints": "...",
      "relevantNews": "..."
    }
  `;

  const prompt = input.enrichmentPrompt || defaultPrompt;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    try {
      // Try to parse as JSON
      return JSON.parse(text);
    } catch (e) {
      // If not valid JSON, try to extract JSON from the text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If still can't parse, return structured error
      console.error('Failed to parse enrichment data:', text);
      return {
        error: 'Failed to parse enrichment data',
        rawResponse: text
      };
    }
  } catch (error) {
    console.error('Failed to enrich lead data:', error);
    throw error;
  }
}

export async function generateEmail(contact: { firstName: string; lastName: string; email: string; company: string; position: string }, enrichmentData: EnrichmentData, config: EmailInput): Promise<{ subject: string; body: string }> {
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const defaultPrompt = `
    Write a personalized cold email to:
    Name: ${contact.firstName} ${contact.lastName}
    Company: ${contact.company}
    Position: ${contact.position}

    Using this enrichment data:
    ${JSON.stringify(enrichmentData, null, 2)}

    The email should:
    1. Be concise and professional
    2. Reference specific insights from the enrichment data
    3. Focus on value proposition
    4. Have a clear call to action
    5. Include a signature from: ${config.senderEmail}

    Format the response as JSON with these keys:
    {
      "subject": "The email subject line",
      "body": "The complete email body with signature"
    }
  `;

  const prompt = config.emailPrompt || defaultPrompt;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    try {
      // Try to parse as JSON
      return JSON.parse(text);
    } catch (e) {
      // If not valid JSON, try to extract JSON from the text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If still can't parse, return error
      console.error('Failed to parse email:', text);
      throw new Error('Failed to generate email: Invalid response format');
    }
  } catch (error) {
    console.error('Failed to generate email:', error);
    throw error;
  }
}
