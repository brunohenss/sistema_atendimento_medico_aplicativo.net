-- =============================================
-- script dml - manipulacao de dados
-- sistema de atendimento médico
-- =============================================

USE AtendimentoMedicoDB;
GO

-- inserção de dados iniciais
-- Inserir Especialidades

INSERT INTO dbo.Especialidades (Nome, Descricao, Ativo) VALUES
('Clínica Geral', 'Atendimento médico geral para consultas de rotina e diagnósticos iniciais', 1),
('Cardiologia', 'Especialidade focada em doenças do coração e sistema cardiovascular', 1),
('Pediatria', 'Atendimento médico para crianças e adolescentes', 1),
('Ortopedia', 'Tratamento de problemas relacionados ao sistema musculoesquelético', 1),
('Dermatologia', 'Cuidados com a saúde da pele, cabelos e unhas', 1),
('Ginecologia', 'Saúde da mulher e sistema reprodutor feminino', 1),
('Oftalmologia', 'Especialidade dedicada à saúde dos olhos e visão', 1),
('Psiquiatria', 'Tratamento de transtornos mentais e emocionais', 1);
GO

-- inserir Pacientes de exemplo

INSERT INTO dbo.Pacientes (Nome, Telefone, Sexo, Email) VALUES
('Maria Silva Santos', '(19) 98765-4321', 'F', 'maria.silva@email.com'),
('João Paulo Oliveira', '(19) 99876-5432', 'M', 'joao.oliveira@email.com'),
('Ana Carolina Souza', '(19) 98765-1234', 'F', 'ana.souza@email.com'),
('Pedro Henrique Costa', '(19) 97654-3210', 'M', 'pedro.costa@email.com'),
('Juliana Fernandes Lima', '(19) 96543-2109', 'F', 'juliana.lima@email.com');
GO
-- EXEMPLOS DE CONSULTAS (SELECT)

-- 1. listar todos os pacientes ativos
SELECT 
    Id,
    Nome,
    Telefone,
    Sexo,
    Email,
    FORMAT(DataCriacao, 'dd/MM/yyyy HH:mm') AS DataCadastro
FROM 
    dbo.Pacientes
WHERE 
    Ativo = 1
ORDER BY 
    Nome;
GO

-- 2. listar todas as especialidades disponíveis
SELECT 
    Id,
    Nome,
    Descricao
FROM 
    dbo.Especialidades
WHERE 
    Ativo = 1
ORDER BY 
    Nome;
GO

-- 3. buscar paciente por nome (busca parcial)
SELECT 
    Id,
    Nome,
    Telefone,
    Email
FROM 
    dbo.Pacientes
WHERE 
    Nome LIKE '%Silva%'
    AND Ativo = 1;
GO

-- 4. visualizar fila de atendimento atual
SELECT 
    NumeroSequencial AS Senha,
    NomePaciente AS Paciente,
    Status,
    Especialidade,
    FORMAT(DataHoraChegada, 'dd/MM/yyyy HH:mm') AS Chegada,
    TempoEsperaMins AS [Tempo Espera (min)]
FROM 
    dbo.vw_FilaAtendimento
ORDER BY 
    DataHoraChegada;
GO

-- 5. buscar histórico de atendimentos de um paciente
SELECT 
    a.NumeroSequencial AS Senha,
    FORMAT(a.DataHoraChegada, 'dd/MM/yyyy HH:mm') AS [Data Atendimento],
    a.Status,
    e.Nome AS Especialidade,
    t.Sintomas
FROM 
    dbo.Atendimentos a
    INNER JOIN dbo.Pacientes p ON a.PacienteId = p.Id
    LEFT JOIN dbo.Triagens t ON a.Id = t.AtendimentoId
    LEFT JOIN dbo.Especialidades e ON t.EspecialidadeId = e.Id
WHERE 
    p.Id = 1  -- Alterar id conforme necessário
ORDER BY 
    a.DataHoraChegada DESC;
GO

