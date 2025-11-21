using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AtendimentoMedico.Core.Application.DTOs;
using AtendimentoMedico.Core.Application.Interfaces;
using AtendimentoMedico.Core.Domain.Entities;
using AtendimentoMedico.Core.Domain.Interfaces;

namespace AtendimentoMedico.Core.Application.Services
{
    public class TriagemService : ITriagemService
    {
        private readonly ITriagemRepository _triagemRepository;
        private readonly IAtendimentoRepository _atendimentoRepository;
        private readonly IEspecialidadeRepository _especialidadeRepository;

        public TriagemService(
            ITriagemRepository triagemRepository,
            IAtendimentoRepository atendimentoRepository,
            IEspecialidadeRepository especialidadeRepository)
        {
            _triagemRepository = triagemRepository ?? throw new ArgumentNullException(nameof(triagemRepository));
            _atendimentoRepository = atendimentoRepository ?? throw new ArgumentNullException(nameof(atendimentoRepository));
            _especialidadeRepository = especialidadeRepository ?? throw new ArgumentNullException(nameof(especialidadeRepository));
        }

        public async Task<TriagemDto> RegistrarTriagemAsync(CriarTriagemDto dto)
        {
            var atendimento = await _atendimentoRepository.ObterPorIdAsync(dto.AtendimentoId);
            if (atendimento == null)
                throw new KeyNotFoundException("Atendimento não encontrado.");

            if (await _triagemRepository.ExisteTriagemParaAtendimentoAsync(dto.AtendimentoId))
                throw new InvalidOperationException("Já existe uma triagem registrada para este atendimento.");

            var especialidade = await _especialidadeRepository.ObterPorIdAsync(dto.EspecialidadeId);
            if (especialidade == null)
                throw new KeyNotFoundException("Especialidade não encontrada.");

            var triagem = new Triagem
            {
                AtendimentoId = dto.AtendimentoId,
                Sintomas = dto.Sintomas.Trim(),
                PressaoArterial = dto.PressaoArterial.Trim(),
                Peso = dto.Peso,
                Altura = dto.Altura,
                EspecialidadeId = dto.EspecialidadeId,
                Observacoes = dto.Observacoes?.Trim()
            };

            atendimento.IniciarTriagem();

            await _triagemRepository.AdicionarAsync(triagem);
            await _atendimentoRepository.AtualizarAsync(atendimento);
            await _triagemRepository.SalvarAlteracoesAsync();

            var triagemCompleta = await _triagemRepository.ObterCompletaAsync(triagem.Id);
            return MapearParaDto(triagemCompleta!);
        }

        public async Task<TriagemDto?> ObterPorIdAsync(int id)
        {
            var triagem = await _triagemRepository.ObterCompletaAsync(id);
            return triagem != null ? MapearParaDto(triagem) : null;
        }

        public async Task<TriagemDto?> ObterPorAtendimentoAsync(int atendimentoId)
        {
            var triagem = await _triagemRepository.ObterPorAtendimentoAsync(atendimentoId);
            return triagem != null ? MapearParaDto(triagem) : null;
        }

        public async Task<IEnumerable<TriagemDto>> ObterPorEspecialidadeAsync(int especialidadeId)
        {
            var triagens = await _triagemRepository.ObterPorEspecialidadeAsync(especialidadeId);
            return triagens.Select(MapearParaDto);
        }

        private TriagemDto MapearParaDto(Triagem triagem)
        {
            return new TriagemDto
            {
                Id = triagem.Id,
                AtendimentoId = triagem.AtendimentoId,
                Sintomas = triagem.Sintomas,
                PressaoArterial = triagem.PressaoArterial,
                Peso = triagem.Peso,
                Altura = triagem.Altura,
                IMC = triagem.CalcularIMC(),
                ClassificacaoIMC = triagem.ObterClassificacaoIMC(),
                EspecialidadeId = triagem.EspecialidadeId,
                NomeEspecialidade = triagem.Especialidade?.Nome ?? string.Empty,
                DataHoraTriagem = triagem.DataHoraTriagem,
                Observacoes = triagem.Observacoes
            };
        }
    }

    public class EspecialidadeService : IEspecialidadeService
    {
        private readonly IEspecialidadeRepository _especialidadeRepository;

        public EspecialidadeService(IEspecialidadeRepository especialidadeRepository)
        {
            _especialidadeRepository = especialidadeRepository ?? throw new ArgumentNullException(nameof(especialidadeRepository));
        }

        public async Task<EspecialidadeDto> CadastrarAsync(CriarEspecialidadeDto dto)
        {
            if (await _especialidadeRepository.NomeJaCadastradoAsync(dto.Nome))
            {
                throw new InvalidOperationException("Já existe uma especialidade com este nome.");
            }

            var especialidade = new Especialidade
            {
                Nome = dto.Nome.Trim(),
                Descricao = dto.Descricao?.Trim()
            };

            await _especialidadeRepository.AdicionarAsync(especialidade);
            await _especialidadeRepository.SalvarAlteracoesAsync();

            return MapearParaDto(especialidade);
        }

        public async Task<EspecialidadeDto?> ObterPorIdAsync(int id)
        {
            var especialidade = await _especialidadeRepository.ObterComTriagensAsync(id);
            return especialidade != null ? MapearParaDto(especialidade) : null;
        }

        public async Task<IEnumerable<EspecialidadeResumoDto>> ListarAtivasAsync()
        {
            var especialidades = await _especialidadeRepository.ObterAtivasAsync();
            
            return especialidades.Select(e => new EspecialidadeResumoDto
            {
                Id = e.Id,
                Nome = e.Nome
            });
        }

        public async Task<bool> DesativarAsync(int id)
        {
            var especialidade = await _especialidadeRepository.ObterPorIdAsync(id);
            
            if (especialidade == null)
                return false;

            especialidade.Desativar();
            await _especialidadeRepository.AtualizarAsync(especialidade);
            await _especialidadeRepository.SalvarAlteracoesAsync();

            return true;
        }

        private EspecialidadeDto MapearParaDto(Especialidade especialidade)
        {
            return new EspecialidadeDto
            {
                Id = especialidade.Id,
                Nome = especialidade.Nome,
                Descricao = especialidade.Descricao,
                Ativo = especialidade.Ativo,
                TotalTriagens = especialidade.Triagens?.Count ?? 0
            };
        }
    }
}