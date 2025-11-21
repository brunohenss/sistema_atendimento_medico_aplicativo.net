using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AtendimentoMedico.Core.Application.DTOs;

namespace AtendimentoMedico.Core.Application.Interfaces
{
    public interface IAtendimentoService
    {
        Task<AtendimentoDto> CriarAtendimentoAsync(CriarAtendimentoDto dto);

        Task<AtendimentoDto?> ObterPorIdAsync(int id);

        Task<IEnumerable<FilaAtendimentoDto>> ObterFilaAsync();

        Task<AtendimentoDto?> ChamarProximoAsync();

        Task<bool> FinalizarAtendimentoAsync(int id);

        Task<IEnumerable<AtendimentoDto>> ObterPorPacienteAsync(int pacienteId);

        Task<IEnumerable<AtendimentoDto>> ObterPorStatusAsync(string status);
    }

    public interface ITriagemService
    {
        Task<TriagemDto> RegistrarTriagemAsync(CriarTriagemDto dto);

        Task<TriagemDto?> ObterPorIdAsync(int id);

        Task<TriagemDto?> ObterPorAtendimentoAsync(int atendimentoId);

        Task<IEnumerable<TriagemDto>> ObterPorEspecialidadeAsync(int especialidadeId);
    }

    public interface IEspecialidadeService
    {
        Task<EspecialidadeDto> CadastrarAsync(CriarEspecialidadeDto dto);

        Task<EspecialidadeDto?> ObterPorIdAsync(int id);

        Task<IEnumerable<EspecialidadeResumoDto>> ListarAtivasAsync();

        Task<bool> DesativarAsync(int id);
    }
}