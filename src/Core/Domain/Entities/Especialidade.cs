using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AtendimentoMedico.Core.Domain.Entities;

[Table("Especialidades")]
public class Especialidade
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required(ErrorMessage = "O nome da especialidade é obrigatório")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Deve ter entre 2 e 100 caracteres")]
    public string Nome { get; set; } = string.Empty;

    [StringLength(500, ErrorMessage = "Descrição deve ter no maximo 500 carateres")]
    public string? Descricao { get; set; }

    public bool Ativo { get; set; } = true;


    public virtual ICollection<Triagem> Triagens { get; set; } = new List<Triagem>();

    public void Desativar()
    {
        Ativo = false;
    }
    
    public void Reativar()
    {
        Ativo = true;
    }
}