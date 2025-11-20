-- script ddl - criação do banco de dados
-- sistema de atendimento médico

-- criar o banco de dados
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'AtendimentoMedicoDB')
BEGIN
    CREATE DATABASE AtendimentoMedicoDB;
END
GO

USE     CREATE DATABASE AtendimentoMedicoDB;
GO

-- tabela: pacientes
-- armazena informações dos paciente
IF OBJECT_ID('dbo.Pacientes', 'U') IS NOT NULL
    DROP TABLE dbo.Pacientes;
GO

CREATE TABLE dbo.Pacientes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nome NVARCHAR(200) NOT NULL,
    Telefone NVARCHAR(20) NOT NULL,
    Sexo CHAR(1) NOT NULL CHECK (Sexo IN ('M', 'F')),
    Email NVARCHAR(200) NOT NULL,
    Ativo BIT NOT NULL DEFAULT 1,
    DataCriacao DATETIME NOT NULL DEFAULT GETDATE(),
    
    -- constraints
    CONSTRAINT CK_Pacientes_Nome CHECK (LEN(TRIM(Nome)) > 0),
    CONSTRAINT CK_Pacientes_Email CHECK (Email LIKE '%@%.%')
);
GO

-- índice para busca por nome
CREATE NONCLUSTERED INDEX IX_Pacientes_Nome 
ON dbo.Pacientes(Nome);
GO

-- índice para busca por email
CREATE NONCLUSTERED INDEX IX_Pacientes_Email 
ON dbo.Pacientes(Email);
GO

-- tabela: especialidades
-- lista de especialidades medicas disponíveis
IF OBJECT_ID('dbo.Especialidades', 'U') IS NOT NULL
    DROP TABLE dbo.Especialidades;
GO

CREATE TABLE dbo.Especialidades (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nome NVARCHAR(100) NOT NULL UNIQUE,
    Descricao NVARCHAR(500) NULL,
    Ativo BIT NOT NULL DEFAULT 1,
    
    -- constraints
    CONSTRAINT CK_Especialidades_Nome CHECK (LEN(TRIM(Nome)) > 0)
);
GO

-- tabela: atendimentos
-- registra cada chegada do paciente
IF OBJECT_ID('dbo.Atendimentos', 'U') IS NOT NULL
    DROP TABLE dbo.Atendimentos;
GO

CREATE TABLE dbo.Atendimentos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NumeroSequencial INT NOT NULL,
    PacienteId INT NOT NULL,
    DataHoraChegada DATETIME NOT NULL DEFAULT GETDATE(),
    Status NVARCHAR(20) NOT NULL DEFAULT 'Aguardando',
    DataHoraChamada DATETIME NULL,
    DataHoraFinalizacao DATETIME NULL,
    
    -- foreign Keys
    CONSTRAINT FK_Atendimentos_Pacientes 
        FOREIGN KEY (PacienteId) REFERENCES dbo.Pacientes(Id),
    
    -- constraints
    CONSTRAINT CK_Atendimentos_Status 
        CHECK (Status IN ('Aguardando', 'EmTriagem', 'EmAtendimento', 'Finalizado')),
    CONSTRAINT CK_Atendimentos_DataChamada 
        CHECK (DataHoraChamada IS NULL OR DataHoraChamada >= DataHoraChegada),
    CONSTRAINT CK_Atendimentos_DataFinalizacao 
        CHECK (DataHoraFinalizacao IS NULL OR DataHoraFinalizacao >= DataHoraChegada)
);
GO

-- índice para busca por status
CREATE NONCLUSTERED INDEX IX_Atendimentos_Status 
ON dbo.Atendimentos(Status) 
INCLUDE (NumeroSequencial, DataHoraChegada);
GO

-- índice para busca por data de chegada
CREATE NONCLUSTERED INDEX IX_Atendimentos_DataChegada 
ON dbo.Atendimentos(DataHoraChegada);
GO

-- indice para busca por paciente
CREATE NONCLUSTERED INDEX IX_Atendimentos_PacienteId 
ON dbo.Atendimentos(PacienteId);
GO

-- tabela: triagens
-- dados coletados na triagem de enfermagem
IF OBJECT_ID('dbo.Triagens', 'U') IS NOT NULL
    DROP TABLE dbo.Triagens;
GO

CREATE TABLE dbo.Triagens (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    AtendimentoId INT NOT NULL UNIQUE,
    Sintomas NVARCHAR(1000) NOT NULL,
    PressaoArterial NVARCHAR(10) NOT NULL,
    Peso DECIMAL(5,2) NOT NULL,
    Altura DECIMAL(3,2) NOT NULL,
    EspecialidadeId INT NOT NULL,
    DataHoraTriagem DATETIME NOT NULL DEFAULT GETDATE(),
    Observacoes NVARCHAR(500) NULL,
    
    -- foreign keys
    CONSTRAINT FK_Triagens_Atendimentos 
        FOREIGN KEY (AtendimentoId) REFERENCES dbo.Atendimentos(Id),
    CONSTRAINT FK_Triagens_Especialidades 
        FOREIGN KEY (EspecialidadeId) REFERENCES dbo.Especialidades(Id),
    
    -- constraints
    CONSTRAINT CK_Triagens_Peso CHECK (Peso > 0 AND Peso < 500),
    CONSTRAINT CK_Triagens_Altura CHECK (Altura > 0 AND Altura < 3),
    CONSTRAINT CK_Triagens_Sintomas CHECK (LEN(TRIM(Sintomas)) > 0)
);
GO