-- 6. Estatísticas do dia
SELECT 
    COUNT(*) AS TotalAtendimentos,
    SUM(CASE WHEN Status = 'Aguardando' THEN 1 ELSE 0 END) AS Aguardando,
    SUM(CASE WHEN Status = 'EmTriagem' THEN 1 ELSE 0 END) AS EmTriagem,
    SUM(CASE WHEN Status = 'EmAtendimento' THEN 1 ELSE 0 END) AS EmAtendimento,
    SUM(CASE WHEN Status = 'Finalizado' THEN 1 ELSE 0 END) AS Finalizados,
    AVG(DATEDIFF(MINUTE, DataHoraChegada, ISNULL(DataHoraFinalizacao, GETDATE()))) AS TempoMedioMin
FROM 
    dbo.Atendimentos
WHERE 
    CAST(DataHoraChegada AS DATE) = CAST(GETDATE() AS DATE);
GO

-- EXEMPLOS DE INSERÇÃO (INSERT)
-- 1. cadastrar novo paciente
PRINT 'Cadastrar novo paciente:';
INSERT INTO dbo.Pacientes (Nome, Telefone, Sexo, Email)
VALUES ('Carlos Eduardo Mendes', '(19) 95432-1098', 'M', 'carlos.mendes@email.com');

SELECT 
    Id,
    Nome,
    'Paciente cadastrado com sucesso!' AS Mensagem
FROM 
    dbo.Pacientes
WHERE 
    Id = SCOPE_IDENTITY();
GO

-- 2. criar novo atendimento (gerar senha)
DECLARE @NumeroSequencial INT;
DECLARE @PacienteId INT = 1; -- alterar conforme necessário

-- gera número sequencial
EXEC dbo.sp_GerarNumeroSequencial @DataAtual = NULL;
SET @NumeroSequencial = (SELECT TOP 1 ProximoNumero FROM (
    EXEC dbo.sp_GerarNumeroSequencial
) AS Resultado);

-- cria atendimento
INSERT INTO dbo.Atendimentos (NumeroSequencial, PacienteId, Status)
VALUES (@NumeroSequencial, @PacienteId, 'Aguardando');

SELECT 
    Id AS AtendimentoId,
    NumeroSequencial AS Senha,
    'Senha gerada com sucesso!' AS Mensagem
FROM 
    dbo.Atendimentos
WHERE 
    Id = SCOPE_IDENTITY();
GO

-- 3. registrar triagem
DECLARE @AtendimentoId INT;

-- busca um atendimento aguardando (para exemplo)
SELECT TOP 1 @AtendimentoId = Id
FROM dbo.Atendimentos
WHERE Status = 'Aguardando'
ORDER BY DataHoraChegada;

IF @AtendimentoId IS NOT NULL
BEGIN
    -- Registra triagem
    INSERT INTO dbo.Triagens (
        AtendimentoId,
        Sintomas,
        PressaoArterial,
        Peso,
        Altura,
        EspecialidadeId,
        Observacoes
    )
    VALUES (
        @AtendimentoId,
        'Dor de cabeça intensa há 2 dias, tontura e náuseas',
        '130/85',
        75.5,
        1.75,
        1, -- clínica geral
        'Paciente relata histórico de enxaqueca na família'
    );
    
    -- atualiza status do atendimento
    UPDATE dbo.Atendimentos
    SET Status = 'EmTriagem'
    WHERE Id = @AtendimentoId;
    
    SELECT 
        'Triagem registrada com sucesso!' AS Mensagem,
        @AtendimentoId AS AtendimentoId,
        dbo.fn_CalcularIMC(75.5, 1.75) AS IMC;
END
ELSE
BEGIN
    PRINT 'Nenhum atendimento disponível para triagem.';
END
GO

-- EXEMPLOS DE ATUALIZAÇÃO (UPDATE)
-- 1. atualizar dados do paciente
UPDATE dbo.Pacientes
SET 
    Telefone = '(19) 99999-8888',
    Email = 'maria.silva.novo@email.com'
WHERE 
    Id = 1;

SELECT 
    Id,
    Nome,
    Telefone,
    Email,
    'Dados atualizados com sucesso!' AS Mensagem
