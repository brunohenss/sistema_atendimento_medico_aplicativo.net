using Microsoft.EntityFrameworkCore;
using AtendimentoMedico.Core.Domain.Entities;

namespace AtendimentoMedico.Infrastructure.Persistence.Context;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Paciente> Pacientes { get; set; } = null!;
    public DbSet<Especialidade> Especialidades { get; set; } = null!;
    public DbSet<Atendimento> Atendimentos { get; set; } = null!;
    public DbSet<Triagem> Triagens { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Paciente>(entity =>
        {
            entity.ToTable("Pacientes");
            entity.HasKey(p => p.Id);

            entity.Property(p => p.Nome)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(p => p.Telefone)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(p => p.Sexo)
                .IsRequired()
                .HasMaxLength(1);

            entity.Property(p => p.Email)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(p => p.Ativo)
                .IsRequired()
                .HasDefaultValue(true);

            entity.Property(p => p.DataCriacao)
                .IsRequired()
                .HasDefaultValueSql("GETDATE()");

            //indices
            entity.HasIndex(p => p.Nome).HasDatabaseName("IX_Pacientes_Nome");
            entity.HasIndex(p => p.Email).HasDatabaseName("IX_Pacientes_Email");

            //relacionamento
            entity.HasMany(p => p.Atendimentos)
                .WithOne(a => a.Paciente)
                .HasForeignKey(a => a.PacienteId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Especialidade>(entity =>
            {
                entity.ToTable("Especialidades");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Nome)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Descricao)
                    .HasMaxLength(500);

                entity.Property(e => e.Ativo)
                    .IsRequired()
                    .HasDefaultValue(true);

                //indices
                entity.HasIndex(e => e.Nome).IsUnique();

                //relacionamento
                entity.HasMany(e => e.Triagens)
                    .WithOne(t => t.Especialidade)
                    .HasForeignKey(t => t.EspecialidadeId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

        modelBuilder.Entity<Atendimento>(entity =>
            {
                entity.ToTable("Atendimentos");
                entity.HasKey(a => a.Id);

                entity.Property(a => a.NumeroSequencial)
                    .IsRequired();

                entity.Property(a => a.Status)
                    .IsRequired()
                    .HasMaxLength(20)
                    .HasDefaultValue("Aguardando");

                entity.Property(a => a.DataHoraChegada)
                    .IsRequired()
                    .HasDefaultValueSql("GETDATE()");

                //indices
                entity.HasIndex(a => a.Status).HasDatabaseName("IX_Atendimentos_Status");
                entity.HasIndex(a => a.DataHoraChegada).HasDatabaseName("IX_Atendimentos_DataChegada");
                entity.HasIndex(a => a.PacienteId).HasDatabaseName("IX_Atendimentos_PacienteId");

                //relacionamento com Triagem (1:1)
                entity.HasOne(a => a.Triagem)
                    .WithOne(t => t.Atendimento)
                    .HasForeignKey<Triagem>(t => t.AtendimentoId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

        modelBuilder.Entity<Triagem>(entity =>
        {
            entity.ToTable("Triagens");
            entity.HasKey(t => t.Id);

            entity.Property(t => t.Sintomas)
                .IsRequired()
                .HasMaxLength(1000);

            entity.Property(t => t.PressaoArterial)
                .IsRequired()
                .HasMaxLength(10);

            entity.Property(t => t.Peso)
                .IsRequired()
                .HasColumnType("decimal(5,2)");

            entity.Property(t => t.Altura)
                .IsRequired()
                .HasColumnType("decimal(3,2)");

            entity.Property(t => t.Observacoes)
                .HasMaxLength(500);

            entity.Property(t => t.DataHoraTriagem)
                .IsRequired()
                .HasDefaultValueSql("GETDATE()");

            //indices
            entity.HasIndex(t => t.AtendimentoId)
                .IsUnique()
                .HasDatabaseName("IX_Triagens_AtendimentoId");
            entity.HasIndex(t => t.EspecialidadeId).HasDatabaseName("IX_Triagens_EspecialidadeId");
        });

        SeedData(modelBuilder);
    }
    
    private void SeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Especialidade>().HasData(
                new Especialidade { Id = 1, Nome = "Clinica Geral", Descricao = "Atendimento médico geral", Ativo = true },
                new Especialidade { Id = 2, Nome = "Cardiologia", Descricao = "Especialidade do coração", Ativo = true },
                new Especialidade { Id = 3, Nome = "Pediatria", Descricao = "Atendimento infantil", Ativo = true },
                new Especialidade { Id = 4, Nome = "Ortopedia", Descricao = "Tratamento de ossos e articulações", Ativo = true },
                new Especialidade { Id = 5, Nome = "Dermatologia", Descricao = "Cuidados com a pele", Ativo = true }
            );
    }
}