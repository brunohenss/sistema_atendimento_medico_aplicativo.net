using System;
using System.ComponentModel.DataAnnotations;

namespace AtendimentoMedico.Core.Application.DTOs;

public class CriarPacienteDto
{
    [Required(ErrorMessage = "O nome é obrigatório")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "O nome deve ter entre 2 e 200 caracteres")]
    public string Nome { get; set; } = string.Empty;

    [Required(ErrorMessage = "O telefone é obrigatório")]
    [Phone(ErrorMessage = "Telefone invalido")]
    public string Telefone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Informar o sexo é obrigatório")]
    [RegularExpression("^[MF]$", ErrorMessage = "Sexo deve ser M ou F")]
    public string Sexo { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email é obrigatório")]
    [EmailAddress(ErrorMessage = "Formato de email invalido")]
    public string Email { get; set; } = string.Empty;
}

public class AtualizarPacienteDto
{
    [Required(ErrorMessage = "O nome é obrigatório")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "O nome deve ter entre 2 e 200 caracteres")]
    public string Nome { get; set; } = string.Empty;

    [Required(ErrorMessage = "O telefone é obrigatório")]
    [Phone(ErrorMessage = "Telefone invalido")]
    public string Telefone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Informar o sexo é obrigatório")]
    [RegularExpression("^[MF]$", ErrorMessage = "Sexo deve ser M ou F")]
    public string Sexo { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email é obrigatório")]
    [EmailAddress(ErrorMessage = "Formato de email invalido")]
    public string Email { get; set; } = string.Empty;
}

public class PacienteDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string Sexo { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool Ativo { get; set; }
    public DateTime DataCriacao { get; set; }
    public int TotalAtendimentos { get; set; }
}

public class PacienteResumoDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}