# Aprova Já: como acessar

Abra `idez.html` no navegador (Chrome, Edge ou Firefox).

## Login único
Todo mundo entra pela mesma tela: `login.html` (botão "Login" da página inicial).
O sistema reconhece o perfil pelo e-mail e senha e leva cada um ao seu painel:
- **Administrador** vai para `painel-adm.html`.
- **Professor** vai para `painel-professor.html`.
- **Aluno** vai para `questionario.html` no primeiro acesso e depois para `painel-aluno.html`.

Aluno cria a própria conta em *Criar conta*. Professor e administrador não têm cadastro aberto: a conta é criada
pelo administrador, em **Usuários**. Quem tentar abrir o painel de outro perfil volta para o próprio painel.

## Primeiro acesso do administrador primário
- E-mail: `admin@aprovaja.com.br`
- Senha provisória: `AprovaJa@2026` (o sistema obriga a trocar logo no primeiro login)

## Fluxo da equipe
1. O administrador cadastra o professor em **Usuários** e recebe uma senha provisória.
2. O professor entra em `login.html` com ela e é obrigado a criar a própria senha.
3. Esqueceu a senha? O administrador gera outra em **Permissões → Reset de senha**.
4. Só o administrador primário cria, bloqueia ou exclui outros administradores.

## Visual
Todos os perfis usam a mesma paleta: azul, laranja, amarelo e branco.

## Regras de segurança já implementadas (no navegador)
- Senha: mínimo 8 caracteres, com letras e números; guardada com hash PBKDF2 + sal (nunca em texto).
- Bloqueio por 5 minutos após 5 tentativas erradas; mensagem de erro igual para qualquer falha.
- Cada perfil só abre as próprias páginas.
- Sessão: 8 horas para a equipe, 30 dias para o aluno.

## Importante: isto é uma demonstração
Os dados ficam no `localStorage` de cada navegador. Um aluno cadastrado em um computador não existe em outro,
e quem abre o console do navegador consegue mexer nos dados. Para valer de verdade (publicar o site),
a autenticação precisa ir para um servidor: hash com bcrypt/argon2 no back-end, cookie de sessão HttpOnly,
checagem de permissão em cada requisição, recuperação de senha por e-mail e bloqueio de tentativas no servidor.

## Questionário de entrada e plano de estudos (aluno)
No primeiro acesso, o aluno é levado a `questionario.html`, em duas etapas:
1. **Sobre o aluno**: vestibular (este ano ou próximo), se já está estudando, horas por dia, foco (ENEM, Fuvest ou Unicamp),
   objetivo (passar este ano ou treineiro) e horário de estudo.
2. **Diagnóstico**: uma pergunta de cada matéria (9 no total), com a opção "Não sei".

Ao terminar, o aluno vê a mensagem de feedback (acertos, pontos fortes e matérias a reforçar) e vai para o painel principal,
que mostra o **plano de estudos**, as **prioridades da semana** e o **cronograma semanal** (com o bloco "Hoje").
O plano dá mais tempo às matérias em que o aluno errou e ajusta o peso pelo vestibular de foco.
Enquanto não responder o questionário, o aluno não acessa as outras páginas. Para refazer: botão no painel.
A lógica do plano está em `plano.js`; as perguntas, em `questionario.js`.

## Banco de questões (Conteúdos)
Em **Conteúdos**, a aba **Banco de questões** traz 39 questões de treino (nas 9 matérias do plano), com filtros de matéria,
conteúdo, estilo de prova e dificuldade; alternativas A a E, correção com explicação, salvar e relatar problema.
Os blocos de estudo do cronograma (painel) abrem o banco já filtrado no conteúdo do dia.
As questões ficam em `questoes-dados.js` (fácil de editar ou ampliar); a lógica está em `banco.js`.
São questões elaboradas para treino, no estilo de cada vestibular, e não provas oficiais.
