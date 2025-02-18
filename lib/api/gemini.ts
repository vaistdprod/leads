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
    You are a lead enrichment assistant. Your task is to analyze this lead and provide insights:
    Name: ${input.firstName} ${input.lastName}
    Company: ${input.company}
    Position: ${input.position}
    Email: ${input.email}

    Provide insights in this exact JSON format (do not include any other text):
    {
      "companyInfo": "Brief company background and key information",
      "positionInfo": "Role responsibilities and typical challenges",
      "industryTrends": "Current industry trends and challenges",
      "commonInterests": "Potential talking points based on role/industry",
      "potentialPainPoints": "Likely business challenges or needs",
      "relevantNews": "Any recent developments or news"
    }

    Important: 
    1. Handle Czech names and companies appropriately
    2. If information is unavailable, provide a clear message in Czech
    3. Maintain professional tone
  `;

  const prompt = input.enrichmentPrompt || defaultPrompt;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(text);
      // Validate the structure
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          companyInfo: parsed.companyInfo || "Informace o společnosti nejsou k dispozici.",
          positionInfo: parsed.positionInfo || "Detaily o pozici nejsou k dispozici.",
          industryTrends: parsed.industryTrends || "Aktuální trendy v oboru nejsou k dispozici.",
          commonInterests: parsed.commonInterests || "Společné zájmy nelze určit.",
          potentialPainPoints: parsed.potentialPainPoints || "Možné problémy nelze identifikovat.",
          relevantNews: parsed.relevantNews || "Žádné relevantní novinky nejsou k dispozici."
        };
      }
      throw new Error('Invalid JSON structure');
    } catch (e) {
      // If not valid JSON, try to extract JSON from the text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            companyInfo: parsed.companyInfo || "Informace o společnosti nejsou k dispozici.",
            positionInfo: parsed.positionInfo || "Detaily o pozici nejsou k dispozici.",
            industryTrends: parsed.industryTrends || "Aktuální trendy v oboru nejsou k dispozici.",
            commonInterests: parsed.commonInterests || "Společné zájmy nelze určit.",
            potentialPainPoints: parsed.potentialPainPoints || "Možné problémy nelze identifikovat.",
            relevantNews: parsed.relevantNews || "Žádné relevantní novinky nejsou k dispozici."
          };
        } catch {
          // If still can't parse, return structured error
          console.error('Failed to parse enrichment data:', text);
          return {
            companyInfo: "Informace o společnosti nejsou k dispozici.",
            positionInfo: "Detaily o pozici nejsou k dispozici.",
            industryTrends: "Aktuální trendy v oboru nejsou k dispozici.",
            commonInterests: "Společné zájmy nelze určit.",
            potentialPainPoints: "Možné problémy nelze identifikovat.",
            relevantNews: "Žádné relevantní novinky nejsou k dispozici."
          };
        }
      }
      
      // If no JSON found, return default structure
      return {
        companyInfo: "Informace o společnosti nejsou k dispozici.",
        positionInfo: "Detaily o pozici nejsou k dispozici.",
        industryTrends: "Aktuální trendy v oboru nejsou k dispozici.",
        commonInterests: "Společné zájmy nelze určit.",
        potentialPainPoints: "Možné problémy nelze identifikovat.",
        relevantNews: "Žádné relevantní novinky nejsou k dispozici."
      };
    }
  } catch (error) {
    console.error('Failed to enrich lead data:', error);
    return {
      companyInfo: "Informace o společnosti nejsou k dispozici.",
      positionInfo: "Detaily o pozici nejsou k dispozici.",
      industryTrends: "Aktuální trendy v oboru nejsou k dispozici.",
      commonInterests: "Společné zájmy nelze určit.",
      potentialPainPoints: "Možné problémy nelze identifikovat.",
      relevantNews: "Žádné relevantní novinky nejsou k dispozici."
    };
  }
}

export async function generateEmail(contact: { firstName: string; lastName: string; email: string; company: string; position: string }, enrichmentData: EnrichmentData, config: EmailInput): Promise<{ subject: string; body: string }> {
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const defaultPrompt = `
    You are an email writing assistant. Write a personalized cold email in this exact JSON format (do not include any other text):
    {
      "subject": "Brief, engaging subject line",
      "body": "Complete email body with signature"
    }

    The email is for:
    Name: ${contact.firstName} ${contact.lastName}
    Company: ${contact.company}
    Position: ${contact.position}

    Use these insights:
    ${JSON.stringify(enrichmentData, null, 2)}

    Requirements:
    1. Keep it concise and professional
    2. Reference specific insights from the enrichment data
    3. Focus on value proposition
    4. Include a clear call to action
    5. End with a signature from: ${config.senderEmail}
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
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // If still can't parse, return default structure
          return {
            subject: `Introduction from ${config.senderEmail}`,
            body: `Dear ${contact.firstName},\n\nI hope this email finds you well. I noticed your role as ${contact.position} at ${contact.company} and wanted to connect.\n\nBest regards,\n${config.senderEmail}`
          };
        }
      }
      
      // If no JSON found, return default structure
      return {
        subject: `Introduction from ${config.senderEmail}`,
        body: `Dear ${contact.firstName},\n\nI hope this email finds you well. I noticed your role as ${contact.position} at ${contact.company} and wanted to connect.\n\nBest regards,\n${config.senderEmail}`
      };
    }
  } catch (error) {
    console.error('Failed to generate email:', error);
    throw error;
  }
}
