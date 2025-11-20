using System;
using System.ComponentModel.DataAnnotations;

namespace AtendimentoMedico.Core.Application.DTOs;

public class CriarEspecialidadaeDto
{
    [Required(ErrorMessage = "O nome da especialidade é obrigatório")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "O nome deve ter entre 2 e 100 caracteres")]
    public string Nome { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "A descrição deve ter no maximo 500 caracteres")]
    public string? Descricao { get; set; }
}

public class EspecialidadeDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public bool Ativo { get; set; }
    public int TotalTriagens { get; set; }
}

public class EspecialidadeResumoDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
}