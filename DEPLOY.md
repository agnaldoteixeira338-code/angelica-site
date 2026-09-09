# Como colocar o site no ar (Neon + Render + Cloudinary)

**Status atual:** Neon ✅ e Cloudinary ✅ já configurados e testados. Falta
só publicar no Render (passos 3 a 5 abaixo).

Arquitetura usada, e por quê:

| Peça | Serviço | Função | Cartão? |
|---|---|---|---|
| Dados dos produtos | **Neon** (Postgres) | banco de dados de verdade, com backups | Não |
| Servidor | **Render** (Node/Express) | única parte que fala com o banco — o navegador nunca vê a senha dele | Não* |
| Fotos | **Cloudinary** | guarda as imagens | Não |
| Código | **GitHub** | onde o Render busca o código pra publicar | Não |

\* *plano gratuito escolhido conscientemente — ver observação sobre "sono" abaixo.*

A senha de 4 números nunca é guardada em texto puro — vira um hash (uma
transformação de mão única) antes de qualquer coisa ir pro banco.

---

## 1. Neon (banco de dados) — ✅ já feito

- Projeto criado, tabelas criadas (`produtos`, `settings`, `login_attempts`)
- Senha temporária configurada: **0000** (a Angelica troca pela dela em Configurações → "Trocar senha de 4 números", assim que entrar pela primeira vez)

## 2. Cloudinary (fotos) — ✅ já feito

- Cloud name e preset de upload testados e funcionando (upload real confirmado)

## 3. Colocar o código no GitHub

O Render publica direto de um repositório do GitHub. Passos:

1. Acesse [github.com](https://github.com) e crie uma conta gratuita, se ainda não tiver.
2. Clique em **New repository** (botão verde, ou "+" no canto superior).
3. Nome: `angelica-site` (ou o que preferir). Deixe como **Private** (privado) — não precisa ser público.
4. **Não** marque nenhuma opção de criar README/gitignore (o projeto já tem).
5. Clique em **Create repository**.
6. Na tela seguinte, copie a URL do repositório (algo como `https://github.com/seu-usuario/angelica-site.git`).

Me manda essa URL que eu preparo o código pra subir. Depois só falta você
autorizar o envio (login do GitHub) — geralmente abre uma janela pedindo
pra confirmar no navegador.

## 4. Criar o serviço no Render

1. Acesse [render.com](https://render.com) e crie uma conta gratuita (dá pra entrar com GitHub).
2. Clique em **New** → **Web Service**.
3. Conecte sua conta do GitHub e escolha o repositório `angelica-site`.
4. Configure:
   - **Name**: `angelica-site`
   - **Region**: escolha uma perto do Brasil (ex: Ohio, se não tiver São Paulo)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
5. Antes de criar, role até **"Environment Variables"** e adicione:
   - `DATABASE_URL` = (a connection string do Neon, do painel do Neon → Connect)
   - `JWT_SECRET` = (vou gerar um valor forte pra você quando chegarmos nessa etapa)
6. Clique em **Create Web Service**.

O Render vai instalar tudo e publicar — leva alguns minutos na primeira vez.

## 5. Testar

1. O Render mostra um link tipo `https://angelica-site.onrender.com` — abra ele.
2. Clique na engrenagem, digite **0000** (senha temporária).
3. Vá em Configurações → troque a senha pela definitiva da Angelica.
4. Cadastre um produto de teste com foto.

---

## Sobre o plano gratuito do Render ("sono")

O plano grátis do Render **desliga o servidor depois de 15 minutos sem
visitas**, e demora de 30 a 60 segundos pra "acordar" na próxima pessoa
que abrir o site (isso afeta o carregamento do catálogo, não só a
edição). Foi uma escolha consciente, por familiaridade com a plataforma.

Se um dia isso incomodar, as opções são:
- Migrar para o plano pago do Render (não desliga, tem custo mensal)
- Usar um serviço externo gratuito pra "pingar" o site a cada 10 minutos e evitar que ele durma (existem vários gratuitos, tipo UptimeRobot)

## Sobre segurança e durabilidade

- A senha nunca é enviada nem guardada em texto puro (hash com salt, `scrypt`)
- Toda alteração (produto, preço, configurações) exige um token de sessão válido — visitantes comuns só conseguem ler, nunca escrever
- O banco (Neon) faz backups automáticos e permite restaurar dados de dias anteriores
- Tentativas de senha errada são bloqueadas depois de 5 erros seguidos (protege contra tentativa de adivinhar a senha)
- `DATABASE_URL` e `JWT_SECRET` só existem como variáveis de ambiente no Render — nunca aparecem no código do site
- O código do servidor (rotas, conexão com banco) nunca fica acessível publicamente — só a pasta `public/` é servida

## Para atualizar o site depois

Sempre que um arquivo for alterado, é só enviar pro GitHub de novo — o
Render publica automaticamente a cada atualização no repositório.
