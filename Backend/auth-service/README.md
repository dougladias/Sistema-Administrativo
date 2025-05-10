# Auth Service

Este é um microsserviço de autenticação para o sistema de gestão. Ele fornece funcionalidades de autenticação e autorização para todos os outros microsserviços da plataforma.

## Funcionalidades

- Registro de usuários
- Login de usuários
- Validação de tokens
- Refresh tokens
- Gerenciamento de permissões e papéis

## Tecnologias Utilizadas

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT para autenticação
- Bcrypt para hashing de senhas
- Winston para logs
- Cors, Helmet e Rate Limiting para segurança

## Configuração e Execução

### Pré-requisitos

- Node.js v14 ou superior
- MongoDB

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis: