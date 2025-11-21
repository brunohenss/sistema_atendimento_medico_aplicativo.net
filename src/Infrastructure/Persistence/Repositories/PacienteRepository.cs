using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AtendimentoMedico.Core.Domain.Entities;
using AtendimentoMedico.Core.Domain.Interfaces;
using AtendimentoMedico.Infrastructure.Persistence.Context;

namespace AtendimentoMedico.Infrastructure.Persistence.Repositories;

public class PacienteRepository : Repository<Paciente>
{
    public PacienteRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Paciente>> ObterAtivosASync()
    {
        return await _dbSet
        .Where(p => p.Ativo)
        .OrderBy(p => p.Nome)
        .ToListAsync();
    }

    public async Task<Paciente?> ObterPorEmailAsync(string email)
    {
        return await _dbSet
        .FirstOrDefaultAsync(p => p.Email.ToLower() == email.ToLower());
    }

    public async Task<IEnumerable<Paciente>> BuscarPorNomeAsync(string nome)
    {
        return await _dbSet
        .Where(p => p.Ativo && p.Nome.Contains(nome))
        .OrderBy(p => p.Nome)
        .ToListAsync();
    }

    public async Task<Paciente?> ObterComAtendimentosAsync(int id)
    {
        return await _dbSet
        .Include(p => p.Atendimentos)
           .ThenInclude(a => a.Triagem)
              .ThenInclude(t => t!.Especialidade)
        .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<bool> EmailJaCadastradoAsync(string email, int? pacienteIdExcluir = null)
    {
        var query = _dbSet.Where(p => p.Email.ToLower() == email.ToLower());

        if (pacienteIdExcluir.HasValue)
        {
            query = query.Where(p => p.Id != pacienteIdExcluir.Value);
        }

        return await query.AnyAsync();
    }
    
    public override async Task<Paciente?> ObterPorIdAsync(int id)
    {
        return await _dbSet
        .Include(p => p.Atendimentos)
        .FirstOrDefaultAsync(p => p.Id == id);
    }
}