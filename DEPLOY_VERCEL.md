# Deploy na Vercel — Opção A (frontend em modo offline)

Esta branch (`deploy/vercel-opcao-a`) publica **apenas o frontend** do Conecta
Inclusão na Vercel, em **modo offline**: a aplicação funciona por inteiro
(login, feed, vagas, campanhas, moderação) usando o `localStorage` do navegador,
sem precisar de backend nem banco de dados.

É o caminho ideal para um **protótipo / demonstração**: deploy em minutos,
sem custo de infraestrutura e sem configuração de servidor.

> Limitação esperada: os dados ficam no navegador de cada pessoa — não são
> compartilhados entre usuários nem persistidos num servidor. Para dados reais
> e compartilhados, use a Opção B (API serverless + PostgreSQL gerenciado).

## Como o modo offline é ativado

O frontend decide o backend em tempo de build pela variável `VITE_API_URL`
(ver `src/api/client.ts` → `apiEnabled()`):

- **`VITE_API_URL` ausente** → modo offline (localStorage). ← **Opção A**
- `VITE_API_URL` definida → fala com a API real.

Portanto, para esta opção, **NÃO** defina `VITE_API_URL` na Vercel.

## Passo a passo

1. Acesse https://vercel.com e faça login com o GitHub.
2. **Add New… → Project** e importe o repositório `JuanRods/Conecta`.
3. Em **Branch**, selecione `deploy/vercel-opcao-a` (ou faça o merge desta
   branch na `main` e use a `main`).
4. A Vercel detecta o framework **Vite** automaticamente. As configurações já
   vêm do `vercel.json` deste projeto:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Rewrites: todas as rotas → `index.html` (necessário para o React Router).
5. **Environment Variables**: deixe vazio (não adicione `VITE_API_URL`).
6. Clique em **Deploy**. Ao final, a Vercel fornece a URL pública.

## Contas de demonstração

O app semeia um administrador e, no primeiro uso, popula vagas/campanhas de
exemplo no navegador:

- Admin: `admin@conectainclusao.org` / `Admin@123`
- Candidato/empresa: crie uma conta nova pela própria tela de cadastro.

## Verificação local do build (opcional)

```bash
npm ci
npm run build      # gera dist/
npm run preview    # serve o build em http://localhost:5173
```
