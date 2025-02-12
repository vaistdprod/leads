import { GoogleGenerativeAI } from '@google/generative-ai';

export const enrichLeadData = async (lead: Record<string, string>): Promise<string> => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
    Hledej na internetu podrobnosti o tomto kontaktu a napiš stručné shrnutí v češtině:
    
    Jméno: ${lead.firstName} ${lead.lastName}
    Společnost: ${lead.company}
    Pozice: ${lead.position}
    
    Zaměř se na:
    1. Profesní historii
    2. Úspěchy ve firmě
    3. Relevantní projekty
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

export const generateEmail = async (lead: Record<string, string>, enrichmentData: string): Promise<{ subject: string; body: string }> => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
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
    
    Formát:
    [SUBJECT]: <předmět emailu - max 3 slova>
    [BODY]: <tělo emailu>
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  const subjectMatch = text.match(/\[SUBJECT\]:\s*(.+)/);
  const bodyMatch = text.match(/\[BODY\]:\s*(.+)/s);

  return {
    subject: subjectMatch?.[1] || 'Nabídka spolupráce',
    body: bodyMatch?.[1] || text,
  };
};