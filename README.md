# github-oauth-spa

fluxo de comandos:

back:

GITHUB_CLIENT_SECRET=SUA_SECRET node server.js

front:

npx http-server -p 8080 -c-1

possivel problema se o back/front parar na hora de rodar: A porta já está em uso:

lsof -ti:3001 (PARA O BACK)
lsof -ti:8080 (PARA O FRONT)
kill -9 PID


Assim mata o processo da porta e depois é só rodar novamente que vai dar certo.