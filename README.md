# 🎮 Retroshop - Marketplace de Jogos Físicos

![Status do Projeto: Em Desenvolvimento](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)

Um marketplace C2C (Consumer-to-Consumer) construído em Node.js e MongoDB, focado na compra e venda de jogos de mídia física para consoles. O projeto integra-se com a API da IGDB para fornecer informações e capas de jogos de forma dinâmica.

---

### Tabela de Conteúdos
1. [Sobre o Projeto](#sobre-o-projeto)
2. [Funcionalidades Principais](#funcionalidades-principais)
3. [Demonstração](#demonstração)
4. [Tecnologias Utilizadas](#tecnologias-utilizadas)
5. [Como Executar o Projeto](#como-executar-o-projeto)
    - [Pré-requisitos](#pré-requisitos)
    - [Instalação](#instalação)
6. [Estrutura de Pastas](#estrutura-de-pastas)

---

### Sobre o Projeto

O **Retroshop** nasceu da ideia de criar uma plataforma simples e direta para que gamers possam vender os jogos que já terminaram e comprar novos títulos de outros jogadores, fomentando uma comunidade de troca e venda. A aplicação não possui um gateway de pagamento integrado; a negociação e transação são feitas diretamente entre o comprador e o vendedor através das informações de contato.

---

### Funcionalidades Principais

-   👤 **Autenticação de Usuários**: Sistema completo de registro e login com senhas criptografadas.
-   📝 **Anúncio de Jogos**: Um formulário intuitivo onde o usuário primeiro seleciona a plataforma e depois busca pelo jogo (usando dados da IGDB) para anunciar.
-   🔍 **Busca e Navegação**: Pesquisa de jogos por nome e navegação por plataformas.
-   🛍️ **Página de Produto**: Visualização detalhada de um jogo com a lista de todos os vendedores ativos, ordenados pelo menor preço.
-   🤝 **Contato Direto**: O comprador pode ver as informações de contato do vendedor (nome, cidade, estado, WhatsApp) para combinar a compra.
-   ⚙️ **Gerenciamento de Perfil**: O usuário pode editar suas informações de contato e nome.
-   🕹️ **Gerenciamento de Anúncios**: Uma página "Meus Anúncios" onde o vendedor pode ver, ativar, desativar ou excluir seus anúncios.

---

### Demonstração

`em breve...`

---

### Tecnologias Utilizadas

-   **Backend**: Node.js, Express.js
-   **Banco de Dados**: MongoDB (com o driver oficial `mongodb`)
-   **View Engine**: EJS (Embedded JavaScript templates)
-   **Estilização**: Tailwind CSS
-   **Autenticação**: Express Session, Bcrypt.js
-   **API Externa**: IGDB API para dados de jogos.

---

### Como Executar o Projeto

Siga os passos abaixo para executar o projeto em sua máquina local.

#### Pré-requisitos

Você vai precisar ter as seguintes ferramentas instaladas:
-   [Node.js](https://nodejs.org/en/) (versão 22 ou superior)
-   [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
-   [MongoDB](https://www.mongodb.com/try/download/community) (ou uma conta no MongoDB Atlas)

#### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/kkauaon/retroshop.git
    cd retroshop
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo chamado `.env` na raiz do projeto e adicione as seguintes variáveis. Use o arquivo `.env.example` como base.

    ```ini
    # .env

    # Porta de execução do servidor
    PORT=3000

    # String de conexão do seu banco de dados MongoDB
    URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/retroshop?retryWrites=true&w=majority

    # Credenciais da API da Twitch/IGDB
    IGDB_CLIENT_ID=seu_client_id_da_igdb
    IGDB_SECRET=seu_client_secret_da_igdb

    # Chave secreta para a sessão do Express
    SESSION_SECRET=uma_chave_secreta_longa_e_aleatoria
    ```

3.1. **Configurar as credenciais da API do IGDB:**
    Para o marketplace funcionar corretamente, execute apenas uma vez no terminal este script para gerar os arquivos necessários dos consoles.
    ```bash
    npm run igdb
    ```

4.  **Execute a aplicação:**
    Inicie o script de compilação do Tailwind e o script de servidor:
    ```bash
    npx nodemon
    ```
    Em outro terminal:
    ```bash
    npm run tailwind
    ```

5.  Acesse `http://localhost:3000` (ou a porta que você configurar) no seu navegador.

---

### Estrutura de Pastas

A estrutura do projeto está organizada da seguinte forma:

```
retroshop/
├── database/                  # Data Access Objects (lógica do banco de dados)
│   ├── listingsDAO.js
│   ├── usersDAO.js
│   └── igdb.js
├── public/               # Arquivos estáticos (CSS, imagens, JS do cliente)
├── routes/               # Definições de rotas do Express
├── views/                # Arquivos EJS (as páginas do site)
│   ├── partials/         # Componentes reutilizáveis (header, footer)
│   └── ...
├── .env                  # Variáveis de ambiente (não versionado)
├── app.js                # Arquivo principal do servidor Express
└── package.json
```
