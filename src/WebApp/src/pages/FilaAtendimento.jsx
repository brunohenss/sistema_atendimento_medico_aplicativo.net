import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { calcularTempoEspera, formatarTempoEspera, formatarDataLocal } from '../utils/dateUtils';

const FilaAtendimento = () => {
  const [fila, setFila] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [estatisticas, setEstatisticas] = useState({
    aguardando: 0,
    emAtendimento: 0,
    total: 0
  });

  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 15000);
    return () => clearInterval(interval);
  }, []);

  const carregarDados = async () => {
    try {
      const [filaRes, pacientesRes] = await Promise.all([
        api.get('/atendimentos/fila'),
        api.get('/pacientes')
      ]);

      setFila(filaRes.data);
      setPacientes(pacientesRes.data);
      calcularEstatisticas(filaRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da fila');
    }
  };

  const calcularEstatisticas = (filaAtual) => {
    const stats = {
      aguardando: filaAtual.filter(a => a.status === 'Aguardando').length,
      emAtendimento: filaAtual.filter(a => 
        a.status === 'EmAtendimento' || a.status === 'EmTriagem'
      ).length,
      total: filaAtual.length
    };
    setEstatisticas(stats);
  };

  const pacientePodeReceberNovaSenha = (pacienteId) => {
    const atendimentosAtivos = fila.filter(
      a => a.pacienteId === pacienteId && 
      ['Aguardando', 'EmTriagem', 'EmAtendimento'].includes(a.status)
    );
    
    return atendimentosAtivos.length === 0;
  };

  const gerarSenha = async () => {
    if (!pacienteSelecionado) {
      toast.warning('Selecione um paciente');
      return;
    }

    const pacienteId = parseInt(pacienteSelecionado);

    if (!pacientePodeReceberNovaSenha(pacienteId)) {
      toast.error('Este paciente já possui um atendimento em andamento. Finalize o atendimento anterior antes de gerar uma nova senha.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/atendimentos', {
        pacienteId: pacienteId
      });

      toast.success(`Senha ${response.data.numeroSequencial} gerada com sucesso!`);
      setPacienteSelecionado('');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao gerar senha:', error);
      const mensagem = error.response?.data?.mensagem || 'Erro ao gerar senha';
      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  };

  const chamarProximo = async () => {
    const aguardando = fila.filter(a => a.status === 'Aguardando');
    
    if (aguardando.length === 0) {
      toast.info('Não há pacientes aguardando na fila');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/atendimentos/chamar-proximo');

      if (response.data) {
        toast.success(`Chamando paciente ${response.data.nomePaciente} - Senha ${response.data.numeroSequencial}`);
        await carregarDados();
      } else {
        toast.info('Não há pacientes aguardando');
      }
    } catch (error) {
      console.error('Erro ao chamar próximo:', error);
      const mensagem = error.response?.data?.mensagem || 'Erro ao chamar paciente';
      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Aguardando':
        return 'bg-yellow-100 text-yellow-800';
      case 'EmTriagem':
        return 'bg-blue-100 text-blue-800';
      case 'EmAtendimento':
        return 'bg-green-100 text-green-800';
      case 'Finalizado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Aguardando':
        return 'Aguardando';
      case 'EmTriagem':
        return 'Em Triagem';
      case 'EmAtendimento':
        return 'Em Atendimento';
      case 'Finalizado':
        return 'Finalizado';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/*modal gerar nova senha*/}
          <div>
            <h3 className="text-lg font-semibold mb-4">Gerar nova senha</h3>
            <div className="flex gap-2">
              <select
                value={pacienteSelecionado}
                onChange={(e) => setPacienteSelecionado(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Selecione o paciente</option>
                {pacientes.map((paciente) => {
                  const podeReceber = pacientePodeReceberNovaSenha(paciente.id);
                  return (
                    <option 
                      key={paciente.id} 
                      value={paciente.id}
                      disabled={!podeReceber}
                    >
                      {paciente.nome} {!podeReceber ? '(em atendimento)' : ''}
                    </option>
                  );
                })}
              </select>
              <button
                onClick={gerarSenha}
                disabled={loading || !pacienteSelecionado}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Gerar Senha
              </button>
            </div>
          </div>

          {/*chamar paciente*/}
          <div>
            <h3 className="text-lg font-semibold mb-4">Chamar paciente</h3>
            <button
              onClick={chamarProximo}
              disabled={loading || estatisticas.aguardando === 0}
              className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {estatisticas.aguardando === 0 
                ? 'Nenhum paciente aguardando' 
                : 'Chamar Próximo Paciente'}
            </button>
          </div>
        </div>
      </div>

      {/*algumas estatisticas*/}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Aguardando</p>
              <p className="text-3xl font-bold text-yellow-700">{estatisticas.aguardando}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Em Atendimento</p>
              <p className="text-3xl font-bold text-green-700">{estatisticas.emAtendimento}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total na Fila</p>
              <p className="text-3xl font-bold text-blue-700">{estatisticas.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/*lista de pacientes na fila*/}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Pacientes na Fila</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Senha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Especialidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tempo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fila.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Nenhum paciente na fila
                  </td>
                </tr>
              ) : (
                fila.map((atendimento) => {
                  //calcula tempo de espera em utc
                  const tempoEspera = calcularTempoEspera(atendimento.dataHoraChegada);
                  
                  return (
                    <tr key={atendimento.atendimentoId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-2xl font-bold text-blue-600">
                          {String(atendimento.numeroSequencial).padStart(3, '0')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {atendimento.nomePaciente}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {atendimento.telefone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(atendimento.status)}`}>
                          {getStatusLabel(atendimento.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {atendimento.especialidade || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatarTempoEspera(tempoEspera)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FilaAtendimento;