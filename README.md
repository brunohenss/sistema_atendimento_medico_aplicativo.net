# Sistema de Atendimento Médico
# DOCUMENTAÇÃO

Sistema completo para gerenciamento de fila de atendimento médico com triagem.

## Descrição do Projeto

Sistema web para gerenciamento de atendimentos médicos que controla o fluxo completo desde o cadastro do paciente na recepção até a finalização da consulta, incluindo processo de triagem de enfermagem e direcionamento por especialidade médica.

## Arquitetura e Padrões

O projeto implementa Clean Architecture com separação em camadas:

- **Core.Domain**: Entidades de negócio, interfaces de repositórios
- **Core.Application**: DTOs, interfaces de serviços, regras de negócio
- **Infrastructure.Persistence**: Implementação de repositórios, contexto EF Core
- **WebAPI**: Controllers, configurações, injeção de dependências

### Padrões Implementados

- Repository Pattern
- Dependency Injection
- Service Layer
- DTO (Data Transfer Objects)
- SOLID Principles
- Domain-Driven Design (DDD)

## Tecnologias Utilizadas

### Backend

- **.NET 8.0**: Framework principal
- **ASP.NET Core Web API**: Construção da API REST
- **Entity Framework Core 8.0**: ORM para acesso a dados
- **SQL Server 2022**: Banco de dados relacional
- **Fluent API**: Configuração avançada do EF Core
- **Code First Migrations**: Gerenciamento de schema do banco

### Frontend

- **React 18.2.0**: Biblioteca para construção de interfaces
- **React Router DOM 6.20.0**: Roteamento SPA
- **Axios 1.6.2**: Cliente HTTP
- **React Hook Form 7.48.2**: Gerenciamento de formulários
- **Tailwind CSS 3.3.6**: Framework CSS utilitário
- **React Icons 4.12.0**: Biblioteca de ícones
- **React Toastify 9.1.3**: Notificações
- **date-fns 2.30.0**: Manipulação de datas

### Ferramentas de Desenvolvimento

- **Docker**: Containerização do SQL Server
- **Swagger/OpenAPI**: Documentação interativa da API
- **FluentValidation 11.3.0**: Validação de dados

## Estrutura do Banco de Dados

### Tabelas Principais

**Pacientes**
- Armazena dados cadastrais dos pacientes
- Campos: Id, Nome, Telefone, Sexo, Email, Ativo, DataCriacao

**Especialidades**
- Lista de especialidades médicas disponíveis
- Campos: Id, Nome, Descricao, Ativo

**Atendimentos**
- Controla a fila de atendimento
- Campos: Id, NumeroSequencial, PacienteId, DataHoraChegada, Status, DataHoraChamada, DataHoraFinalizacao

**Triagens**
- Dados coletados durante triagem de enfermagem
- Campos: Id, AtendimentoId, Sintomas, PressaoArterial, Peso, Altura, EspecialidadeId, DataHoraTriagem, Observacoes

### Relacionamentos

- Paciente 1:N Atendimento
- Atendimento 1:1 Triagem
- Especialidade 1:N Triagem

### Índices

Implementados para otimização de consultas frequentes:
- IX_Pacientes_Nome, IX_Pacientes_Email
- IX_Atendimentos_Status, IX_Atendimentos_DataChegada, IX_Atendimentos_PacienteId
- IX_Triagens_AtendimentoId (UNIQUE), IX_Triagens_EspecialidadeId

## API REST - Endpoints

### Pacientes

```
GET    /api/pacientes              - Lista pacientes ativos
GET    /api/pacientes/{id}          - Busca paciente por ID
GET    /api/pacientes/buscar?nome=  - Busca por nome
GET    /api/pacientes/{id}/historico - Histórico completo do paciente
POST   /api/pacientes              - Cadastra novo paciente
PUT    /api/pacientes/{id}          - Atualiza dados do paciente
DELETE /api/pacientes/{id}          - Desativa paciente (soft delete)
PATCH  /api/pacientes/{id}/reativar - Reativa paciente
```

### Atendimentos

```
GET    /api/atendimentos/{id}                  - Busca atendimento por ID
GET    /api/atendimentos/fila                  - Visualiza fila completa
GET    /api/atendimentos/paciente/{pacienteId} - Atendimentos do paciente
GET    /api/atendimentos/status/{status}       - Filtra por status
POST   /api/atendimentos                       - Cria atendimento (gera senha)
POST   /api/atendimentos/chamar-proximo        - Chama próximo da fila
PATCH  /api/atendimentos/{id}/finalizar        - Finaliza atendimento
```

### Triagens

```
GET    /api/triagens/{id}                      - Busca triagem por ID
GET    /api/triagens/atendimento/{atendimentoId} - Triagem do atendimento
GET    /api/triagens/especialidade/{especialidadeId} - Triagens por especialidade
POST   /api/triagens                           - Registra triagem
```

### Especialidades

```
GET    /api/especialidades       - Lista especialidades ativas
GET    /api/especialidades/{id}  - Busca especialidade por ID
POST   /api/especialidades       - Cadastra especialidade
DELETE /api/especialidades/{id}  - Desativa especialidade
```

## Requisitos Funcionais Implementados

