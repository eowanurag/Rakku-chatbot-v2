export function validateIncidentDate(value: string, currentDate = new Date()): boolean {
  if (!value) return false;
  const cleanVal = value.trim().toLowerCase();

  if (cleanVal === 'today') {
    return true;
  }
  if (cleanVal === 'yesterday') {
    return true;
  }
  if (cleanVal === 'tomorrow') {
    return false;
  }

  const numericRegex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
  let match = cleanVal.match(numericRegex);
  let day = 0;
  let month = 0;
  let year = 0;

  if (match) {
    day = parseInt(match[1], 10);
    month = parseInt(match[2], 10);
    year = parseInt(match[3], 10);
  } else {
    const wordRegex = /^(\d{1,2})\s+([^\s\d]+)\s+(\d{4})$/;
    match = cleanVal.match(wordRegex);
    if (!match) return false;

    day = parseInt(match[1], 10);
    const monthName = match[2].trim();
    year = parseInt(match[3], 10);

    const monthMap: Record<string, number> = {
      'जनवरी': 1, 'जन': 1, 'jan': 1, 'january': 1,
      'फरवरी': 2, 'फर': 2, 'feb': 2, 'february': 2,
      'मार्च': 3, 'mar': 3, 'march': 3,
      'अप्रैल': 4, 'अप्रै': 4, 'apr': 4, 'april': 4,
      'मई': 5, 'may': 5,
      'जून': 6, 'jun': 6, 'june': 6,
      'जुलाई': 7, 'जुला': 7, 'jul': 7, 'july': 7,
      'अगस्त': 8, 'अग': 8, 'aug': 8, 'august': 8,
      'सितंबर': 9, 'सितम्बर': 9, 'सित': 9, 'sep': 9, 'september': 9,
      'अक्टूबर': 10, 'अक्तूबर': 10, 'अक्तू': 10, 'ऑक्टोबर': 10, 'oct': 10, 'october': 10,
      'नवंबर': 11, 'नवम्बर': 11, 'नव': 11, 'nov': 11, 'november': 11,
      'दिसंबर': 12, 'दिसम्बर': 12, 'दिस': 12, 'dec': 12, 'december': 12
    };

    const mappedMonth = monthMap[monthName] || monthMap[monthName.toLowerCase()];
    if (!mappedMonth) return false;
    month = mappedMonth;
  }

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if ([4, 6, 9, 11].includes(month) && day > 30) return false;

  if (month === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    if (day > (isLeap ? 29 : 28)) return false;
  }

  const parsedDate = new Date(year, month - 1, day);
  parsedDate.setHours(0, 0, 0, 0);

  const compareDate = new Date(currentDate);
  compareDate.setHours(23, 59, 59, 999);

  if (parsedDate > compareDate) {
    return false;
  }

  return true;
}
