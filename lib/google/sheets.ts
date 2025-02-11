// Client-side sheets API wrapper
export async function getBlacklist(sheetId: string): Promise<string[]> {
  if (!sheetId) return [];

  try {
    const response = await fetch(`/api/sheets/blacklist?sheetId=${sheetId}`);
    if (!response.ok) throw new Error('Failed to fetch blacklist');
    const data = await response.json();
    return data.emails || [];
  } catch (error) {
    console.error('Failed to get blacklist:', error);
    return [];
  }
}

export async function getContacts(sheetId: string) {
  if (!sheetId) return [];

  try {
    const response = await fetch(`/api/sheets/contacts?sheetId=${sheetId}`);
    if (!response.ok) throw new Error('Failed to fetch contacts');
    const data = await response.json();
    return data.contacts || [];
  } catch (error) {
    console.error('Failed to get contacts:', error);
    return [];
  }
}
