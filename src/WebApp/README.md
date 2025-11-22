# Sistema de Atendimento Médico - Frontend

Frontend React para o Sistema de Atendimento Médico com gestão de fila e triagem.
Processo seletivo para empresa aplicativo.js

## Tecnologias Utilizadas

- **React 18** - Biblioteca JavaScript para interfaces
- **React Router DOM** - Navegação entre páginas
- **Axios** - Cliente HTTP para comunicação com API
- **Tailwind CSS** - Framework CSS para estilização
- **React Hook Form** - Gerenciamento de formulários

## Funcionalidades

### 1. Fila de Atendimento
- Visualização em tempo real da fila
- Gerar senha para paciente
- Chamar próximo paciente
- Estatísticas de atendimento

### 2. Cadastro de Pacientes
- Listagem de pacientes
- Cadastro de novos pacientes
- Edição de dados
- Desativação (soft delete)
- Busca por nome

### 3. Triagem
- Registro de sinais vitais
- Classificação por especialidade
- Cálculo automático de IMC
- Registro de sintomas e observações

## Instalação

### Pré-requisitos
- Node.js 16+ instalado
- Backend da API rodando (porta 5290)

### Passos

1. Instalar dependências:
```bash
npm install
```

2. Configurar variáveis de ambiente:
```bash
# Arquivo .env já configurado
REACT_APP_API_URL=http://localhost:5290/api
```

3. Iniciar aplicação:
```bash
npm start
```

A aplicação estará disponível em: http://localhost:3000

## Scripts Disponíveis

- `npm start` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm test` - Executa os testes
- `npm run eject` - Ejeta as configurações (irreversível)

## Estrutura de Pastas

```
src/
├── components/         # Componentes reutilizáveis
│   └── Layout.js      # Layout principal
├── contexts/          # Contextos React
│   └── ToastContext.js # Sistema de notificações
├── pages/             # Páginas da aplicação
│   ├── FilaAtendimento.js
│   ├── Pacientes.js
│   └── Triagem.js
├── services/          # Serviços de API
│   └── api.js
├── App.js            # Componente principal
├── index.js          # Ponto de entrada
└── index.css         # Estilos globais
```

## Integração com Backend

O frontend se comunica com a API REST através do arquivo `services/api.js`:

- **Base URL**: http://localhost:5290/api
- **Timeout**: 10 segundos
- **Headers**: Content-Type: application/json

### Endpoints utilizados:

**Pacientes**
- GET /pacientes - Lista todos
- GET /pacientes/{id} - Busca por ID
- GET /pacientes/buscar?nome={nome} - Busca por nome
- POST /pacientes - Cadastra novo
- PUT /pacientes/{id} - Atualiza
- DELETE /pacientes/{id} - Desativa

**Atendimentos**
- GET /atendimentos/fila - Fila atual
- POST /atendimentos - Cria atendimento
- POST /atendimentos/chamar-proximo - Chama próximo
- PATCH /atendimentos/{id}/finalizar - Finaliza

**Triagens**
- POST /triagens - Registra triagem
- GET /triagens/atendimento/{id} - Busca por atendimento

**Especialidades**
- GET /especialidades - Lista todas ativas

## Responsividade

O layout é responsivo e se adapta a diferentes tamanhos de tela:
- **Desktop**: Layout completo com todas as funcionalidades
- **Tablet**: Layout adaptado com navegação simplificada
- **Mobile**: Interface otimizada para telas pequenas

## Tratamento de Erros

Todas as requisições à API possuem tratamento de erros com feedback visual através do sistema de notificações (Toast).

## Build para Produção

Para criar uma versão otimizada para produção:

```bash
npm run build
```

Os arquivos serão gerados na pasta `build/` e estarão prontos para deploy.

## Observações

- A aplicação atualiza a fila automaticamente a cada 10 segundos
- Todos os formulários possuem validação client-side
- O sistema de notificações exibe mensagens por 4 segundos
- As modais são acessíveis e podem ser fechadas com ESC

## Suporte

Para dúvidas ou problemas:
- Email: brunoricksp@gmail.com
- Whatsapp: 19988084488
- Documentação da API: http://localhost:5290/swagger