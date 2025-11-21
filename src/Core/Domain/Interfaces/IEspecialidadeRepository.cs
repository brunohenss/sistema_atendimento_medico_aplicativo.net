using System.Collections.Generic;
using System.Threading.Tasks;
using AtendimentoMedico.Core.Domain.Entities;

namespace AtendimentoMedico.Core.Domain.Interfaces;

public interface IEspecialidadeRepository : IRepository<Especialidade>
{
    Task<IEnumerable<Especialidade>> ObterAtivasAsync();

    Task<Especialidade?> ObterPorNomeAsync(string nome);

    Task<Especialidade?> ObterComTriagensAsync(int id);

    Task<bool> NomeJaCadastradoAsync(string nome, int? especialidadeIdExcluir = null);
}