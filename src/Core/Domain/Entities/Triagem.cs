using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AtendimentoMedico.Core.Domain.Entities;

[Table("Triagens")]
public class Triagem
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [ForeignKey("Atendimento")]
    public int AtendimentoId { get; set; }

    [Required(ErrorMessage = "Os sintomas são obrigatórios")]
    [StringLength(1000, MinimumLength = 5, ErrorMessage = "A descrição dos sintomas devem ter entre 5 e 1000 caracteres")]
    public string Sintomas { get; set; } = string.Empty;

    [Required(ErrorMessage = "A pressão arterial é obrigatória")]
    [StringLength(10)]
    [RegularExpression(@"^\d{2,3}/\d{2,3}$", ErrorMessage = "Formato invalido.")]
    public string PressaoArterial { get; set; } = string.Empty;

    [Required(ErrorMessage = "O peso é obrigatório")]
    [Range(1, 500, ErrorMessage = "O peso deve estar entre 1 e 500 kg")]
    [Column(TypeName = "decimal(5,2)")]
    public decimal Peso { get; set; }

    [Required(ErrorMessage = "A altura é obrigatória")]
    [Range(0.3, 2.5, ErrorMessage = "A altura deve estar entre 0.3 e 2.5 metros")]
    [Column(TypeName = "decimal(3,2)")]
    public decimal Altura { get; set; }

    [Required]
    [ForeignKey("Especialidade")]
    public int EspecialidadeId { get; set; }

    public DateTime DataHoraTriagem { get; set; } = DateTime.UtcNow;

    [StringLength(500, ErrorMessage = "Observacoes devem ter no máximo 500 caracteres")]
    public string? Observacoes { get; set; }

    public virtual Atendimento Atendimento { get; set; } = null!;
    public virtual Especialidade Especialidade { get; set; } = null!;


    public decimal CalcularIMC()
    {
        if (Altura <= 0)
            return 0;

        return Math.Round(Peso / (Altura * Altura), 2);
    }

    public string ObterClassificacaoIMC()
    {
        var imc = CalcularIMC();

        if (imc < 18.5m) return "Abaixo do peso";
        if (imc < 25m) return "Peso normal";
        if (imc < 30m) return "Sobrepeso";
        if (imc < 35m) return "Obesidade grau 1";
        if (imc < 40m) return "Obesidade grau 2";
        return "Obesidade grau 3";
    }
    
    public bool PressaoArterialValida()
    {
        if (string.IsNullOrWhiteSpace(PressaoArterial))
            return false;

        var partes = PressaoArterial.Split("/");
        if (partes.Length != 2)
            return false;

        return int.TryParse(partes[0], out var sistolica) &&
               int.TryParse(partes[1], out var diastolica) &&
               sistolica > 0 && sistolica < 300 &&
               diastolica > 0 && diastolica < 200;
    }
    
}