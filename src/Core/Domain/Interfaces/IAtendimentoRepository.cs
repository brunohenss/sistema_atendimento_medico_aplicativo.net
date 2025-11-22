using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AtendimentoMedico.Core.Domain.Entities;

namespace AtendimentoMedico.Core.Domain.Interfaces;

public interface IAtendimentoRepository : IRepository<Atendimento>
{
    Task<int> GerarProximoNumeroSequencialAsync(DateTime? data = null);

    Task<IEnumerable<Atendimento>> ObterFilaAtendimentoAsync();

    Task<Atendimento?> ObterProximoAguardandoAsync();

    Task<IEnumerable<Atendimento>> ObterPorStatusAsync(string status);

    Task<IEnumerable<Atendimento>> ObterPorPacienteAsync(int pacienteID);

    Task<Atendimento?> ObterCompletoAsync(int id);

    Task<IEnumerable<Atendimento>> ObterAtendimentosDoDiaAsync(DateTime? data = null);

    Task<bool> PacientePossuiAtendimentoAtivoAsync(int pacienteId);
}