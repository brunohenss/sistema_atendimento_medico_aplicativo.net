using System.Collections.Generic;
using System.Threading.Tasks;
using AtendimentoMedico.Core.Application.DTOs;

namespace AtendimentoMedico.Core.Application.Interfaces;

public interface IPacienteService
{
    Task<PacienteDto> CadastrarAsync(CriarPacienteDto dto);

    Task<PacienteDto> AtualizarAsync(int id, AtualizarPacienteDto dto);

    Task<PacienteDto?> ObterPorIdAsync(int id);

    Task<IEnumerable<PacienteDto>> ListarAtivosAsync();

    Task<IEnumerable<PacienteResumoDto>> BuscarPorNomeAsync(string nome);

    Task<bool> DesativarAsync(int id);

    Task<bool> ReativarAsync(int id);

    Task<PacienteDto?> ObterComHistoricoAsync(int id);
}