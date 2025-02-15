import { GoogleGenerativeAI } from '@google/generative-ai';

interface EnrichmentOptions {
  geminiApiKey: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  useGoogleSearch?: boolean;
  enrichmentPrompt?: string;
}

interface EmailOptions {
  geminiApiKey: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  emailPrompt?: string;
}

function replaceVariables(template: string, data: Record<string, any>): string {
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    const value = data[key.trim()];
    return value !== undefined ? value : match; // Keep the placeholder if value is undefined
  });
}

export const enrichLeadData = async (lead: Record<string, any>): Promise<string> => {
  const {
    geminiApiKey,
    temperature = 0.7,
    topK = 40,
    topP = 0.95,
    useGoogleSearch = false,
    enrichmentPrompt = '',
    ...contactData
  } = lead;

  if (!geminiApiKey) {
    throw new Error('Gemini API key is required');
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-pro',
    generationConfig: {
      temperature,
      topK,
      topP,
    }
  });

  const defaultPrompt = `
    Hledej na internetu podrobnosti o tomto kontaktu a napiš stručné shrnutí v češtině:
    
    Jméno: ${contactData.firstName} ${contactData.lastName}
    Společnost: ${contactData.company}
    Pozice: ${contactData.position}
    
    Zaměř se na:
    1. Profesní historii
    2. Úspěchy ve firmě
    3. Relevantní projekty
  `;

  const prompt = enrichmentPrompt ? replaceVariables(enrichmentPrompt, contactData) : defaultPrompt;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Failed to enrich lead data:', error);
    throw new Error('Failed to enrich lead data');
  }
};

export const generateEmail = async (
  lead: Record<string, string>, 
  enrichmentData: string,
  options: EmailOptions
): Promise<{ subject: string; body: string }> => {
  const {
    geminiApiKey,
    temperature = 0.7,
    topK = 40,
    topP = 0.95,
    emailPrompt = '',
  } = options;

  if (!geminiApiKey) {
    throw new Error('Gemini API key is required');
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-pro',
    generationConfig: {
      temperature,
      topK,
      topP,
    }
  });

  const defaultPrompt = `
    Napiš profesionální email v češtině pro potenciálního klienta.
    
    Kontakt:
    Jméno: ${lead.firstName} ${lead.lastName}
    Společnost: ${lead.company}
    Pozice: ${lead.position}
    
    Dodatečné informace:
    ${enrichmentData}
    
    Požadavky:
    - Krátký, profesionální, ale přátelský tón
    - Personalizovaný úvod využívající dodatečné informace
    - Nabídka pomoci, ne prodej
    - Zmínka o zlepšení efektivity jejich operací
    - Možnost odpovědět "ne" pro odmítnutí
    
    Odpověz přesně v tomto formátu:
    [SUBJECT]: <předmět emailu>
    [BODY]: <tělo emailu>
    [/BODY]
  `;

  const templateData = {
    ...lead,
    enrichmentData,
  };

  const prompt = emailPrompt ? replaceVariables(emailPrompt, templateData) : defaultPrompt;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse the response using more robust regex
    const subjectMatch = text.match(/\[SUBJECT\]:\s*([^\n]+)/);
    const bodyMatch = text.match(/\[BODY\]:\s*([\s\S]*?)(?:\[\/BODY\]|$)/);

    if (!subjectMatch || !bodyMatch) {
      console.error('Failed to parse email template. Response:', text);
      
      // Fallback parsing for different formats
      const fallbackSubjectMatch = text.match(/(?:\*\*SUBJECT:\*\*|Subject:|Předmět:)\s*([^\n]+)/i);
      const remainingText = text.replace(/(?:\*\*SUBJECT:\*\*|Subject:|Předmět:)\s*[^\n]+\n+/i, '').trim();
      
      if (fallbackSubjectMatch) {
        return {
          subject: fallbackSubjectMatch[1].trim(),
          body: remainingText
        };
      }
      
      throw new Error('Failed to parse email template');
    }

    const subject = subjectMatch[1].trim();
    const body = bodyMatch[1].trim();

    // Validate the output
    if (!subject || !body) {
      throw new Error('Generated email is missing subject or body');
    }

    // Replace any remaining variables in the body
    const processedBody = replaceVariables(body, {
      ...lead,
      enrichmentData,
    });

    return { 
      subject,
      body: processedBody
    };
  } catch (error) {
    console.error('Failed to generate email:', error);
    throw new Error('Failed to generate email');
  }
};