import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatarTempoEspera, calcularTempoEspera } from '../utils/dateUtils';

const Triagem = () => {
  const navigate = useNavigate();
  const [pacientesAguardando, setPacientesAguardando] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null);
  const [formData, setFormData] = useState({
    sintomas: '',
    pressaoArterial: '',
    peso: '',
    altura: '',
    especialidadeId: '',
    observacoes: ''
  });

  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 15000);
    return () => clearInterval(interval);
  }, []);

  const carregarDados = async () => {
    try {
      const [especialidadesRes, filaRes] = await Promise.all([
        api.get('/especialidades'),
        api.get('/atendimentos/fila')
      ]);

      setEspecialidades(especialidadesRes.data);
      
      // apenas pacientes aguardando que ainda nao possuem triagem
      const aguardandoTriagem = filaRes.data.filter(
        a => a.status === 'Aguardando' && !a.possuiTriagem
      );
      
      setPacientesAguardando(aguardandoTriagem);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const abrirModalTriagem = (atendimento) => {
    setAtendimentoSelecionado(atendimento);
    setModalAberto(true);
    setFormData({
      sintomas: '',
      pressaoArterial: '',
      peso: '',
      altura: '',
      especialidadeId: '',
      observacoes: ''
    });
  };

  const fecharModal = () => {
    setModalAberto(false);
    setAtendimentoSelecionado(null);
    setFormData({
      sintomas: '',
      pressaoArterial: '',
      peso: '',
      altura: '',
      especialidadeId: '',
      observacoes: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validarFormulario = () => {
    if (!formData.sintomas || formData.sintomas.trim().length < 5) {
      toast.error('Descreva os sintomas (mínimo 5 caracteres)');
      return false;
    }

    if (!formData.pressaoArterial) {
      toast.error('Informe a pressão arterial');
      return false;
    }

    const pressaoRegex = /^\d{2,3}\/\d{2,3}$/;
    if (!pressaoRegex.test(formData.pressaoArterial)) {
      toast.error('Pressão arterial inválida. Use o formato: 120/80');
      return false;
    }

    if (!formData.peso || formData.peso <= 0) {
      toast.error('Informe o peso');
      return false;
    }

    if (!formData.altura || formData.altura <= 0) {
      toast.error('Informe a altura');
      return false;
    }

    if (!formData.especialidadeId) {
      toast.error('Selecione uma especialidade');
      return false;
    }

    return true;
  };

  const registrarTriagem = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setLoading(true);
    try {
      const dados = {
        atendimentoId: atendimentoSelecionado.atendimentoId,
        sintomas: formData.sintomas.trim(),
        pressaoArterial: formData.pressaoArterial.trim(),
        peso: parseFloat(formData.peso),
        altura: parseFloat(formData.altura),
        especialidadeId: parseInt(formData.especialidadeId),
        observacoes: formData.observacoes?.trim() || null
      };

      await api.post('/triagens', dados);

      toast.success('Triagem registrada com sucesso!');
      fecharModal();
      await carregarDados();
    } catch (error) {
      console.error('Erro ao registrar triagem:', error);
      const mensagem = error.response?.data?.mensagem || 'Erro ao registrar triagem';
      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  };

  const calcularIMC = () => {
    const peso = parseFloat(formData.peso);
    const altura = parseFloat(formData.altura);

    if (peso > 0 && altura > 0) {
      const imc = (peso / (altura * altura)).toFixed(2);
      return imc;
    }
    return null;
  };

  const getClassificacaoIMC = (imc) => {
    if (!imc) return '';
    
    if (imc < 18.5) return 'Abaixo do peso';
    if (imc < 25) return 'Peso normal';
    if (imc < 30) return 'Sobrepeso';
    if (imc < 35) return 'Obesidade grau 1';
    if (imc < 40) return 'Obesidade grau 2';
    return 'Obesidade grau 3';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Triagem</h2>
        <p className="text-gray-600 mb-6">
          Registre os dados da triagem para os pacientes aguardando atendimento
        </p>

        {/*lista pacientes aguardando triagem*/}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Pacientes Aguardando Triagem ({pacientesAguardando.length})
          </h3>

          {pacientesAguardando.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-4">Nenhum paciente aguardando triagem no momento</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
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
                <tbody className="bg-white divide-y divide-gray-200">
                  {pacientesAguardando.map((atendimento) => {
                    const tempoEspera = calcularTempoEspera(atendimento.dataHoraChegada);
                    
                    return (
                      <tr key={atendimento.atendimentoId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xl font-bold text-blue-600">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatarTempoEspera(tempoEspera)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => abrirModalTriagem(atendimento)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Registrar Triagem
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/*modal para registro da triagem*/}
      {modalAberto && atendimentoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                Triagem - Senha {String(atendimentoSelecionado.numeroSequencial).padStart(3, '0')}
              </h3>
              <p className="text-gray-600 mt-1">
                Paciente: {atendimentoSelecionado.nomePaciente}
              </p>
            </div>

            <form onSubmit={registrarTriagem} className="p-6 space-y-4">
              {/* Sintomas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sintomas <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="sintomas"
                  value={formData.sintomas}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descreva os sintomas apresentados pelo paciente..."
                  required
                />
              </div>

              {/*pressao arterial*/}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pressão Arterial <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pressaoArterial"
                  value={formData.pressaoArterial}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 120/80"
                  required
                />
              </div>

              {/*peso / altura*/}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="peso"
                    value={formData.peso}
                    onChange={handleInputChange}
                    step="0.01"
                    min="1"
                    max="500"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 75.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Altura (m) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="altura"
                    value={formData.altura}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0.3"
                    max="2.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 1.75"
                    required
                  />
                </div>
              </div>

              {/*calculo do imc*/}
              {formData.peso && formData.altura && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">IMC:</span> {calcularIMC()} - {getClassificacaoIMC(calcularIMC())}
                  </p>
                </div>
              )}

              {/*especialidade*/}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidade <span className="text-red-500">*</span>
                </label>
                <select
                  name="especialidadeId"
                  value={formData.especialidadeId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione a especialidade</option>
                  {especialidades.map((esp) => (
                    <option key={esp.id} value={esp.id}>
                      {esp.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/*observações*/}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Observações adicionais (opcional)..."
                />
              </div>

              {/*botoes*/}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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