import { GoogleGenerativeAI } from "@google/generative-ai";
import { trackApiUsage } from './tracking';

interface PageSpeedMetrics {
  mobile: {
    scores: {
      performance: number;
      accessibility: number;
      bestPractices: number;
      seo: number;
    };
    metrics: {
      firstContentfulPaint: number;
      speedIndex: number;
      largestContentfulPaint: number;
      timeToInteractive: number;
      totalBlockingTime: number;
      cumulativeLayoutShift: number;
    };
    opportunities: Array<{
      title: string;
      description: string;
      savings: number | null;
    }>;
  };
  desktop: {
    scores: {
      performance: number;
      accessibility: number;
      bestPractices: number;
      seo: number;
    };
    metrics: {
      firstContentfulPaint: number;
      speedIndex: number;
      largestContentfulPaint: number;
      timeToInteractive: number;
      totalBlockingTime: number;
      cumulativeLayoutShift: number;
    };
    opportunities: Array<{
      title: string;
      description: string;
      savings: number | null;
    }>;
  };
}

interface EnrichmentInput {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  website?: string;
  pageSpeedMetrics?: PageSpeedMetrics;
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
  performanceInsights?: {
    summary: string;
    opportunities: string[];
    businessImpact: string;
  };
  [key: string]: any;
}

