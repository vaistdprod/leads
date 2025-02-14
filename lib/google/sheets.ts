// Client-side sheets API wrapper
export async function getBlacklist(sheetId: string): Promise<string[]> {
  if (!sheetId) {
    console.error('No blacklist sheet ID provided');
    return [];
  }

  try {
    console.log('Fetching blacklist from sheet:', sheetId);
    const response = await fetch(`/api/sheets/blacklist?sheetId=${sheetId}`);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to fetch blacklist:', error);
      throw new Error(`Failed to fetch blacklist: ${error.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Blacklist data:', data);
    return data.emails || [];
  } catch (error) {
    console.error('Failed to get blacklist:', error);
    throw error;
  }
}

export async function getContacts(sheetId: string) {
  if (!sheetId) {
    console.error('No contacts sheet ID provided');
    return [];
  }

  try {
    console.log('Fetching contacts from sheet:', sheetId);
    const response = await fetch(`/api/sheets/contacts?sheetId=${sheetId}`);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to fetch contacts:', error);
      throw new Error(`Failed to fetch contacts: ${error.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Contacts data:', data);
    return data.contacts || [];
  } catch (error) {
    console.error('Failed to get contacts:', error);
    throw error;
  }
}