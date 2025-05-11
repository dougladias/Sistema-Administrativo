// src/utils/date-helpers.ts

/**
 * Ajusta uma data ISO para evitar problemas de fuso horário
 * Isso é útil quando exibimos datas que vêm do backend
 * @param dateString String de data ISO ou objeto Date
 * @returns String de data ISO sem o componente de hora
 */
export function adjustDateForTimezone(dateString: string | Date): string {
  if (!dateString) return '';
  
  try {
    let date;
    if (typeof dateString === 'string') {
      // Verificar se a string da data é válida
      if (dateString.includes('GM') && !dateString.includes('GMT')) {
        // Corrigir formato inválido "GM" para "GMT"
        dateString = dateString.replace('GM', 'GMT');
      }
      date = new Date(dateString);
    } else {
      date = dateString;
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      console.error('Data inválida:', dateString);
      return '';
    }
    
    // Extrair o ano, mês e dia
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Retornar no formato YYYY-MM-DD (sem componente de hora)
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Erro ao ajustar data para fuso horário:', error);
    return '';
  }
}

/**
 * Formata uma data de maneira segura para exibição no formato brasileiro
 * @param date String de data ISO, objeto Date, ou null/undefined
 * @returns String formatada (DD/MM/YYYY) ou mensagem de fallback
 */
export function safeFormatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return 'Data não informada';
  }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verificar se a data é válida
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida';
    }
    
    // Formatar para o padrão brasileiro DD/MM/YYYY
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Erro na data';
  }
}

/**
 * Formata uma data para exibição com mês por extenso
 * @param date String de data ISO ou objeto Date
 * @returns String formatada (DD de Mês de YYYY)
 */
export function formatDateWithMonthName(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida';
    }
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const month = monthNames[dateObj.getMonth()];
    
    return `${day} de ${month} de ${year}`;
  } catch (error) {
    console.error('Erro ao formatar data com nome do mês:', error);
    return 'Erro na data';
  }
}

/**
 * Calcula a idade a partir de uma data de nascimento
 * @param birthDate Data de nascimento
 * @returns Idade em anos
 */
export function calculateAge(birthDate: Date | string): number {
  try {
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    
    if (isNaN(birth.getTime())) {
      return 0;
    }
    
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    // Ajustar a idade se ainda não passou do aniversário este ano
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('Erro ao calcular idade:', error);
    return 0;
  }
}

/**
 * Calcula o tempo de serviço a partir da data de admissão
 * @param hiringDate Data de admissão
 * @returns String formatada do tempo de serviço
 */
export function calculateTimeOfService(hiringDate: Date | string): string {
  try {
    const hiring = typeof hiringDate === 'string' ? new Date(hiringDate) : hiringDate;
    
    if (isNaN(hiring.getTime())) {
      return 'Data inválida';
    }
    
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - hiring.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0 && months > 0) {
      return `${years} ano${years > 1 ? 's' : ''} e ${months} mês${months > 1 ? 'es' : ''}`;
    } else if (years > 0) {
      return `${years} ano${years > 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} mês${months > 1 ? 'es' : ''}`;
    } else {
      return `${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    }
  } catch (error) {
    console.error('Erro ao calcular tempo de serviço:', error);
    return 'Erro no cálculo';
  }
}

/**
 * Verifica se uma data é válida
 * @param date String de data ou objeto Date
 * @returns Boolean indicando se a data é válida
 */
export function isValidDate(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return !isNaN(dateObj.getTime());
  } catch { // Error variable removed as it's not used
    return false;
  }
}