1. Cadastro completo de pacientes com validação de dados
2. Geração automática de número sequencial para fila
3. Registro de triagem com medições vitais e direcionamento
4. Chamada de pacientes por ordem de chegada
5. Controle de status do atendimento (Aguardando, EmTriagem, EmAtendimento, Finalizado)
6. Cálculo automático de IMC e tempo de espera
7. Busca e filtragem de dados
8. Histórico completo de atendimentos por paciente

## Requisitos Não Funcionais Implementados

1. Interface responsiva utilizando Tailwind CSS
2. Validação de dados em múltiplas camadas (DTOs, Entidades)
3. Tratamento de erros com mensagens descritivas
4. Logging estruturado de operações
5. Documentação automática via Swagger
6. CORS configurado para frontend
7. Retry policy para conexão com banco de dados
8. Soft delete para preservação de dados históricos

## Configuração e Execução

### Pré-requisitos

- .NET SDK 8.0 ou superior
- Docker (para SQL Server)
- Node.js 18 ou superior (para frontend)

### Banco de Dados

Iniciar SQL Server via Docker:

```bash
docker-compose up -d
```

String de conexão padrão:
```
Server=localhost,1433;Database=AtendimentoMedicoDB;User Id=sa;Password=p@ssW0rd;TrustServerCertificate=True
```

### Backend

```bash
cd src/WebAPI

# Restaurar dependências
dotnet restore

# Aplicar migrations (cria banco e tabelas) - PS: Já incluí as migrations no projeto
# Não sendo necessário esse passo para os testes
dotnet ef database update --project ../Infrastructure/Persistence

# Executar API
dotnet run
```

API disponível em: `https://localhost:7106` ou `http://localhost:5290`

Swagger UI: `https://localhost:7106/swagger`

### Frontend

```bash
cd src/WebApp

# Instalar dependências
npm install

# Executar aplicação
npm start
```

Aplicação disponível em: `http://localhost:3000`

## Scripts SQL

Localizados em `/scripts`:

- **01-ddl-create-database.sql**: Criação de estrutura (tabelas, índices, views, stored procedures, functions)
- **02-dml-manipulacao-dados.sql**: Exemplos de inserção, consulta, atualização e exclusão

Podem ser executados diretamente no SQL Server Management Studio ou Azure Data Studio como alternativa às migrations do EF Core.

## Documentação Adicional

### Diagramas UML

Inclusos na documentação do projeto:
- Diagrama de Caso de Uso
- Diagrama de Classes
- DFD (Diagrama de Fluxo de Dados)

### Validações Implementadas

**Paciente:**
- Nome: 2-200 caracteres, obrigatório
- Telefone: formato válido, obrigatório
- Sexo: 'M' ou 'F', obrigatório
- Email: formato válido, único, obrigatório

**Triagem:**
- Sintomas: 5-1000 caracteres
- Pressão arterial: formato "120/80"
- Peso: 1-500 kg
- Altura: 0.3-2.5 metros
- Especialidade: obrigatória

**Atendimento:**
- PacienteId: deve existir e estar ativo
- Status: apenas valores válidos (Aguardando, EmTriagem, EmAtendimento, Finalizado)

## Segurança

- Validação de entrada em todas as camadas
- Proteção contra SQL Injection via EF Core parametrizado
- CORS restrito a origens conhecidas
- Validação de tipos e ranges
- Tratamento de exceções centralizado

## Performance

- Eager Loading com Include/ThenInclude para reduzir queries
- Índices estratégicos nas colunas mais consultadas
- Paginação implícita em listagens
- Projeção de DTOs para retornar apenas dados necessários
- Connection pooling do EF Core

## Testes

Estrutura preparada para:
- Testes unitários de serviços
- Testes de integração de repositórios
- Testes de API com controllers

## Observações de Implementação

1. **Soft Delete**: Pacientes e especialidades são desativados logicamente, não excluídos fisicamente
2. **Auditoria**: Todas as entidades possuem campos de data de criação
3. **Número Sequencial**: Reinicia diariamente para melhor organização
4. **Relacionamento 1:1**: Triagem é única por atendimento
5. **Validação Cascata**: Validação em DTO, Entidade e regra de negócio
6. **IMC Automático**: Calculado em tempo real na entidade Triagem

## Estrutura de Pastas

```
AtendimentoMedico/
├── src/
│   ├── Core/
│   │   ├── Domain/               # Entidades, interfaces de repositório
│   │   └── Application/          # DTOs, interfaces de serviço, serviços
│   ├── Infrastructure/
│   │   └── Persistence/          # DbContext, repositórios, migrations
│   ├── WebAPI/                   # Controllers, Program.cs, configurações
│   └── WebApp/                   # Frontend React
├── scripts/
│   ├── 01-ddl-create-database.sql
│   └── 02-dml-manipulacao-dados.sql
├── docker-compose.yml
└── AtendimentoMedico.sln
```

## Versionamento

- **.NET**: 8.0
- **Entity Framework Core**: 8.0.0
- **React**: 18.2.0
- **SQL Server**: 2022

## Autor

Desenvolvido por Bruno Henrique.

## Licença

Projeto desenvolvido para fins de avaliação técnica.

## Contato

- WhatsApp: 19 98808-4488
- Email técnico: brunoricksp@gmail.com
