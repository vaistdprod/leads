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

  const defaultPrompt = `You are a lead enrichment assistant. Your responses must:
1. Be in exact JSON format with no additional text
2. Handle Czech names and companies appropriately
3. Provide clear Czech messages when information is unavailable
4. Maintain professional tone
5. Never search for or suggest alternative contact information

Analyze this lead and provide insights:
Name: ${input.firstName} ${input.lastName}
Company: ${input.company}
Position: ${input.position}
Email: ${input.email}

Return in this exact JSON format:
{
  "companyInfo": "Brief company background and key information",
  "positionInfo": "Role responsibilities and typical challenges",
  "industryTrends": "Current industry trends and challenges",
  "commonInterests": "Potential talking points based on role/industry",
  "potentialPainPoints": "Likely business challenges or needs",
  "relevantNews": "Any recent developments or news"
}`;

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

  const defaultPrompt = `You are an email writing assistant. Your responses must:
1. Be in exact JSON format with no additional text
2. Be concise and professional
3. Focus on value proposition
4. Include a clear call to action
5. Never suggest or use alternative contact information
6. Match the tone and style of these example emails

Email Writing Guidelines:
- DO: Use specific metrics and results (e.g., "zvýšení efektivity o 35%", "úspora 40% nákladů")
- DO: Reference industry-specific challenges from enrichment data
- DO: Personalize based on their role and company
- DO: Keep subject lines under 50 characters
- DO: Use soft call-to-actions for first contact
- DON'T: Use generic phrases like "hope this email finds you well"
- DON'T: Make assumptions about their challenges
- DON'T: Write more than 4-5 lines of body text
- DON'T: Use pushy or aggressive language

Industry-Specific Value Metrics to Reference:
- IT/Software: Snížení nákladů 30-50%, zrychlení procesů 2-3x
- Manufacturing: Zvýšení efektivity 25-40%, redukce prostojů o 60%
- Services: Zlepšení zákaznické spokojenosti o 40%, úspora času 20-30%
- Healthcare: Zkrácení čekací doby o 50%, zvýšení přesnosti o 35%
- Finance: Snížení chybovosti o 75%, zrychlení procesů až 4x

Example Successful Emails:

Example 1 (IT Sector):
Subject: Inovace v IT infrastruktuře - krátká schůzka?
Body: Dobrý den pane Nováku,

Všiml jsem si, že ve společnosti ABC aktivně rozvíjíte IT infrastrukturu. Pracuji na podobných projektech s firmami jako je XYZ, kde jsme dokázali snížit náklady na provoz o 40%.

Měl byste 15 minut na krátkou schůzku příští týden? Rád bych Vám ukázal, jak bychom mohli optimalizovat i Vaši infrastrukturu.

S pozdravem,
Jan Svoboda

Example 2 (Manufacturing):
Subject: Automatizace procesů - inspirace z automotive
Body: Dobrý den pane Dvořáku,

Na LinkedInu jsem zaznamenal Váš zájem o automatizaci výrobních procesů. V automotive segmentu jsme nedávno implementovali řešení, které zvýšilo efektivitu výroby o 35%.

Mohu Vám poslat případovou studii? Obsahuje konkrétní postupy, které by mohly být užitečné i pro Vaši firmu.

S přáním hezkého dne,
Petr Novotný

Example 3 (Services):
Subject: Optimalizace zákaznické podpory - quick chat?
Body: Dobrý den paní Svobodová,

Zaujalo mě Vaše působení v oblasti zákaznického servisu ve společnosti ABC. Nedávno jsme pomohli podobné firmě XYZ zkrátit reakční dobu o 65% a zvýšit CSAT o 40%.

Máte příští týden 20 minut na rychlou prezentaci těchto výsledků?

S pozdravem,
Tomáš Novák

How to Use Enrichment Data:
1. Reference companyInfo for company-specific challenges
2. Use industryTrends to show market understanding
3. Mention commonInterests to build rapport
4. Address potentialPainPoints with relevant solutions
5. Reference relevantNews to show research and timing

Write a personalized cold email for:
Name: ${contact.firstName} ${contact.lastName}
Company: ${contact.company}
Position: ${contact.position}

Using these insights:
${JSON.stringify(enrichmentData, null, 2)}

Return in this exact JSON format:
{
  "subject": "Brief, engaging subject line",
  "body": "Complete email body with signature from ${config.senderEmail}"
}`;

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