-- indice para busca por atendimento
CREATE NONCLUSTERED INDEX IX_Triagens_AtendimentoId 
ON dbo.Triagens(AtendimentoId);
GO

-- indice para busca por especialidade
CREATE NONCLUSTERED INDEX IX_Triagens_EspecialidadeId 
ON dbo.Triagens(EspecialidadeId);
GO

-- view: fila de atendimento completa
-- visao consolidada para exibir fila
IF OBJECT_ID('dbo.vw_FilaAtendimento', 'V') IS NOT NULL
    DROP VIEW dbo.vw_FilaAtendimento;
GO

CREATE VIEW dbo.vw_FilaAtendimento AS
SELECT 
    a.Id AS AtendimentoId,
    a.NumeroSequencial,
    a.Status,
    a.DataHoraChegada,
    a.DataHoraChamada,
    p.Id AS PacienteId,
    p.Nome AS NomePaciente,
    p.Telefone,
    p.Sexo,
    t.Id AS TriagemId,
    e.Nome AS Especialidade,
    t.Sintomas,
    t.PressaoArterial,
    DATEDIFF(MINUTE, a.DataHoraChegada, GETDATE()) AS TempoEsperaMins
FROM 
    dbo.Atendimentos a
    INNER JOIN dbo.Pacientes p ON a.PacienteId = p.Id
    LEFT JOIN dbo.Triagens t ON a.Id = t.AtendimentoId
    LEFT JOIN dbo.Especialidades e ON t.EspecialidadeId = e.Id
WHERE 
    a.Status IN ('Aguardando', 'EmTriagem', 'EmAtendimento');
GO

-- stored procedure: gerar número sequencial
-- gera próximo número da fila (reinicia diariamente)
IF OBJECT_ID('dbo.sp_GerarNumeroSequencial', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_GerarNumeroSequencial;
GO

CREATE PROCEDURE dbo.sp_GerarNumeroSequencial
    @DataAtual DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- se não informar data, usa data atual
    IF @DataAtual IS NULL
        SET @DataAtual = CAST(GETDATE() AS DATE);
    
    -- busca o último número do dia
    DECLARE @UltimoNumero INT;
    
    SELECT @UltimoNumero = ISNULL(MAX(NumeroSequencial), 0)
    FROM dbo.Atendimentos
    WHERE CAST(DataHoraChegada AS DATE) = @DataAtual;
    
    -- retorna próximo número
    SELECT @UltimoNumero + 1 AS ProximoNumero;
END;
GO

-- stored proocedure: chamar próximo paciente
-- retorna proximo paciente na fila por ordem de chegada
IF OBJECT_ID('dbo.sp_ChamarProximoPaciente', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ChamarProximoPaciente;
GO

CREATE PROCEDURE dbo.sp_ChamarProximoPaciente
AS
BEGIN
    SET NOCOUNT ON;
    
    -- busca próximo paciente aguardando
    SELECT TOP 1
        a.Id AS AtendimentoId,
        a.NumeroSequencial,
        p.Nome AS NomePaciente,
        p.Telefone,
        t.Sintomas,
        t.PressaoArterial,
        t.Peso,
        t.Altura,
        e.Nome AS Especialidade
    FROM 
        dbo.Atendimentos a
        INNER JOIN dbo.Pacientes p ON a.PacienteId = p.Id
        LEFT JOIN dbo.Triagens t ON a.Id = t.AtendimentoId
        LEFT JOIN dbo.Especialidades e ON t.EspecialidadeId = e.Id
    WHERE 
        a.Status = 'Aguardando'
    ORDER BY 
        a.DataHoraChegada ASC;
    
    -- Atualiza status para EmAtendimento
    UPDATE dbo.Atendimentos
    SET 
        Status = 'EmAtendimento',
        DataHoraChamada = GETDATE()
    WHERE Id = (
        SELECT TOP 1 Id 
        FROM dbo.Atendimentos 
        WHERE Status = 'Aguardando'
        ORDER BY DataHoraChegada ASC
    );
END;
GO

IF OBJECT_ID('dbo.fn_CalcularIMC', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_CalcularIMC;
GO

CREATE FUNCTION dbo.fn_CalcularIMC
(
    @Peso DECIMAL(5,2),
    @Altura DECIMAL(3,2)
)
RETURNS DECIMAL(5,2)
AS
BEGIN
    DECLARE @IMC DECIMAL(5,2);
    
    IF @Altura > 0
        SET @IMC = @Peso / (@Altura * @Altura);
    ELSE
        SET @IMC = 0;
    
    RETURN @IMC;
END;
GO