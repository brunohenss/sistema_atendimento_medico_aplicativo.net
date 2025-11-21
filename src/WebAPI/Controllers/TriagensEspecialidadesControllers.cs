using Microsoft.AspNetCore.Mvc;
using AtendimentoMedico.Core.Application.DTOs;
using AtendimentoMedico.Core.Application.Interfaces;

namespace AtendimentoMedico.WebAPI.Controllers
{
    // controller responsavel pelo gerenciamento de triagens
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class TriagensController : ControllerBase
    {
        private readonly ITriagemService _triagemService;
        private readonly ILogger<TriagensController> _logger;

        public TriagensController(
            ITriagemService triagemService,
            ILogger<TriagensController> logger)
        {
            _triagemService = triagemService;
            _logger = logger;
        }

        // registra uma nova triagem
        [HttpPost]
        [ProducesResponseType(typeof(TriagemDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<TriagemDto>> RegistrarTriagem([FromBody] CriarTriagemDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var triagem = await _triagemService.RegistrarTriagemAsync(dto);
                
                return CreatedAtAction(
                    nameof(ObterPorId),
                    new { id = triagem.Id },
                    triagem
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
                _logger.LogError(ex, "Erro ao registrar triagem");
                return StatusCode(500, new { mensagem = "Erro ao registrar triagem" });
            }
        }

        // busca uma triagem por id
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(TriagemDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<TriagemDto>> ObterPorId(int id)
        {
            try
            {
                var triagem = await _triagemService.ObterPorIdAsync(id);
                
                if (triagem == null)
                    return NotFound(new { mensagem = "Triagem não encontrada" });

                return Ok(triagem);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar triagem {Id}", id);
                return StatusCode(500, new { mensagem = "Erro ao buscar triagem" });
            }
        }

        // busca a triagem de um atendimento
        [HttpGet("atendimento/{atendimentoId}")]
        [ProducesResponseType(typeof(TriagemDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<TriagemDto>> ObterPorAtendimento(int atendimentoId)
        {
            try
            {
                var triagem = await _triagemService.ObterPorAtendimentoAsync(atendimentoId);
                
                if (triagem == null)
                    return NotFound(new { mensagem = "Triagem não encontrada para este atendimento" });

                return Ok(triagem);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar triagem do atendimento {AtendimentoId}", atendimentoId);
                return StatusCode(500, new { mensagem = "Erro ao buscar triagem" });
            }
        }

        // lista triagens por especialidade
        [HttpGet("especialidade/{especialidadeId}")]
        [ProducesResponseType(typeof(IEnumerable<TriagemDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<TriagemDto>>> ObterPorEspecialidade(int especialidadeId)
        {
            try
            {
                var triagens = await _triagemService.ObterPorEspecialidadeAsync(especialidadeId);
                return Ok(triagens);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar triagens da especialidade {EspecialidadeId}", especialidadeId);
                return StatusCode(500, new { mensagem = "Erro ao buscar triagens" });
            }
        }
    }

    // controller responsavel pelo gerenciamento de especialidades
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class EspecialidadesController : ControllerBase
    {
        private readonly IEspecialidadeService _especialidadeService;
        private readonly ILogger<EspecialidadesController> _logger;

        public EspecialidadesController(
            IEspecialidadeService especialidadeService,
            ILogger<EspecialidadesController> logger)
        {
            _especialidadeService = especialidadeService;
            _logger = logger;
        }

        // lista todas as especialidades ativas
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<EspecialidadeResumoDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<EspecialidadeResumoDto>>> ListarAtivas()
        {
            try
            {
                var especialidades = await _especialidadeService.ListarAtivasAsync();
                return Ok(especialidades);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar especialidades");
                return StatusCode(500, new { mensagem = "Erro ao buscar especialidades" });
            }
        }

        // busca uma especialidade por id
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(EspecialidadeDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<EspecialidadeDto>> ObterPorId(int id)
        {
            try
            {
                var especialidade = await _especialidadeService.ObterPorIdAsync(id);
                
                if (especialidade == null)
                    return NotFound(new { mensagem = "Especialidade não encontrada" });

                return Ok(especialidade);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar especialidade {Id}", id);
                return StatusCode(500, new { mensagem = "Erro ao buscar especialidade" });
            }
        }

        // cadastra uma nova especialidade
        [HttpPost]
        [ProducesResponseType(typeof(EspecialidadeDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<EspecialidadeDto>> Cadastrar([FromBody] CriarEspecialidadeDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var especialidade = await _especialidadeService.CadastrarAsync(dto);
                
                return CreatedAtAction(
                    nameof(ObterPorId),
                    new { id = especialidade.Id },
                    especialidade
                );
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { mensagem = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao cadastrar especialidade");
                return StatusCode(500, new { mensagem = "Erro ao cadastrar especialidade" });
            }
        }

        // desativa uma especialidade
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> Desativar(int id)
        {
            try
            {
                var resultado = await _especialidadeService.DesativarAsync(id);
                
                if (!resultado)
                    return NotFound(new { mensagem = "Especialidade não encontrada" });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao desativar especialidade {Id}", id);
                return StatusCode(500, new { mensagem = "Erro ao desativar especialidade" });
            }
        }
    }
}