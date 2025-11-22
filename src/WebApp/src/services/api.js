import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5290/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('Erro na requisição:', error.response.data);
      throw error.response.data;
    } else if (error.request) {
      console.error('Sem resposta do servidor');
      throw { mensagem: 'Erro de conexão com o servidor' };
    } else {
      console.error('Erro:', error.message);
      throw { mensagem: error.message };
    }
  }
);

// pacientes
export const pacientesAPI = {
  listar: () => api.get('/pacientes'),
  buscar: (id) => api.get(`/pacientes/${id}`),
  buscarPorNome: (nome) => api.get(`/pacientes/buscar?nome=${nome}`),
  cadastrar: (data) => api.post('/pacientes', data),
  atualizar: (id, data) => api.put(`/pacientes/${id}`, data),
  desativar: (id) => api.delete(`/pacientes/${id}`),
};

// atendimentos
export const atendimentosAPI = {
  criar: (pacienteId) => api.post('/atendimentos', { pacienteId }),
  buscar: (id) => api.get(`/atendimentos/${id}`),
  obterFila: () => api.get('/atendimentos/fila'),
  chamarProximo: () => api.post('/atendimentos/chamar-proximo'),
  finalizar: (id) => api.patch(`/atendimentos/${id}/finalizar`),
  listarPorPaciente: (pacienteId) => api.get(`/atendimentos/paciente/${pacienteId}`),
  listarPorStatus: (status) => api.get(`/atendimentos/status/${status}`),
};

// triagens
export const triagensAPI = {
  registrar: (data) => api.post('/triagens', data),
  buscar: (id) => api.get(`/triagens/${id}`),
  buscarPorAtendimento: (atendimentoId) => api.get(`/triagens/atendimento/${atendimentoId}`),
  listarPorEspecialidade: (especialidadeId) => api.get(`/triagens/especialidade/${especialidadeId}`),
};

// especialidades
export const especialidadesAPI = {
  listar: () => api.get('/especialidades'),
  buscar: (id) => api.get(`/especialidades/${id}`),
  cadastrar: (data) => api.post('/especialidades', data),
  desativar: (id) => api.delete(`/especialidades/${id}`),
};

export default api;