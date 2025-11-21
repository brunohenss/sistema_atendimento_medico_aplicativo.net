using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AtendimentoMedico.Core.Application.DTOs;
using AtendimentoMedico.Core.Domain.Entities;
using AtendimentoMedico.Core.Domain.Interfaces;
using AtendimentoMedico.Infrastructure.Persistence.Context;
using AtendimentoMedico.Infrastructure.Persistence.Repositories;

namespace AtendimentoMedico.Infrastructure.Persistence.Repositories;

public class AtendimentoRepository : Repository<Atendimento>
{
    public AtendimentoRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<int> GerarProximoNumeroSequencialAsync(DateTime? data = null)
    {
        var dataReferencia = data ?? DateTime.Today;

        var ultimoNumero = await _dbSet
        .Where(a => a.DataHoraChegada.Date == dataReferencia.Date)
        .OrderByDescending(a => a.NumeroSequencial)
        .Select(a => a.NumeroSequencial)
        .FirstOrDefaultAsync();

        return ultimoNumero + 1;
    }

    public async Task<IEnumerable<Atendimento>> ObterFilaAtendimentoAsync()
    {
        return await _dbSet
        .Include(a => a.Paciente)
        .Include(a => a.Triagem)
           .ThenInclude(t => t!.Especialidade)
        .Where(a => a.Status == StatusAtendimento.Aguardando ||
                    a.Status == StatusAtendimento.EmTriagem ||
                    a.Status == StatusAtendimento.EmAtendimento)
        .OrderBy(a => a.DataHoraChegada)
        .ToListAsync();
    }

    public async Task<Atendimento?> ObterProximoAtendimentoAsync()
    {
        return await _dbSet
        .Include(a => a.Paciente)
        .Include(a => a.Triagem)
           .ThenInclude(t => t!.Especialidade)
        .Where(a => a.Status == StatusAtendimento.Aguardando)
        .OrderBy(a => a.DataHoraChegada)
        .FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<Atendimento>> ObterPorStatusAsync(string status)
    {
        return await _dbSet
        .Include(a => a.Paciente)
        .Include(a => a.Triagem)
           .ThenInclude(t => t!.Especialidade)
        .Where(a => a.Status == status)
        .OrderBy(a => a.DataHoraChegada)
        .ToListAsync();
    }

    public async Task<IEnumerable<Atendimento>> ObterPorPacienteAsync(int pacienteId)
    {
        return await _dbSet
        .Include(a => a.Triagem)
           .ThenInclude(t => t!.Especialidade)
        .Where(a => a.PacienteId == pacienteId)
        .OrderByDescending(a => a.DataHoraChegada)
        .ToListAsync();
    }

    public async Task<Atendimento?> ObterCompletoAsync(int id)
    {
        return await _dbSet
        .Include(a => a.Paciente)
        .Include(a => a.Triagem)
           .ThenInclude(t => t!.Especialidade)
        .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<EstatisticasAtendimentoDto> ObterEstatisticasAsync(DateTime? data = null)
    {
        var dataReferencia = data ?? DateTime.Today;

        var atendimentos = await _dbSet
            .Where(a => a.DataHoraChegada.Date == dataReferencia.Date)
            .ToListAsync();

        if (!atendimentos.Any())
        {
            return new EstatisticasAtendimentoDto
            {
                DataReferencia = dataReferencia
            };
        }

        var temposEspera = atendimentos
            .Where(a => a.DataHoraChamada.HasValue)
            .Select(a => (a.DataHoraChamada!.Value - a.DataHoraChegada).TotalMinutes)
            .ToList();

        return new EstatisticasAtendimentoDto
        {
            TotalAtendimentos = atendimentos.Count,
            Aguardando = atendimentos.Count(a => a.Status == StatusAtendimento.Aguardando),
            EmTriagem = atendimentos.Count(a => a.Status == StatusAtendimento.EmTriagem),
            EmAtendimento = atendimentos.Count(a => a.Status == StatusAtendimento.EmAtendimento),
            Finalizados = atendimentos.Count(a => a.Status == StatusAtendimento.Finalizado),
            TempoMediaEsperaMinutos = temposEspera.Any() ? temposEspera.Average() : 0,
            DataReferencia = dataReferencia
        };
    }
        
    public async Task<IEnumerable<Atendimento>> ObterAtendimentosDoDiaAsync(DateTime? data = null)
    {
        var dataReferencia = data ?? DateTime.Today;

        return await _dbSet
        .Include(a => a.Paciente)
        .Include(a => a.Triagem)
           .ThenInclude(t => t!.Especialidade)
        .Where(a => a.DataHoraChegada.Date == dataReferencia.Date)
        .OrderBy(a => a.DataHoraChegada)
        .ToListAsync();
    }
}