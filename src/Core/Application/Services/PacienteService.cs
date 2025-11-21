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
    //implementação do serviço de pacientes
    //regras de negócio relacionadas a pacientes
    public class PacienteService : IPacienteService
    {
        private readonly IPacienteRepository _pacienteRepository;

        public PacienteService(IPacienteRepository pacienteRepository)
        {
            _pacienteRepository = pacienteRepository ?? throw new ArgumentNullException(nameof(pacienteRepository));
        }

        public async Task<PacienteDto> CadastrarAsync(CriarPacienteDto dto)
        {
            if (await _pacienteRepository.EmailJaCadastradoAsync(dto.Email))
            {
                throw new InvalidOperationException("Já existe um paciente cadastrado com este e-mail.");
            }

            var paciente = new Paciente
            {
                Nome = dto.Nome.Trim(),
                Telefone = dto.Telefone.Trim(),
                Sexo = dto.Sexo.ToUpper(),
                Email = dto.Email.Trim().ToLower()
            };

            await _pacienteRepository.AdicionarAsync(paciente);
            await _pacienteRepository.SalvarAlteracoesAsync();

            return MapearParaDto(paciente);
        }

        public async Task<PacienteDto> AtualizarAsync(int id, AtualizarPacienteDto dto)
        {
            var paciente = await _pacienteRepository.ObterPorIdAsync(id);
            
            if (paciente == null)
                throw new KeyNotFoundException("Paciente não encontrado.");

            if (await _pacienteRepository.EmailJaCadastradoAsync(dto.Email, id))
            {
                throw new InvalidOperationException("Este e-mail já está cadastrado para outro paciente.");
            }

            paciente.AtualizarDados(
                dto.Nome.Trim(),
                dto.Telefone.Trim(),
                dto.Sexo.ToUpper(),
                dto.Email.Trim().ToLower()
            );

            await _pacienteRepository.AtualizarAsync(paciente);
            await _pacienteRepository.SalvarAlteracoesAsync();

            return MapearParaDto(paciente);
        }

        public async Task<PacienteDto?> ObterPorIdAsync(int id)
        {
            var paciente = await _pacienteRepository.ObterPorIdAsync(id);
            return paciente != null ? MapearParaDto(paciente) : null;
        }

        public async Task<IEnumerable<PacienteDto>> ListarAtivosAsync()
        {
            var pacientes = await _pacienteRepository.ObterAtivosAsync();
            return pacientes.Select(MapearParaDto);
        }

        public async Task<IEnumerable<PacienteResumoDto>> BuscarPorNomeAsync(string nome)
        {
            if (string.IsNullOrWhiteSpace(nome) || nome.Length < 3)
            {
                throw new ArgumentException("O nome deve ter no mínimo 3 caracteres.");
            }

            var pacientes = await _pacienteRepository.BuscarPorNomeAsync(nome.Trim());
            
            return pacientes.Select(p => new PacienteResumoDto
            {
                Id = p.Id,
                Nome = p.Nome,
                Telefone = p.Telefone,
                Email = p.Email
            });
        }

        public async Task<bool> DesativarAsync(int id)
        {
            var paciente = await _pacienteRepository.ObterPorIdAsync(id);
            
            if (paciente == null)
                return false;

            paciente.Desativar();
            await _pacienteRepository.AtualizarAsync(paciente);
            await _pacienteRepository.SalvarAlteracoesAsync();

            return true;
        }

        public async Task<bool> ReativarAsync(int id)
        {
            var paciente = await _pacienteRepository.ObterPorIdAsync(id);
            
            if (paciente == null)
                return false;

            paciente.Reativar();
            await _pacienteRepository.AtualizarAsync(paciente);
            await _pacienteRepository.SalvarAlteracoesAsync();

            return true;
        }

        public async Task<PacienteDto?> ObterComHistoricoAsync(int id)
        {
            var paciente = await _pacienteRepository.ObterComAtendimentosAsync(id);
            return paciente != null ? MapearParaDto(paciente) : null;
        }

        // mapeia a entidade Paciente para dto
        private PacienteDto MapearParaDto(Paciente paciente)
        {
            return new PacienteDto
            {
                Id = paciente.Id,
                Nome = paciente.Nome,
                Telefone = paciente.Telefone,
                Sexo = paciente.Sexo,
                Email = paciente.Email,
                Ativo = paciente.Ativo,
                DataCriacao = paciente.DataCriacao,
                TotalAtendimentos = paciente.Atendimentos?.Count ?? 0
            };
        }
    }
}