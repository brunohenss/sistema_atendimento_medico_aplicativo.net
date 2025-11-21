using System.Collections.Generic;
using System.Threading.Tasks;
using AtendimentoMedico.Core.Domain.Entities;

namespace AtendimentoMedico.Core.Domain.Interfaces;

public interface ITriagemRepository : IRepository<Triagem>
{
    Task<Triagem?> ObterPorAtendimentoAsync(int atendimentoId);

    Task<Triagem?> ObterCompletaAsync(int id);

    Task<IEnumerable<Triagem>> ObterPorEspecialidadeAsync(int especialidadeId);

    Task<bool> ExisteTriagemParaAtendimentoAsync(int atendimentoId);
}

public interface IEspecialidadeRepository : IRepository<Especialidade>
{
    Task<IEnumerable<Especialidade>> ObterAtivasAsync();

    Task<Especialidade?> ObterPorNomeAsync(string nome);

    Task<Especialidade?> ObterComTriagensAsync(int id);

    Task<bool> NomeJaCadastradoAsync(string nome, int? especialidadeIdExcluir = null);
}
