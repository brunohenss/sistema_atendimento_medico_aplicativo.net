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
    public class AtendimentoService : IAtendimentoService
    {
        private readonly IAtendimentoRepository _atendimentoRepository;
        private readonly IPacienteRepository _pacienteRepository;

        public AtendimentoService(
            IAtendimentoRepository atendimentoRepository,
            IPacienteRepository pacienteRepository)
        {
            _atendimentoRepository = atendimentoRepository ?? throw new ArgumentNullException(nameof(atendimentoRepository));
            _pacienteRepository = pacienteRepository ?? throw new ArgumentNullException(nameof(pacienteRepository));
        }

        public async Task<AtendimentoDto> CriarAtendimentoAsync(CriarAtendimentoDto dto)
        {
            var paciente = await _pacienteRepository.ObterPorIdAsync(dto.PacienteId);
            if (paciente == null)
                throw new KeyNotFoundException("Paciente não encontrado.");

            if (!paciente.Ativo)
                throw new InvalidOperationException("O paciente está inativo no sistema.");

            var possuiAtendimentoAtivo = await _atendimentoRepository
                .PacientePossuiAtendimentoAtivoAsync(dto.PacienteId);
                
            if (possuiAtendimentoAtivo)
            {
                throw new InvalidOperationException(
                    "Este paciente já possui um atendimento em andamento" +
                    "Finalize o atendimento anterior antes de gerar uma nova senha");
            }

            var numeroSequencial = await _atendimentoRepository.GerarProximoNumeroSequencialAsync();

            var atendimento = new Atendimento
            {
                NumeroSequencial = numeroSequencial,
                PacienteId = dto.PacienteId,
                Status = StatusAtendimento.Aguardando
            };

            await _atendimentoRepository.AdicionarAsync(atendimento);
            await _atendimentoRepository.SalvarAlteracoesAsync();

            var atendimentoCompleto = await _atendimentoRepository.ObterCompletoAsync(atendimento.Id);
            return MapearParaDto(atendimentoCompleto!);
        }

        public async Task<AtendimentoDto?> ObterPorIdAsync(int id)
        {
            var atendimento = await _atendimentoRepository.ObterCompletoAsync(id);
            return atendimento != null ? MapearParaDto(atendimento) : null;
        }

        public async Task<IEnumerable<FilaAtendimentoDto>> ObterFilaAsync()
        {
            var atendimentos = await _atendimentoRepository.ObterFilaAtendimentoAsync();
            
            return atendimentos.Select(a => new FilaAtendimentoDto
            {
                AtendimentoId = a.Id,
                NumeroSequencial = a.NumeroSequencial,
                NomePaciente = a.Paciente.Nome,
                Telefone = a.Paciente.Telefone,
                Status = a.Status,
                Especialidade = a.Triagem?.Especialidade?.Nome,
                DataHoraChegada = a.DataHoraChegada,
                TempoEsperaMinutos = a.CalcularTempoEspera(),
                PossuiTriagem = a.Triagem != null
            });
        }

        public async Task<AtendimentoDto?> ChamarProximoAsync()
        {
            var proximoAtendimento = await _atendimentoRepository.ObterProximoAguardandoAsync();
            
            if (proximoAtendimento == null)
                return null;

            proximoAtendimento.ChamarPaciente();
            
            await _atendimentoRepository.AtualizarAsync(proximoAtendimento);
            await _atendimentoRepository.SalvarAlteracoesAsync();

            return MapearParaDto(proximoAtendimento);
        }

        public async Task<bool> FinalizarAtendimentoAsync(int id)
        {
            var atendimento = await _atendimentoRepository.ObterPorIdAsync(id);
            
            if (atendimento == null)
                return false;

            atendimento.FinalizarAtendimento();
            
            await _atendimentoRepository.AtualizarAsync(atendimento);
            await _atendimentoRepository.SalvarAlteracoesAsync();

            return true;
        }

        public async Task<IEnumerable<AtendimentoDto>> ObterPorPacienteAsync(int pacienteId)
        {
            var atendimentos = await _atendimentoRepository.ObterPorPacienteAsync(pacienteId);
            return atendimentos.Select(MapearParaDto);
        }

        public async Task<IEnumerable<AtendimentoDto>> ObterPorStatusAsync(string status)
        {
            if (!StatusAtendimento.IsValido(status))
                throw new ArgumentException("Status inválido.");

            var atendimentos = await _atendimentoRepository.ObterPorStatusAsync(status);
            return atendimentos.Select(MapearParaDto);
        }

        private AtendimentoDto MapearParaDto(Atendimento atendimento)
        {
            return new AtendimentoDto
            {
                Id = atendimento.Id,
                NumeroSequencial = atendimento.NumeroSequencial,
                PacienteId = atendimento.PacienteId,
                NomePaciente = atendimento.Paciente?.Nome ?? string.Empty,
                TelefonePaciente = atendimento.Paciente?.Telefone ?? string.Empty,
                DataHoraChegada = atendimento.DataHoraChegada,
                Status = atendimento.Status,
                DataHoraChamada = atendimento.DataHoraChamada,
                DataHoraFinalizacao = atendimento.DataHoraFinalizacao,
                TempoEsperaMinutos = atendimento.CalcularTempoEspera(),
                Triagem = atendimento.Triagem != null ? MapearTriagemResumo(atendimento.Triagem) : null
            };
        }

        private TriagemResumoDto MapearTriagemResumo(Triagem triagem)
        {
            return new TriagemResumoDto
            {
                Id = triagem.Id,
                Sintomas = triagem.Sintomas,
                PressaoArterial = triagem.PressaoArterial,
                Peso = triagem.Peso,
                Altura = triagem.Altura,
                IMC = triagem.CalcularIMC(),
                Especialidade = triagem.Especialidade?.Nome ?? string.Empty
            };
        }
    }
}