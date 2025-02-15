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
  senderEmail?: string;
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
    senderEmail = '',
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

  // Extract sender name from email
  const senderName = senderEmail ? senderEmail.split('@')[0].split('.').map(
    part => part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' ') : '[Vaše jméno]';

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
    - Podpis: "${senderName}"
    
    Odpověz přesně v tomto formátu:
    [SUBJECT]: <předmět emailu>
    [BODY]: <tělo emailu>
    [/BODY]
  `;

  const templateData = {
    ...lead,
    enrichmentData,
    senderName,
  };

  const prompt = emailPrompt ? replaceVariables(emailPrompt, templateData) : defaultPrompt;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Enhanced parsing logic
    let subject = '';
    let body = '';

    // Try different format patterns
    const formats = [
      // Standard format
      {
        subjectRegex: /\[SUBJECT\]:\s*([^\n]+)/,
        bodyRegex: /\[BODY\]:\s*([\s\S]*?)(?:\[\/BODY\]|$)/
      },
      // Alternative format with **
      {
        subjectRegex: /\*\*SUBJECT:\*\*\s*([^\n]+)/i,
        bodyRegex: /(?:\*\*SUBJECT:\*\*[^\n]+\n\s*)([\s\S]*)/i
      },
      // Simple Subject: format
      {
        subjectRegex: /Subject:\s*([^\n]+)/i,
        bodyRegex: /(?:Subject:[^\n]+\n\s*)([\s\S]*)/i
      },
      // Předmět: format (Czech)
      {
        subjectRegex: /Předmět:\s*([^\n]+)/i,
        bodyRegex: /(?:Předmět:[^\n]+\n\s*)([\s\S]*)/i
      }
    ];

    // Try each format until we find a match
    for (const format of formats) {
      const subjectMatch = text.match(format.subjectRegex);
      const bodyMatch = text.match(format.bodyRegex);

      if (subjectMatch && bodyMatch) {
        subject = subjectMatch[1].trim();
        body = bodyMatch[1].trim();
        break;
      }
    }

    // If no format matched, use fallback
    if (!subject || !body) {
      // Use first line as subject and rest as body
      const lines = text.split('\n');
      subject = lines[0].replace(/^[^:]*:\s*/, '').trim();
      body = lines.slice(1).join('\n').trim();
    }

    // Clean up subject and body
    subject = subject
      .replace(/^\*+|\*+$/g, '') // Remove asterisks at start/end
      .replace(/^["']|["']$/g, '') // Remove quotes at start/end
      .trim();

    body = body.replace(/\[Vaše jméno\]/g, senderName);

    // Final validation
    if (!subject || !body) {
      throw new Error('Failed to parse email content');
    }

    // Replace any remaining variables
    const processedBody = replaceVariables(body, {
      ...lead,
      enrichmentData,
      senderName,
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