export async function enrichLeadData(input: EnrichmentInput): Promise<EnrichmentData> {
  const startTime = Date.now();
  let status = 200;
  
  const genAI = new GoogleGenerativeAI(input.geminiApiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-pro",
    generationConfig: {
      temperature: input.temperature || 0.3,
      topK: input.topK || 20,
      topP: input.topP || 0.8
    }
  });

  const defaultPrompt = `You are a lead enrichment assistant. Your responses must:
1. Return ONLY valid JSON, no markdown or other formatting
2. Handle Czech names and companies appropriately
3. Provide clear Czech messages when information is unavailable
4. Maintain professional tone
5. Never search for or suggest alternative contact information

Analyze this lead and provide insights:
Name: ${input.firstName} ${input.lastName}
Company: ${input.company}
Position: ${input.position}
Email: ${input.email}
${input.website ? `Website: ${input.website}` : ''}

${input.pageSpeedMetrics ? `
Website Performance Metrics:
Mobile Performance Score: ${input.pageSpeedMetrics.mobile.scores.performance}
Desktop Performance Score: ${input.pageSpeedMetrics.desktop.scores.performance}
Mobile Loading Speed: ${Math.round(input.pageSpeedMetrics.mobile.metrics.largestContentfulPaint / 1000)}s
Desktop Loading Speed: ${Math.round(input.pageSpeedMetrics.desktop.metrics.largestContentfulPaint / 1000)}s
Key Opportunities: ${input.pageSpeedMetrics.mobile.opportunities.slice(0, 3).map(o => o.title).join(', ')}
` : ''}

Return EXACTLY this JSON structure with Czech content (no other text, no markdown):
{
  "companyInfo": "Stručný popis společnosti a klíčové informace",
  "positionInfo": "Odpovědnosti role a typické výzvy",
  "industryTrends": "Aktuální trendy a výzvy v oboru",
  "commonInterests": "Možné společné zájmy na základě role/oboru",
  "potentialPainPoints": "Pravděpodobné obchodní výzvy nebo potřeby",
  "relevantNews": "Aktuální vývoj nebo novinky"${input.pageSpeedMetrics ? `,
  "performanceInsights": {
    "summary": "Shrnutí výkonu webu a jeho dopadu na byznys",
    "opportunities": ["Konkrétní příležitosti ke zlepšení"],
    "businessImpact": "Obchodní dopad současného výkonu webu"
  }` : ''}
}`;

  const prompt = input.enrichmentPrompt || defaultPrompt;
  let result;

  try {
    result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object' && parsed !== null) {
        const replaceTemplateVars = (str: string) => {
          return str
            .replace(/\${firstName}/g, input.firstName)
            .replace(/\${lastName}/g, input.lastName)
            .replace(/\${company}/g, input.company)
            .replace(/\${position}/g, input.position);
        };

        const enrichedData = {
          companyInfo: replaceTemplateVars(parsed.companyInfo || `Pro společnost ${input.company} nejsou k dispozici dostatečné informace`),
          positionInfo: replaceTemplateVars(parsed.positionInfo || `${input.firstName} ${input.lastName} působí na pozici ${input.position}`),
          industryTrends: replaceTemplateVars(parsed.industryTrends || "Pro tento obor nejsou k dispozici aktuální trendy"),
          commonInterests: replaceTemplateVars(parsed.commonInterests || "Na základě dostupných informací nelze určit společné zájmy"),
          potentialPainPoints: replaceTemplateVars(parsed.potentialPainPoints || "Bez detailnějších informací nelze identifikovat konkrétní výzvy"),
          relevantNews: replaceTemplateVars(parsed.relevantNews || `Pro společnost ${input.company} nejsou k dispozici aktuální novinky`)
        };

        await trackApiUsage('gemini', 'enrichLeadData', status, Date.now() - startTime, {
          success: true,
          company: input.company,
          position: input.position
        });

        return enrichedData;
      }
      throw new Error('Invalid JSON structure');
    } catch (e) {
      status = 400;
      const defaultData = {
        companyInfo: "Informace o společnosti nejsou k dispozici.",
        positionInfo: "Detaily o pozici nejsou k dispozici.",
        industryTrends: "Aktuální trendy v oboru nejsou k dispozici.",
        commonInterests: "Společné zájmy nelze určit.",
        potentialPainPoints: "Možné problémy nelze identifikovat.",
        relevantNews: "Žádné relevantní novinky nejsou k dispozici."
      };

      await trackApiUsage('gemini', 'enrichLeadData', status, Date.now() - startTime, {
        success: false,
        error: 'Failed to parse response',
        company: input.company,
        position: input.position
      });

      return defaultData;
    }
  } catch (error) {
    status = 500;
    console.error('Failed to enrich lead data:', error);

    await trackApiUsage('gemini', 'enrichLeadData', status, Date.now() - startTime, {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      company: input.company,
      position: input.position
    });

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
  const startTime = Date.now();
  let status = 200;

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-pro",
    generationConfig: {
      temperature: config.temperature || 0.7,
      topK: config.topK || 40,
      topP: config.topP || 0.95
    }
  });

  const defaultPrompt = `You are an email writing assistant specializing in performance-driven outreach. Your responses must:
1. Be in exact JSON format with no additional text
2. Be concise and professional
3. Focus on data-driven value propositions
4. Include specific performance metrics when available
5. Provide clear, actionable insights
6. Include a compelling call to action
7. Never suggest or use alternative contact information
8. Use Czech language and adapt to Czech business culture

Write a personalized cold email for:
Name: ${contact.firstName} ${contact.lastName}
Company: ${contact.company}
Position: ${contact.position}

Using these insights:
${JSON.stringify(enrichmentData, null, 2)}

Consider these guidelines for performance-based messaging:
- If mobile performance score is below 70, emphasize mobile-first importance
- If desktop performance is significantly better than mobile, highlight mobile optimization opportunities
- For high-traffic potential sites, focus on conversion impact
- For e-commerce positions, emphasize loading time's impact on sales
- For marketing roles, focus on SEO and visibility benefits
- For technical roles, highlight specific technical improvements
- For executive roles, focus on business impact and ROI

Return in this exact JSON format:
{
  "subject": "Brief, engaging subject line focusing on performance opportunity",
  "body": "Complete email body with:
  1. Personal connection point
  2. Specific performance insights
  3. Business impact statement
  4. Clear value proposition
  5. Call to action
  Signature from ${config.senderEmail}"
}`;

  const prompt = config.emailPrompt || defaultPrompt;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    try {
      const parsed = JSON.parse(text);
      await trackApiUsage('gemini', 'generateEmail', status, Date.now() - startTime, {
        success: true,
        company: contact.company,
        position: contact.position
      });
      return parsed;
    } catch (e) {
      status = 400;
      const defaultEmail = {
        subject: `Introduction from ${config.senderEmail}`,
        body: `Dear ${contact.firstName},\n\nI hope this email finds you well. I noticed your role as ${contact.position} at ${contact.company} and wanted to connect.\n\nBest regards,\n${config.senderEmail}`
      };

      await trackApiUsage('gemini', 'generateEmail', status, Date.now() - startTime, {
        success: false,
        error: 'Failed to parse response',
        company: contact.company,
        position: contact.position
      });

      return defaultEmail;
    }
  } catch (error) {
    status = 500;
    console.error('Failed to generate email:', error);

    await trackApiUsage('gemini', 'generateEmail', status, Date.now() - startTime, {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      company: contact.company,
      position: contact.position
    });

    throw error;
  }
}
