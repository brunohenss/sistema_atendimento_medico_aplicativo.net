using System.Collections.Generic;
using System.Threading.Tasks;
using AtendimentoMedico.Core.Domain.Entities;

namespace AtendimentoMedico.Core.Domain.Interfaces;

public interface ITrigemRepository : IRepository<Triagem>
{
    Task<Triagem?> ObterPorAtendimentoAsync(int atendimentoId);

    Task<Triagem?> ObterCompletaAsync(int id);

    Task<IEnumerable<Triagem>> ObterPorEspecialidadeAsync(int especialidadeId);

    Task<bool> ExisteTriagemParaAtendimentoAsync(int atendimentoId);
    
    
}