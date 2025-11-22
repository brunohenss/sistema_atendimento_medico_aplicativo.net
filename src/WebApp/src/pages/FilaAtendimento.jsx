import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { calcularTempoEspera, formatarTempoEspera } from '../utils/dateUtils';

const FilaAtendimento = () => {
  const [fila, setFila] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [estatisticas, setEstatisticas] = useState({
    aguardando: 0,
    emTriagem: 0,
    emAtendimento: 0,
    total: 0
  });

  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 30000);
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
      emTriagem: filaAtual.filter(a => a.status === 'EmTriagem').length,
      emAtendimento: filaAtual.filter(a => a.status === 'EmAtendimento').length,
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
      toast.error('Este paciente já possui um atendimento em andamento.');
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
    const aguardandoOuTriagem = fila.filter(
      a => a.status === 'Aguardando' || a.status === 'EmTriagem'
    );
    
    if (aguardandoOuTriagem.length === 0) {
      toast.info('Não há pacientes aguardando na fila');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/atendimentos/chamar-proximo');

      if (response.data) {
        toast.success(`Chamando ${response.data.nomePaciente} - Senha ${response.data.numeroSequencial}`);
        await carregarDados();
      }
    } catch (error) {
      console.error('Erro ao chamar próximo:', error);
      toast.error('Erro ao chamar paciente');
    } finally {
      setLoading(false);
    }
  };

  const finalizarAtendimento = async (atendimentoId, nomePaciente, numeroSequencial) => {
    if (!window.confirm(`Deseja finalizar o atendimento de ${nomePaciente}?`)) {
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/atendimentos/${atendimentoId}/finalizar`);
      toast.success(`Atendimento da senha ${numeroSequencial} finalizado!`);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao finalizar atendimento:', error);
      toast.error('Erro ao finalizar atendimento');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Aguardando': {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        label: 'Aguardando',
        icon: '⏱️'
      },
      'EmTriagem': {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        label: 'Em Triagem',
        icon: '🩺'
      },
      'EmAtendimento': {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        label: 'Em Atendimento',
        icon: '👨‍⚕️'
      }
    };

    const badge = badges[status] || badges['Aguardando'];
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
        <span>{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  const renderAcoes = (atendimento) => {
    const { status, atendimentoId, nomePaciente, numeroSequencial } = atendimento;

    if (status === 'Aguardando') {
      return (
        <span className="text-sm text-gray-400 italic">
          Aguardando triagem
        </span>
      );
    }

    if (status === 'EmTriagem') {
      return (
        <button
          onClick={() => chamarProximo()}
          disabled={loading}
          className="group relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Chamar
        </button>
      );
    }

    if (status === 'EmAtendimento') {
      return (
        <button
          onClick={() => finalizarAtendimento(atendimentoId, nomePaciente, numeroSequencial)}
          disabled={loading}
          className="group relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Finalizar
        </button>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/*header*/}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fila de Atendimento</h1>
              <p className="text-sm text-gray-500">Gestão de senhas e triagem</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/*gera senha*/}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Gerar nova senha
              </label>
              <div className="flex gap-2">
                <select
                  value={pacienteSelecionado}
                  onChange={(e) => setPacienteSelecionado(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Gerar
                </button>
              </div>
            </div>

            {/*chamar proximo*/}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Chamar próximo paciente
              </label>
              <button
                onClick={chamarProximo}
                disabled={loading || (estatisticas.aguardando === 0 && estatisticas.emTriagem === 0)}
                className="w-full px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {(estatisticas.aguardando === 0 && estatisticas.emTriagem === 0)
                  ? 'Nenhum paciente aguardando' 
                  : 'Chamar Próximo'}
              </button>
            </div>
          </div>
        </div>

        {/*metricas*/}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/*aguardando*/}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl shadow-sm border border-amber-200 p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-sm font-medium mb-1">Aguardando</p>
                <p className="text-3xl font-bold text-amber-700">{estatisticas.aguardando}</p>
              </div>
              <div className="w-12 h-12 bg-amber-200/50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏱️</span>
              </div>
            </div>
          </div>

          {/*em triagem*/}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl shadow-sm border border-blue-200 p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium mb-1">Em Triagem</p>
                <p className="text-3xl font-bold text-blue-700">{estatisticas.emTriagem}</p>
              </div>
              <div className="w-12 h-12 bg-blue-200/50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🩺</span>
              </div>
            </div>
          </div>

          {/*em atendimento*/}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl shadow-sm border border-emerald-200 p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium mb-1">Em Atendimento</p>
                <p className="text-3xl font-bold text-emerald-700">{estatisticas.emAtendimento}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-200/50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👨‍⚕️</span>
              </div>
            </div>
          </div>

          {/*total*/}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl shadow-sm border border-purple-200 p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium mb-1">Total na Fila</p>
                <p className="text-3xl font-bold text-purple-700">{estatisticas.total}</p>
              </div>
              <div className="w-12 h-12 bg-purple-200/50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
        </div>

        {/*tabela*/}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900">Pacientes na Fila</h2>
            <p className="text-sm text-gray-500 mt-1">Lista de todos os atendimentos em andamento</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Senha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Telefone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Especialidade</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tempo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {fila.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">Nenhum paciente na fila</p>
                        <p className="text-sm text-gray-400">Gere uma nova senha para começar</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  fila.map((atendimento, index) => {
                    const tempoEspera = calcularTempoEspera(atendimento.dataHoraChegada);
                    
                    return (
                      <tr key={atendimento.atendimentoId} className="hover:bg-gray-50/50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                              <span className="text-lg font-bold text-white">
                                {String(atendimento.numeroSequencial).padStart(2, '0')}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{atendimento.nomePaciente}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{atendimento.telefone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(atendimento.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{atendimento.especialidade || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatarTempoEspera(tempoEspera)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderAcoes(atendimento)}
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
    </div>
  );
};

export default FilaAtendimento;