using Microsoft.AspNetCore.Mvc;
using AtendimentoMedico.Core.Application.DTOs;
using AtendimentoMedico.Core.Application.Interfaces;

namespace AtendimentoMedico.WebAPI.Controllers
{
    // controller responsavel pelo gerenciamento de pacientes
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class PacientesController : ControllerBase
    {
        private readonly IPacienteService _pacienteService;
        private readonly ILogger<PacientesController> _logger;

        public PacientesController(
            IPacienteService pacienteService,
            ILogger<PacientesController> logger)
        {
            _pacienteService = pacienteService;
            _logger = logger;
        }

        // lista todos os pacientes ativos
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<PacienteDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<PacienteDto>>> ObterTodos()
        {
            try
            {
                var pacientes = await _pacienteService.ListarAtivosAsync();
                return Ok(pacientes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar pacientes");
                return StatusCode(500, new { mensagem = "Erro ao buscar pacientes" });
            }
        }

        // busca um paciente por Iid
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(PacienteDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PacienteDto>> ObterPorId(int id)
        {
            try
            {
                var paciente = await _pacienteService.ObterPorIdAsync(id);
                
                if (paciente == null)
                    return NotFound(new { mensagem = "Paciente não encontrado" });

                return Ok(paciente);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar paciente {Id}", id);
                return StatusCode(500, new { mensagem = "Erro ao buscar paciente" });
            }
        }

        // busca pacientes por nome
        [HttpGet("buscar")]
        [ProducesResponseType(typeof(IEnumerable<PacienteResumoDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<IEnumerable<PacienteResumoDto>>> BuscarPorNome([FromQuery] string nome)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(nome) || nome.Length < 3)
                    return BadRequest(new { mensagem = "O nome deve ter no mínimo 3 caracteres" });

                var pacientes = await _pacienteService.BuscarPorNomeAsync(nome);
                return Ok(pacientes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar pacientes por nome");
                return StatusCode(500, new { mensagem = "Erro ao buscar pacientes" });
            }
        }

        // busca paciente com historico de atendimentos
        [HttpGet("{id}/historico")]
        [ProducesResponseType(typeof(PacienteDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PacienteDto>> ObterComHistorico(int id)
        {
            try
            {
                var paciente = await _pacienteService.ObterComHistoricoAsync(id);
                
                if (paciente == null)
                    return NotFound(new { mensagem = "Paciente não encontrado" });

                return Ok(paciente);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar histórico do paciente {Id}", id);
                return StatusCode(500, new { mensagem = "Erro ao buscar histórico" });
            }
        }

        // cadastra um novo paciente
        [HttpPost]
        [ProducesResponseType(typeof(PacienteDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<PacienteDto>> Cadastrar([FromBody] CriarPacienteDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var paciente = await _pacienteService.CadastrarAsync(dto);
                
                return CreatedAtAction(
                    nameof(ObterPorId),
                    new { id = paciente.Id },
                    paciente
                );
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao cadastrar paciente");
                return StatusCode(500, new { mensagem = "Erro ao cadastrar paciente" });
            }
        }

        // atualiza os dados de um paciente
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(PacienteDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PacienteDto>> Atualizar(int id, [FromBody] AtualizarPacienteDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var paciente = await _pacienteService.AtualizarAsync(id, dto);
                return Ok(paciente);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { mensagem = "Paciente não encontrado" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar paciente {Id}", id);
                return StatusCode(500, new { mensagem = "Erro ao atualizar paciente" });
            }
        }

        // desativa um paciente (soft deletes)
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> Desativar(int id)
        {
            try
            {
                var resultado = await _pacienteService.DesativarAsync(id);
                
                if (!resultado)
                    return NotFound(new { mensagem = "Paciente não encontrado" });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao desativar paciente {Id}", id);
                return StatusCode(500, new { mensagem = "Erro ao desativar paciente" });
            }
        }

        // reativa um paciente
        [HttpPatch("{id}/reativar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> Reativar(int id)
        {
            try
            {
                var resultado = await _pacienteService.ReativarAsync(id);
                
                if (!resultado)
                    return NotFound(new { mensagem = "Paciente não encontrado" });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao reativar paciente {Id}", id);
                return StatusCode(500, new { mensagem = "Erro ao reativar paciente" });
            }
        }
    }
}