using System.Collections.Generic;
using System.Threading.Tasks;
using AtendimentoMedico.Core.Domain.Entities;

namespace AtendimentoMedico.Core.Domain.Interfaces;

public interface IPacienteRepository : IRepository<Paciente>
{
    Task<IEnumerable<Paciente>> ObterAtivosAsync();

    Task<Paciente?> ObterPorEmailAsync(string email);

    //busca parcial
    Task<IEnumerable<Paciente>> BuscarPorNomeAsync(string nome);

    // busca paciente carregando seus atendimentos
    Task<Paciente?> ObterComAtendimentosAsync(int id);

    Task<bool> EmailJaCadastradoAsync(string email, int? pacienteIdExcluir = null);
}