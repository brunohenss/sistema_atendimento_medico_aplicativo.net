using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace AtendimentoMedico.Core.Domain.Interfaces;

public interface IRepository<T> where T : class
{
    Task<T?> ObterPorIdAsync(int id);

    Task<IEnumerable<T>> ObterTodosAsync();

    Task<IEnumerable<T>> BuscarAsync(Expression<Func<T, bool>> filtro);

    Task<T?> BuscarUnicoAsync(Expression<Func<T, bool>> filtro);

    Task<T> AdicionarAsync(T entidade);

    Task AtualizarAsync(T entidade);

    Task RemoverAsync(T entidade);

    Task<bool> ExisteAsync(Expression<Func<T, bool>> filtro);

    Task<int> ContarAsync(Expression<Func<T, bool>> filtro);

    Task<int> SalvarAlteracoesAsync();
    
}