FROM 
    dbo.Pacientes
WHERE 
    Id = 1;
GO

-- 2. chamar paciente para atendimento
EXEC dbo.sp_ChamarProximoPaciente;
GO

-- 3. atualizar status do atendimento para Finalizado
DECLARE @AtendimentoIdFinalizar INT;

-- busca um atendimento em andamento
SELECT TOP 1 @AtendimentoIdFinalizar = Id
FROM dbo.Atendimentos
WHERE Status = 'EmAtendimento'
ORDER BY DataHoraChamada;

IF @AtendimentoIdFinalizar IS NOT NULL
BEGIN
    UPDATE dbo.Atendimentos
    SET 
        Status = 'Finalizado',
        DataHoraFinalizacao = GETDATE()
    WHERE 
        Id = @AtendimentoIdFinalizar;
    
    SELECT 
        'Atendimento finalizado com sucesso!' AS Mensagem,
        @AtendimentoIdFinalizar AS AtendimentoId;
END
ELSE
BEGIN
    PRINT 'Nenhum atendimento em andamento para finalizar.';
END
GO

-- 4. desativar paciente (exclusão lógica)
UPDATE dbo.Pacientes
SET Ativo = 0
WHERE Id = 6; -- ajustar id conforme necessario

SELECT 
    'Paciente desativado com sucesso!' AS Mensagem;
GO

-- (Delete))
-- 1. Excluir triagem (se necessário refazer)
-- DELETE FROM dbo.Triagens WHERE Id = X;
PRINT 'Exclusão física não recomendada em produção!';
PRINT 'Delete concluido com sucesso (abordagem ideal - soft delete)';
GO

-- 2. excluir atendimento antigo (após arquivamento)
PRINT 'Excluir atendimento:';
-- DELETE FROM dbo.Atendimentos WHERE Id = X AND Status = 'Finalizado';
PRINT 'Apenas exclua após backup/arquivamento!';
GO

-- consultas afim de relatorios
-- 1. relatório de atendimentos por especialidade
PRINT 'Atendimentos por especialidade (hoje):';
SELECT 
    e.Nome AS Especialidade,
    COUNT(*) AS TotalAtendimentos,
    AVG(DATEDIFF(MINUTE, a.DataHoraChegada, ISNULL(a.DataHoraFinalizacao, GETDATE()))) AS TempoMedioMin
FROM 
    dbo.Atendimentos a
    INNER JOIN dbo.Triagens t ON a.Id = t.AtendimentoId
    INNER JOIN dbo.Especialidades e ON t.EspecialidadeId = e.Id
WHERE 
    CAST(a.DataHoraChegada AS DATE) = CAST(GETDATE() AS DATE)
GROUP BY 
    e.Nome
ORDER BY 
    TotalAtendimentos DESC;
GO

-- 2. pacientes com maior frequencia de atendimentos
PRINT 'Pacientes mais frequentes:';
SELECT TOP 10
    p.Nome AS Paciente,
    COUNT(*) AS TotalAtendimentos,
    MAX(a.DataHoraChegada) AS UltimoAtendimento
FROM 
    dbo.Atendimentos a
    INNER JOIN dbo.Pacientes p ON a.PacienteId = p.Id
GROUP BY 
    p.Id, p.Nome
ORDER BY 
    TotalAtendimentos DESC;
GO

-- 3. tempo médio de espera por hora do dia
PRINT 'Tempo médio de espera por hora:';
SELECT 
    DATEPART(HOUR, DataHoraChegada) AS Hora,
    COUNT(*) AS TotalAtendimentos,
    AVG(DATEDIFF(MINUTE, DataHoraChegada, ISNULL(DataHoraChamada, GETDATE()))) AS TempoMedioEsperaMin
FROM 
    dbo.Atendimentos
WHERE 
    CAST(DataHoraChegada AS DATE) = CAST(GETDATE() AS DATE)
GROUP BY 
    DATEPART(HOUR, DataHoraChegada)
ORDER BY 
    Hora;
GO