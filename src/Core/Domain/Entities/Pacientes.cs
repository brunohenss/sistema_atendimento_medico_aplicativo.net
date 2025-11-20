using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AtendimentoMedico.Core.Domain.Entities;

[Table("Pacientes")]
public class Paciente
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required(ErrorMessage = "O nome do paciente é obrigatorio")]
    [StringLength(200, MinimumLength = 2, ErrorMessage = "O nome deve ter entre 2 e 200 caracteres")]
    public string Nome { get; set; } = string.Empty;

    [Required(ErrorMessage = "O telefone é  obrigatório")]
    [StringLength(14, ErrorMessage = "O telefone deve ter no máximo 14 caracteres")]
    public string Telefone { get; set; } = string.Empty;

    [Required(ErrorMessage = "O sexo do paciente é obrigatório")]
    [StringLength(1)]
    [RegularExpression("^[MF]$", ErrorMessage = "O sexo deve ser 'M' (masculino) ou 'F' (feminino)")]
    public string Sexo { get; set; } = string.Empty;

    [Required(ErrorMessage = "O email é  obrigatório")]
    [StringLength(200, ErrorMessage = "O email deve ter no máximo 200 caracteres")]
    [EmailAddress(ErrorMessage = "Email invalido")]
    public string Email { get; set; } = string.Empty;

    public bool Ativo { get; set; } = true;

    public DateTime DataCriacao { get; set; } = DateTime.Now;


    public virtual ICollection<Atendimento> Atendimentos { get; set; } = new List<Atendimento>();

    public void Desativar()
    {
        Ativo = false;
    }

    public void Reativar()
    {
        Ativo = true;
    }
    
    public void AtualizarDados(string nome, string telefone, string sexo, string email)
    {
        Nome = nome;
        Telefone = telefone;
        Sexo = sexo;
        Email = email;
    }    
}