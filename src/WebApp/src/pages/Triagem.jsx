import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { formatarTempoEspera, calcularTempoEspera } from '../utils/dateUtils';

const Triagem = () => {
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
    const interval = setInterval(carregarDados, 30000);
    return () => clearInterval(interval);
  }, []);

  const carregarDados = async () => {
    try {
      const [especialidadesRes, filaRes] = await Promise.all([
        api.get('/especialidades'),
        api.get('/atendimentos/fila')
      ]);

      setEspecialidades(especialidadesRes.data);
      
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
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calcularIMC = () => {
    const peso = parseFloat(formData.peso);
    const altura = parseFloat(formData.altura);
    if (peso > 0 && altura > 0) {
      return (peso / (altura * altura)).toFixed(2);
    }
    return null;
  };

  const getClassificacaoIMC = (imc) => {
    if (!imc) return '';
    if (imc < 18.5) return { texto: 'Abaixo do peso', cor: 'text-amber-600' };
    if (imc < 25) return { texto: 'Peso normal', cor: 'text-emerald-600' };
    if (imc < 30) return { texto: 'Sobrepeso', cor: 'text-orange-600' };
    if (imc < 35) return { texto: 'Obesidade grau 1', cor: 'text-red-500' };
    if (imc < 40) return { texto: 'Obesidade grau 2', cor: 'text-red-600' };
    return { texto: 'Obesidade grau 3', cor: 'text-red-700' };
  };

  const registrarTriagem = async (e) => {
    e.preventDefault();

    if (!formData.sintomas || formData.sintomas.trim().length < 5) {
      toast.error('Descreva os sintomas (mínimo 5 caracteres)');
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
      toast.error(error.response?.data?.mensagem || 'Erro ao registrar triagem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-2xl">🩺</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Triagem</h1>
              <p className="text-sm text-gray-500">Registre os dados vitais e encaminhe para especialidade</p>
            </div>
          </div>
        </div>

        {/* Card de Pacientes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Pacientes Aguardando Triagem</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {pacientesAguardando.length} {pacientesAguardando.length === 1 ? 'paciente aguardando' : 'pacientes aguardando'}
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">Atualização automática</span>
              </div>
            </div>
          </div>

          {pacientesAguardando.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">✅</span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-700">Tudo em dia!</p>
                  <p className="text-sm text-gray-500 mt-1">Nenhum paciente aguardando triagem no momento</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Senha</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Paciente</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Telefone</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tempo Espera</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {pacientesAguardando.map((atendimento) => {
                    const tempoEspera = calcularTempoEspera(atendimento.dataHoraChegada);
                    
                    return (
                      <tr key={atendimento.atendimentoId} className="hover:bg-blue-50/30 transition-colors duration-150">
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
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full">
                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-amber-700">{formatarTempoEspera(tempoEspera)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => abrirModalTriagem(atendimento)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
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

      {/*modal*/}
      {modalAberto && atendimentoSelecionado && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            {/*header do modal*/}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📋</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Triagem - Senha {String(atendimentoSelecionado.numeroSequencial).padStart(3, '0')}
                    </h3>
                    <p className="text-blue-100 text-sm mt-0.5">{atendimentoSelecionado.nomePaciente}</p>
                  </div>
                </div>
                <button
                  onClick={fecharModal}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/*formulario*/}
            <form onSubmit={registrarTriagem} className="p-6 space-y-5">
              {/*sintomas*/}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sintomas <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="sintomas"
                  value={formData.sintomas}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Descreva os sintomas apresentados pelo paciente..."
                  required
                />
              </div>

              {/*pressao arterial*/}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pressão Arterial <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pressaoArterial"
                  value={formData.pressaoArterial}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Ex: 120/80"
                  required
                />
              </div>

              {/*peso e altura*/}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Ex: 75.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Ex: 1.75"
                    required
                  />
                </div>
              </div>

              {/*imc*/}
              {formData.peso && formData.altura && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Índice de Massa Corporal (IMC)</p>
                      <p className="text-lg font-bold text-blue-700 mt-0.5">
                        {calcularIMC()} - <span className={getClassificacaoIMC(calcularIMC()).cor}>
                          {getClassificacaoIMC(calcularIMC()).texto}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/*especialidade*/}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Especialidade <span className="text-red-500">*</span>
                </label>
                <select
                  name="especialidadeId"
                  value={formData.especialidadeId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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

              {/*obervações*/}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Observações adicionais (opcional)..."
                />
              </div>

              {/*botoes*/}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={loading}
                  className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {loading ? 'Registrando...' : 'Registrar Triagem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Triagem;