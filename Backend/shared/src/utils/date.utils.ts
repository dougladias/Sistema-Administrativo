
// Utilitários para manipulação de datas
export function formatDateToISODate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

// Formata uma data para o formato brasileiro (DD/MM/YYYY HH:mm)
export function formatDateTimeLocal(date: Date | string | number): string {
  const d = new Date(date);
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// description
export function formatDateBR(date: Date | string | number): string {
  const d = new Date(date);
  
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

// Formata uma data para o formato brasileiro (DD/MM/YYYY)
export function parseDate(dateString: string): Date {
  const parts = dateString.split('/');
  if (parts.length !== 3) {
    throw new Error('Formato de data inválido. Use DD/MM/YYYY');
  }
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  
  return new Date(year, month, day);
}


// Adiciona dias a uma data
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Subtrai dias de uma data
export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}


// Adiciona meses a uma data
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}


// Adiciona anos a uma data 
export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}


// Retorna o início do dia (00:00:00)
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}


// Retorna o fim do dia (23:59:59.999) 
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}


// Retorna o início do mês 
export function startOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}


// Retorna o fim do mês
export function endOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  result.setDate(0);
  result.setHours(23, 59, 59, 999);
  return result;
}

// Calcula a diferença em dias entre duas datas
export function daysBetween(dateFrom: Date, dateTo: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // horas*minutos*segundos*milissegundos
  const diffMs = Math.abs(dateTo.getTime() - dateFrom.getTime());
  return Math.round(diffMs / oneDay);
}


// Calcula a diferença em meses entre duas datas
export function monthsBetween(dateFrom: Date, dateTo: Date): number {
  const months = (dateTo.getFullYear() - dateFrom.getFullYear()) * 12;
  return months + dateTo.getMonth() - dateFrom.getMonth();
}


// Calcula a diferença em anos entre duas datas
export function yearsBetween(dateFrom: Date, dateTo: Date): number {
  return monthsBetween(dateFrom, dateTo) / 12;
}


// Verifica se uma data é hoje
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}


// Verifica se uma data é maior que hoje
export function isAfterToday(date: Date): boolean {
  const today = startOfDay(new Date());
  return date.getTime() > today.getTime();
}


// Verifica se uma data é menor que hoje 
export function isBeforeToday(date: Date): boolean {
  const today = startOfDay(new Date());
  return date.getTime() < today.getTime();
}


// Verifica se uma data é um dia de semana (não é sábado nem domingo)
export function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = domingo, 6 = sábado
}


// Verifica se uma data é um final de semana (sábado ou domingo)
export function isWeekend(date: Date): boolean {
  return !isWeekday(date);
}


// Retorna o nome do mês em português
export function getMonthNamePT(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  // Ajusta para índice base-0
  const adjustedMonth = ((month - 1) % 12 + 12) % 12;
  return months[adjustedMonth];
}

// Retorna o nome do dia da semana em português
export function getWeekdayNamePT(date: Date): string {
  const weekdays = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
  ];
  
  return weekdays[date.getDay()];
}


// Retorna a data por extenso em português (ex: "14 de Março de 2023")
export function getFullDatePT(date: Date): string {
  const day = date.getDate();
  const month = getMonthNamePT(date.getMonth() + 1);
  const year = date.getFullYear();
  
  return `${day} de ${month} de ${year}`;
}


// Calcula a idade baseada na data de nascimento 
export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}


// Retorna um objeto Date a partir de ano, mês e dia
export function createDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}


// Verifica se uma string é uma data válida no formato DD/MM/YYYY 
export function isValidDateString(dateString: string): boolean {
  if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
    return false;
  }
  
  try {
    const date = parseDate(dateString);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
}