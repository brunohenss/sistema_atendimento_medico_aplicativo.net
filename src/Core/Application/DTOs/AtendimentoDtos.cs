using System;
using System.ComponentModel.DataAnnotations;

namespace AtendimentoMedico.Core.Application.DTOs;

public class CriarAtendimentoDto
{
    [Required(ErrorMessage = "O id do paciente é obrigatório")]
    [Range(1, int.MaxValue, ErrorMessage = "Id do paciente inválido")]
    public int PacienteId { get; set; }
}

public class AtendimentoDto
{
    public int Id { get; set; }
    public int NumeroSequencial { get; set; }
    public int PacienteId { get; set; }
    public string NomePaciente { get; set; } = string.Empty;
    public string TelefonePaciente { get; set; } = string.Empty;
    public DateTime DataHoraChegada { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? DataHoraChamada { get; set; }
    public DateTime? DataHoraFinalizacao { get; set; }
    public int TempoEsperaMinutos { get; set; }
    public TriagemResumoDto? Triagem { get; set; }
}

public class FilaAtendimentoDto
{
    public int AtendimentoId { get; set; }
    public int NumeroSequencial { get; set; }
    public string NomePaciente { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Especialidade { get; set; }
    public DateTime DataHoraChegada { get; set; }
    public int TempoEsperaMinutos { get; set; }
    public bool PossuiTriagem { get; set; }
}

public class EstatisticasAtendimentoDto
{
    public int TotalAtendimentos { get; set; }
    public int Aguardando { get; set; }
    public int EmTriagem { get; set; }
    public int EmAtendimento { get; set; }
    public int Finalizados { get; set; }
    public double TempoMediaEsperaMinutos { get; set; }
    public DateTime DataReferencia { get; set; }
}