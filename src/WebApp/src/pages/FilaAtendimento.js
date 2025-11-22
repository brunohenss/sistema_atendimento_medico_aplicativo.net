import React, { useState, useEffect } from 'react';
import { atendimentosAPI, pacientesAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const FilaAtendimento = () => {
  const [fila, setFila] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState('');
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    carregarFila();
    carregarPacientes();
    const interval = setInterval(carregarFila, 10000);
    return () => clearInterval(interval);
  }, []);

  const carregarFila = async () => {
    try {
      const response = await atendimentosAPI.obterFila();
      setFila(response.data);
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
    }
  };

  const carregarPacientes = async () => {
    try {
      const response = await pacientesAPI.listar();
      setPacientes(response.data);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
    }
  };

  const gerarSenha = async () => {
    if (!selectedPaciente) {
      showError('Selecione um paciente');
      return;
    }

    setLoading(true);
    try {
      const response = await atendimentosAPI.criar(parseInt(selectedPaciente));
      showSuccess(`Senha ${response.data.numeroSequencial} gerada com sucesso!`);
      setSelectedPaciente('');
      carregarFila();
    } catch (error) {
      showError(error.mensagem || 'Erro ao gerar senha');
    } finally {
      setLoading(false);
    }
  };

  const chamarProximo = async () => {
    setLoading(true);
    try {
      const response = await atendimentosAPI.chamarProximo();
      if (response.data) {
        showSuccess(`Chamando paciente: ${response.data.nomePaciente}`);
        carregarFila();
      } else {
        showError('Não há pacientes aguardando');
      }
    } catch (error) {
      showError(error.mensagem || 'Erro ao chamar próximo paciente');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Aguardando: 'bg-yellow-100 text-yellow-800',
      EmTriagem: 'bg-blue-100 text-blue-800',
      EmAtendimento: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      Aguardando: 'Aguardando',
      EmTriagem: 'Em Triagem',
      EmAtendimento: 'Em Atendimento',
    };
    return labels[status] || status;
  };

  const filaAguardando = fila.filter((a) => a.status === 'Aguardando');
  const filaEmAtendimento = fila.filter(
    (a) => a.status === 'EmTriagem' || a.status === 'EmAtendimento'
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho com ações */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Fila de Atendimento</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Gerar nova senha */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Gerar nova senha
            </label>
            <div className="flex gap-2">
              <select
                value={selectedPaciente}
                onChange={(e) => setSelectedPaciente(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione o paciente</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} - {p.telefone}
                  </option>
                ))}
              </select>
              <button
                onClick={gerarSenha}
                disabled={loading || !selectedPaciente}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                Gerar Senha
              </button>
            </div>
          </div>

          {/* Chamar próximo */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Chamar paciente
            </label>
            <button
              onClick={chamarProximo}
              disabled={loading || filaAguardando.length === 0}
              className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {filaAguardando.length > 0
                ? `Chamar Próximo (${filaAguardando.length} aguardando)`
                : 'Nenhum paciente aguardando'}
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <div className="text-3xl font-bold text-yellow-800">{filaAguardando.length}</div>
          <div className="text-sm text-yellow-600 mt-1">Aguardando</div>
        </div>
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="text-3xl font-bold text-green-800">
            {filaEmAtendimento.length}
          </div>
          <div className="text-sm text-green-600 mt-1">Em Atendimento</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="text-3xl font-bold text-blue-800">{fila.length}</div>
          <div className="text-sm text-blue-600 mt-1">Total na Fila</div>
        </div>
      </div>

      {/* Lista da fila */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pacientes na Fila</h3>
        </div>

        {fila.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum paciente na fila no momento
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Senha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Especialidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tempo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fila.map((item) => (
                  <tr key={item.atendimentoId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-2xl font-bold text-blue-600">
                        {item.numeroSequencial.toString().padStart(3, '0')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.nomePaciente}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.telefone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.especialidade || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.tempoEsperaMinutos} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilaAtendimento;