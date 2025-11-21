using Microsoft.AspNetCore.Mvc;
using AtendimentoMedico.Core.Application.DTOs;
using AtendimentoMedico.Core.Application.Interfaces;

namespace AtendimentoMedico.WebAPI.Controllers
{
    // Controller responsavel pelo gerenciamento de atendimentos e fila
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AtendimentosController : ControllerBase
    {
        private readonly IAtendimentoService _atendimentoService;
        private readonly ILogger<AtendimentosController> _logger;

        public AtendimentosController(
            IAtendimentoService atendimentoService,
            ILogger<AtendimentosController> logger)
        {
            _atendimentoService = atendimentoService;
            _logger = logger;
        }

        // cria um novo atendimento (gera senha para o paciente)
        [HttpPost]
        [ProducesResponseType(typeof(AtendimentoDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AtendimentoDto>> CriarAtendimento([FromBody] CriarAtendimentoDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var atendimento = await _atendimentoService.CriarAtendimentoAsync(dto);
                
                return CreatedAtAction(
                    nameof(ObterPorId),
                    new { id = atendimento.Id },
                    atendimento
                );
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { mensagem = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar atendimento");
                return StatusCode(500, new { mensagem = "Erro ao criar atendimento" });
            }
        }

        // busca um atendimento por id
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(AtendimentoDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AtendimentoDto>> ObterPorId(int id)
        {
            try
            {
                var atendimento = await _atendimentoService.ObterPorIdAsync(id);
                
                if (atendimento == null)
                    return NotFound(new { mensagem = "Atendimento não encontrado" });

                return Ok(atendimento);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar atendimento {Id}", id);
                return StatusCode(500, new { mensagem = "Erro ao buscar atendimento" });
            }
        }

        // lista a fila de atendimento completa
        [HttpGet("fila")]
        [ProducesResponseType(typeof(IEnumerable<FilaAtendimentoDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<FilaAtendimentoDto>>> ObterFila()
        {
            try
            {
                var fila = await _atendimentoService.ObterFilaAsync();
                return Ok(fila);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar fila de atendimento");
                return StatusCode(500, new { mensagem = "Erro ao buscar fila" });
            }
        }

        // chama o próximo paciente da fila
        [HttpPost("chamar-proximo")]
        [ProducesResponseType(typeof(AtendimentoDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AtendimentoDto>> ChamarProximo()
        {
            try
            {
                var atendimento = await _atendimentoService.ChamarProximoAsync();
                
                if (atendimento == null)
                    return NotFound(new { mensagem = "Não há pacientes aguardando na fila" });

                return Ok(atendimento);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao chamar próximo paciente");
                return StatusCode(500, new { mensagem = "Erro ao chamar próximo paciente" });
            }
        }

        /// finaliza um atendimento
        [HttpPatch("{id}/finalizar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> FinalizarAtendimento(int id)
        {
            try
            {
                var resultado = await _atendimentoService.FinalizarAtendimentoAsync(id);
                
                if (!resultado)
                    return NotFound(new { mensagem = "Atendimento não encontrado" });

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao finalizar atendimento {Id}", id);
                return StatusCode(500, new { mensagem = "Erro ao finalizar atendimento" });
            }
        }

        // lista atendimentos de um paciente especifico
        [HttpGet("paciente/{pacienteId}")]
        [ProducesResponseType(typeof(IEnumerable<AtendimentoDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<AtendimentoDto>>> ObterPorPaciente(int pacienteId)
        {
            try
            {
                var atendimentos = await _atendimentoService.ObterPorPacienteAsync(pacienteId);
                return Ok(atendimentos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar atendimentos do paciente {PacienteId}", pacienteId);
                return StatusCode(500, new { mensagem = "Erro ao buscar atendimentos" });
            }
        }

        // lista atendimentos por status
        [HttpGet("status/{status}")]
        [ProducesResponseType(typeof(IEnumerable<AtendimentoDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<IEnumerable<AtendimentoDto>>> ObterPorStatus(string status)
        {
            try
            {
                var atendimentos = await _atendimentoService.ObterPorStatusAsync(status);
                return Ok(atendimentos);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar atendimentos por status");
                return StatusCode(500, new { mensagem = "Erro ao buscar atendimentos" });
            }
        }

        // obtem estatisticas de atendimento do dia
        //[HttpGet("estatisticas")]
        //[ProducesResponseType(typeof(EstatisticasAtendimentoDto), StatusCodes.Status200OK)]
        //public async Task<ActionResult<EstatisticasAtendimentoDto>> ObterEstatisticas([FromQuery] DateTime? data = null)
        //{
        //    try
        //    {
        //        var estatisticas = await _atendimentoService.ObterEstatisticasAsync(data);
        //        return Ok(estatisticas);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Erro ao buscar estatísticas");
        //        return StatusCode(500, new { mensagem = "Erro ao buscar estatísticas" });
        //    }
        //}
    }
}