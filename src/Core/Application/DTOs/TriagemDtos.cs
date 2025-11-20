using System;
using System.ComponentModel.DataAnnotations;

namespace AtendimentoMedico.Core.Application.DTOs;

public class CriarTriagemDto
{
    [Required(ErrorMessage = "O id do atendimento é obrigatório")]
    public int AtendimentoId { get; set; }

    [Required(ErrorMessage = "Os sintomas são obrigatórios")]
    [StringLength(1000, MinimumLength = 5, ErrorMessage = "os sintoma devem ter entre 5 e 1000 caracteres")]
    public string Sintomas { get; set; } = string.Empty;

    [Required(ErrorMessage = "Pressao arterial é obrigatorio")]
    [RegularExpression(@"^\d{2,3}/\d{2,3}$", ErrorMessage = "Formato inválido.")]
    public string PressaoArterial { get; set; } = string.Empty;

    [Required(ErrorMessage = "O preso é obrigatórioi")]
    [Range(1, 500, ErrorMessage = "O peso deve estar entre 1 e 500 kg")]
    public decimal Peso { get; set; }

    [Required(ErrorMessage = "A altura é obrigatória")]
    [Range(0.3, 2.5, ErrorMessage = "A altura deve estar entre 0.3 e 2.5 metros")]
    public decimal Altura { get; set; }

    [Required(ErrorMessage = "A especialidade é obrigatória")]
    [Range(1, int.MaxValue, ErrorMessage = "Especialidade invalida")]
    public int EspecialidadeId { get; set; }

    [StringLength(500, ErrorMessage = "As observações devem ter no maximo 500 caracteres")]
    public string? Observacoes { get; set; }
}

public class TriagemDto
{
    public int Id { get; set; }
    public int AtendimentoId { get; set; }
    public string Sintomas { get; set; } = string.Empty;
    public string PressaoArterial { get; set; } = string.Empty;
    public decimal Peso { get; set; }
    public decimal Altura { get; set; }
    public decimal IMC { get; set; }
    public string ClassificacaoIMC { get; set; } = string.Empty;
    public int EspecialidadeId { get; set; }
    public string NomeEspecialidade { get; set; } = string.Empty;
    public DateTime DataHoraTriagem { get; set; }
    public string? Observacoes { get; set; }
}

public class TriagemResumoDto
{
    public int Id { get; set; }
    public string Sintomas { get; set; } = string.Empty;
    public string PressaoArterial { get; set; } = string.Empty;
    public decimal Peso { get; set; }
    public decimal Altura { get; set; }
    public decimal IMC { get; set; }
    public string Especialidade { get; set; } = string.Empty;
}