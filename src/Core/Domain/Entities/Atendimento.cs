using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AtendimentoMedico.Core.Domain.Entities;

[Table("Atendimentos")]
public class Atendimento
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int NumeroSequencial { get; set; }

    [Required]
    [ForeignKey("Paciente")]
    public int PacienteId { get; set; }

    public DateTime DataHoraChegada { get; set; } = DateTime.Now;

    [Required]
    [StringLength(20)]
    public string Status { get; set; } = StatusAtendimento.Aguardando;

    public DateTime? DataHoraChamada { get; set; }
    public DateTime? DataHoraFinalizacao { get; set; }

    public virtual Paciente Paciente { get; set; } = null!;
    public virtual Triagem? Triagem { get; set; }


    public void ChamarPaciente()
    {
        if (Status != StatusAtendimento.Aguardando)
            throw new InvalidOperationException("apenas pacientes aguardando podem ser chamados");

        Status = StatusAtendimento.EmAtendimento;
        DataHoraChamada = DateTime.UtcNow;
    }

    public void IniciarTriagem()
    {
        if (Status != StatusAtendimento.Aguardando)
            throw new InvalidOperationException("apenas pacientes aguardando podem ir para triagem");

        Status = StatusAtendimento.EmTriagem;
    }

    public void FinalizarAtendimento()
    {
        if (Status == StatusAtendimento.Finalizado)
            throw new InvalidOperationException("Este atendimento já foi finalizado");

        Status = StatusAtendimento.Finalizado;
        DataHoraFinalizacao = DateTime.UtcNow;
    }

    public int CalcularTempoEspera()
    {
        var dataReferencia = DataHoraChamada ?? DateTime.UtcNow;
        return (int)(dataReferencia - DataHoraChegada).TotalMinutes;
    }
}

public static class StatusAtendimento
{
    public const string Aguardando = "Aguardando";
    public const string EmTriagem = "EmTriagem";
    public const string EmAtendimento = "EmAtendimento";
    public const string Finalizado = "Finalizado";
    
    public static bool IsValido(string status)
    {
        return status == Aguardando ||
               status == EmTriagem ||
               status == EmAtendimento ||
               status == Finalizado;
    }
}