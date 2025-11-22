import React, { useState, useEffect } from 'react';
import { atendimentosAPI, triagensAPI, especialidadesAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const Triagem = () => {
  const [atendimentos, setAtendimentos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null);
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    atendimentoId: '',
    sintomas: '',
    pressaoArterial: '',
    peso: '',
    altura: '',
    especialidadeId: '',
    observacoes: '',
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [filaResponse, especialidadesResponse] = await Promise.all([
        atendimentosAPI.obterFila(),
        especialidadesAPI.listar(),
      ]);
      
      const aguardando = filaResponse.data.filter(
        (a) => a.status === 'Aguardando' && !a.possuiTriagem
      );
      setAtendimentos(aguardando);
      setEspecialidades(especialidadesResponse.data);
    } catch (error) {
      showError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarTriagem = (atendimento) => {
    setAtendimentoSelecionado(atendimento);
    setFormData({
      ...formData,
      atendimentoId: atendimento.atendimentoId,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dados = {
      ...formData,
      peso: parseFloat(formData.peso),
      altura: parseFloat(formData.altura),
      especialidadeId: parseInt(formData.especialidadeId),
    };

    try {
      await triagensAPI.registrar(dados);
      showSuccess('Triagem registrada com sucesso!');
      handleCloseModal();
      carregarDados();
    } catch (error) {
      showError(error.mensagem || 'Erro ao registrar triagem');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setAtendimentoSelecionado(null);
    setFormData({
      atendimentoId: '',
      sintomas: '',
      pressaoArterial: '',
      peso: '',
      altura: '',
      especialidadeId: '',
      observacoes: '',
    });
  };

  const calcularIMC = () => {
    const peso = parseFloat(formData.peso);
    const altura = parseFloat(formData.altura);
    if (peso && altura && altura > 0) {
      const imc = peso / (altura * altura);
      return imc.toFixed(2);
    }
    return '-';
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Triagem</h2>
        <p className="text-gray-600">
          Registre os dados da triagem para os pacientes aguardando atendimento
        </p>
      </div>

      {/* Lista de pacientes aguardando triagem */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Pacientes Aguardando Triagem ({atendimentos.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : atendimentos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum paciente aguardando triagem
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
                    Tempo de Espera
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {atendimentos.map((atendimento) => (
                  <tr key={atendimento.atendimentoId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-2xl font-bold text-blue-600">
                        {atendimento.numeroSequencial.toString().padStart(3, '0')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {atendimento.nomePaciente}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {atendimento.telefone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {atendimento.tempoEsperaMinutos} min
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRegistrarTriagem(atendimento)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Registrar Triagem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de triagem */}
      {showModal && atendimentoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">Registrar Triagem</h3>
              <p className="text-gray-600 mt-1">
                Paciente: {atendimentoSelecionado.nomePaciente} - Senha:{' '}
                {atendimentoSelecionado.numeroSequencial}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sintomas *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.sintomas}
                  onChange={(e) => setFormData({ ...formData, sintomas: e.target.value })}
                  placeholder="Descreva os sintomas apresentados pelo paciente"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pressão Arterial *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pressaoArterial}
                    onChange={(e) =>
                      setFormData({ ...formData, pressaoArterial: e.target.value })
                    }
                    placeholder="120/80"
                    pattern="\d{2,3}/\d{2,3}"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="1"
                    max="500"
                    value={formData.peso}
                    onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Altura (m) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.3"
                    max="2.5"
                    value={formData.altura}
                    onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                    placeholder="1.75"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IMC Calculado
                  </label>
                  <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900 font-medium">
                    {calcularIMC()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidade *
                </label>
                <select
                  required
                  value={formData.especialidadeId}
                  onChange={(e) =>
                    setFormData({ ...formData, especialidadeId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione a especialidade</option>
                  {especialidades.map((esp) => (
                    <option key={esp.id} value={esp.id}>
                      {esp.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={formData.observacoes}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                  placeholder="Observações adicionais (opcional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Registrando...' : 'Registrar Triagem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Triagem;