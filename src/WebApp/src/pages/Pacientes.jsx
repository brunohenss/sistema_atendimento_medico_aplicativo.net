import React, { useState, useEffect } from 'react';
import { pacientesAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

const Pacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busca, setBusca] = useState('');
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    sexo: '',
    email: '',
  });

  useEffect(() => {
    carregarPacientes();
  }, []);

  const carregarPacientes = async () => {
    setLoading(true);
    try {
      const response = await pacientesAPI.listar();
      setPacientes(response.data);
    } catch (error) {
      showError('Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await pacientesAPI.atualizar(editingId, formData);
        showSuccess('Paciente atualizado com sucesso!');
      } else {
        await pacientesAPI.cadastrar(formData);
        showSuccess('Paciente cadastrado com sucesso!');
      }
      handleCloseModal();
      carregarPacientes();
    } catch (error) {
      showError(error.mensagem || 'Erro ao salvar paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (paciente) => {
    setEditingId(paciente.id);
    setFormData({
      nome: paciente.nome,
      telefone: paciente.telefone,
      sexo: paciente.sexo,
      email: paciente.email,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente desativar este paciente?')) return;

    setLoading(true);
    try {
      await pacientesAPI.desativar(id);
      showSuccess('Paciente desativado com sucesso!');
      carregarPacientes();
    } catch (error) {
      showError('Erro ao desativar paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      nome: '',
      telefone: '',
      sexo: '',
      email: '',
    });
  };

  const pacientesFiltrados = pacientes.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Pacientes</h2>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Novo Paciente
          </button>
        </div>

        {/* Busca */}
        <input
          type="text"
          placeholder="Buscar paciente por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Lista de pacientes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum paciente encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sexo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Atendimentos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pacientesFiltrados.map((paciente) => (
                  <tr key={paciente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {paciente.nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {paciente.telefone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {paciente.sexo === 'M' ? 'Masculino' : 'Feminino'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{paciente.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {paciente.totalAtendimentos}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleEdit(paciente)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(paciente.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Desativar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de cadastro/edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? 'Editar Paciente' : 'Novo Paciente'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(19) 99999-9999"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sexo *
                </label>
                <select
                  required
                  value={formData.sexo}
                  onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pacientes;