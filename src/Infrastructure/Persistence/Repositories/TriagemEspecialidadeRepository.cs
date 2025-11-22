using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AtendimentoMedico.Core.Domain.Entities;
using AtendimentoMedico.Core.Domain.Interfaces;
using AtendimentoMedico.Infrastructure.Persistence.Context;

namespace AtendimentoMedico.Infrastructure.Persistence.Repositories;
    public class TriagemRepository : Repository<Triagem>, ITriagemRepository
    {
        public TriagemRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Triagem?> ObterPorAtendimentoAsync(int atendimentoId)
        {
            return await _dbSet
                .Include(t => t.Especialidade)
                .Include(t => t.Atendimento)
                    .ThenInclude(a => a.Paciente)
                .FirstOrDefaultAsync(t => t.AtendimentoId == atendimentoId);
        }

        public async Task<Triagem?> ObterCompletaAsync(int id)
        {
            return await _dbSet
                .Include(t => t.Especialidade)
                .Include(t => t.Atendimento)
                    .ThenInclude(a => a.Paciente)
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<IEnumerable<Triagem>> ObterPorEspecialidadeAsync(int especialidadeId)
        {
            return await _dbSet
                .Include(t => t.Atendimento)
                    .ThenInclude(a => a.Paciente)
                .Where(t => t.EspecialidadeId == especialidadeId)
                .OrderByDescending(t => t.DataHoraTriagem)
                .ToListAsync();
        }

        public async Task<bool> ExisteTriagemParaAtendimentoAsync(int atendimentoId)
        {
            return await _dbSet.AnyAsync(t => t.AtendimentoId == atendimentoId);
        }
    }

    public class EspecialidadeRepository : Repository<Especialidade>, IEspecialidadeRepository
    {
        public EspecialidadeRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Especialidade>> ObterAtivasAsync()
        {
            return await _dbSet
                .Where(e => e.Ativo)
                .OrderBy(e => e.Nome)
                .ToListAsync();
        }

        public async Task<Especialidade?> ObterPorNomeAsync(string nome)
        {
            return await _dbSet
                .FirstOrDefaultAsync(e => e.Nome.ToLower() == nome.ToLower());
        }

        public async Task<Especialidade?> ObterComTriagensAsync(int id)
        {
            return await _dbSet
                .Include(e => e.Triagens)
                    .ThenInclude(t => t.Atendimento)
                        .ThenInclude(a => a.Paciente)
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task<bool> NomeJaCadastradoAsync(string nome, int? especialidadeIdExcluir = null)
        {
            var query = _dbSet.Where(e => e.Nome.ToLower() == nome.ToLower());

            if (especialidadeIdExcluir.HasValue)
            {
                query = query.Where(e => e.Id != especialidadeIdExcluir.Value);
            }

            return await query.AnyAsync();
        }
    }