using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AtendimentoMedico.Core.Domain.Interfaces;
using AtendimentoMedico.Infrastructure.Persistence.Context;

namespace AtendimentoMedico.Infrastructure.Persistence.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _dbSet = context.Set<T>();
    }

    public virtual async Task<T?> ObterPorIdAsync(int id)
    {
        return await _dbSet.FindAsync(id);
    }

    public virtual async Task<IEnumerable<T>> ObterTodosAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public virtual async Task<IEnumerable<T>> BuscarAsync(Expression<Func<T, bool>> filtro)
    {
        return await _dbSet.Where(filtro).ToListAsync();
    }

    public virtual async Task<T?> BuscarUnicoAsync(Expression<Func<T, bool>> filtro)
    {
        return await _dbSet.FirstOrDefaultAsync(filtro);
    }

    public virtual async Task<T> AdicionarAsync(T entidade)
    {
        await _dbSet.AddAsync(entidade);
        return entidade;
    }

    public virtual async Task AtualizarAsync(T entidade)
    {
        _dbSet.Update(entidade);
        await Task.CompletedTask;
    }

    public virtual async Task RemoverAsync(T entidade)
    {
        _dbSet.Remove(entidade);
        await Task.CompletedTask;
    }

    public virtual async Task<bool> ExisteAsync(Expression<Func<T, bool>> filtro)
    {
        return await _dbSet.AnyAsync(filtro);
    }

    public virtual async Task<int> ContarAsync(Expression<Func<T, bool>> filtro)
    {
        return await _dbSet.CountAsync(filtro);
    }
    
    public virtual async Task<int> SalvarAlteracoesAsync()
    {
        return await _context.SaveChangesAsync();
    }
}