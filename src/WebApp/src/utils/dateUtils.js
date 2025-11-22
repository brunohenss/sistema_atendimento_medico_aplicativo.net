export const utcToLocal = (utcDate) => {
  if (!utcDate) return null;
  
  const date = new Date(utcDate);
  
  return date;
};

export const localToUtc = (localDate) => {
  if (!localDate) return null;
  
  return localDate.toISOString();
};

export const calcularTempoEspera = (dataChegadaUtc, dataReferenciaUtc = null) => {
  if (!dataChegadaUtc) return 0;
  
  const chegada = new Date(dataChegadaUtc);
  const referencia = dataReferenciaUtc ? new Date(dataReferenciaUtc) : new Date();
  
  const diferencaMs = referencia - chegada;
  const minutos = Math.floor(diferencaMs / 60000);
  
  return Math.max(0, minutos);
};

export const formatarDataLocal = (utcDate, formato = 'completo') => {
  if (!utcDate) return '-';
  
  const date = utcToLocal(utcDate);
  
  const opcoesDia = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
  
  const opcoesHora = { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
  
  switch(formato) {
    case 'data':
      return date.toLocaleDateString('pt-BR', opcoesDia);
    case 'hora':
      return date.toLocaleTimeString('pt-BR', opcoesHora);
    case 'completo':
    default:
      return date.toLocaleString('pt-BR', { ...opcoesDia, ...opcoesHora });
  }
};

export const formatarTempoEspera = (minutos) => {
  if (!minutos || minutos < 0) return '0 min';
  
  if (minutos < 60) {
    return `${minutos} min`;
  }
  
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  
  if (mins === 0) {
    return `${horas}h`;
  }
  
  return `${horas}h ${mins}min`;
};

export const obterDataAtualUtc = () => {
  return new Date().toISOString();
};

export default {
  utcToLocal,
  localToUtc,
  calcularTempoEspera,
  formatarDataLocal,
  formatarTempoEspera,
  obterDataAtualUtc
};