/* =====================================================
   Aprova Já: autenticação (VERSÃO DE DEMONSTRAÇÃO)
   Tudo fica no localStorage do navegador. Serve para
   testar fluxos e telas; em produção, isto precisa de
   um servidor (ver LEIA-ME.md).
===================================================== */
(function () {
    'use strict';

    var K = { users: 'aj_usuarios', sessao: 'aj_sessao', tent: 'aj_tentativas' };
    var LOGINS  = { aluno: 'login.html', professor: 'login.html', adm: 'login.html' };   // uma única tela de login para todos
    var PAINEIS = { aluno: 'painel-aluno.html', professor: 'painel-professor.html', adm: 'painel-adm.html' };
    var DURACAO = { aluno: 30 * 24 * 36e5, professor: 8 * 36e5, adm: 8 * 36e5 };   // sessão: aluno 30 dias, equipe 8 h
    var MAX_TENTATIVAS = 5, BLOQUEIO_MS = 5 * 60e3;

    // Administrador primário criado na primeira abertura. A senha é provisória e é trocada no 1º acesso.
    var ADMIN_PRIMARIO = { nome: 'Administrador Principal', email: 'admin@aprovaja.com.br', senha: 'AprovaJa@2026' };

    function $(id) { return document.getElementById(id); }
    function ler(k, p) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : p; } catch (e) { return p; } }
    function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
    function norm(e) { return String(e || '').trim().toLowerCase(); }
    function usuarios() { return ler(K.users, []); }
    function ok(extra) { var o = { ok: true }; for (var k in extra) o[k] = extra[k]; return o; }
    function erro(msg) { return { ok: false, erro: msg }; }

    /* ---------- senha: regras, hash e geração ---------- */
    function validarSenha(s) {
        s = String(s || '');
        if (s.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
        if (!/[A-Za-z]/.test(s) || !/[0-9]/.test(s)) return 'Use letras e números na senha.';
        return '';
    }

    function hex(buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    }
    function novoSal() { return hex(crypto.getRandomValues(new Uint8Array(16))); }

    function hash(senha, sal) {
        if (window.crypto && crypto.subtle) {
            var enc = new TextEncoder();
            return crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits'])
                .then(function (chave) {
                    return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(sal), iterations: 100000, hash: 'SHA-256' }, chave, 256);
                }).then(hex);
        }
        var h = 5381, s = sal + senha;                       // alternativa fraca, só se o navegador não tiver crypto.subtle
        for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
        return Promise.resolve('f' + h);
    }

    function gerarSenhaProvisoria() {
        var alfa = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789', s;
        do {
            var r = crypto.getRandomValues(new Uint8Array(10));
            s = Array.prototype.map.call(r, function (n) { return alfa[n % alfa.length]; }).join('');
        } while (validarSenha(s));
        return s;
    }

    /* ---------- banco de usuários ---------- */
    function publico(u) {
        return { nome: u.nome, email: u.email, papel: u.papel, primario: !!u.primario, trocar: !!u.trocar,
                 ativo: u.ativo !== false, criado: u.criado, extra: u.extra || {} };
    }

    function montarUsuario(d, senha, trocar) {
        var sal = novoSal();
        return hash(senha, sal).then(function (h) {
            return { nome: d.nome, email: norm(d.email), papel: d.papel, hash: h, salt: sal, trocar: !!trocar,
                     ativo: true, primario: !!d.primario, criado: new Date().toISOString(), extra: d.extra || {} };
        });
    }

    var pronto = (function semear() {
        if (usuarios().some(function (u) { return u.primario; })) return Promise.resolve();
        return montarUsuario({ nome: ADMIN_PRIMARIO.nome, email: ADMIN_PRIMARIO.email, papel: 'adm', primario: true },
                             ADMIN_PRIMARIO.senha, true).then(function (u) {
            var lista = usuarios(); lista.push(u); gravar(K.users, lista);
        });
    })();

    /* ---------- sessão ---------- */
    function sessao() {
        var s = ler(K.sessao, null);
        if (!s || s.exp < Date.now()) return null;
        var u = usuarios().filter(function (x) { return x.email === s.email; })[0];
        return (u && u.ativo !== false) ? publico(u) : null;
    }
    function sair() { try { localStorage.removeItem(K.sessao); } catch (e) {} }
    function abrirSessao(u) { gravar(K.sessao, { email: u.email, papel: u.papel, exp: Date.now() + DURACAO[u.papel] }); }

    function destinoInicial(u) {
        if (u.trocar) return 'trocar-senha.html';
        if (u.papel === 'aluno' && !(u.extra && u.extra.questionario)) return 'questionario.html';   // 1º acesso: monta o plano de estudos
        return PAINEIS[u.papel];
    }

    /* ---------- login ---------- */
    function login(email, senha) {
        email = norm(email);
        var t = ler(K.tent, {}), reg = t[email] || { n: 0, ate: 0 };
        if (reg.ate > Date.now()) {
            return Promise.resolve(erro('Muitas tentativas. Tente de novo em ' + Math.ceil((reg.ate - Date.now()) / 60000) + ' min.'));
        }
        function falha() {
            reg.n++;
            if (reg.n >= MAX_TENTATIVAS) { reg.n = 0; reg.ate = Date.now() + BLOQUEIO_MS; }
            t[email] = reg; gravar(K.tent, t);
            return erro('E-mail ou senha incorretos.');          // mesma mensagem para qualquer falha
        }
        return pronto.then(function () {
            var u = usuarios().filter(function (x) { return x.email === email; })[0];
            if (!u) return falha();
            return hash(senha, u.salt).then(function (h) {
                if (h !== u.hash) return falha();
                if (u.ativo === false) return erro('Conta desativada. Fale com o administrador.');
                delete t[email]; gravar(K.tent, t);
                abrirSessao(u);
                return ok({ usuario: publico(u), destino: destinoInicial(u) });
            });
        });
    }

    /* ---------- cadastro do aluno (autoatendimento) ---------- */
    function registrarAluno(d) {
        var email = norm(d.email), msg = validarSenha(d.senha);
        if (!String(d.nome || '').trim()) return Promise.resolve(erro('Informe seu nome.'));
        if (msg) return Promise.resolve(erro(msg));
        return pronto.then(function () {
            if (usuarios().some(function (u) { return u.email === email; })) return erro('Este e-mail já está cadastrado.');
            return montarUsuario({ nome: d.nome.trim(), email: email, papel: 'aluno', extra: d.extra }, d.senha, false).then(function (u) {
                var lista = usuarios(); lista.push(u); gravar(K.users, lista);
                abrirSessao(u);
                return ok({ destino: destinoInicial(u) });
            });
        });
    }

    /* ---------- trocar a própria senha ---------- */
    function mudarSenha(atual, nova) {
        var s = sessao();
        if (!s) return Promise.resolve(erro('Sessão expirada. Entre novamente.'));
        var msg = validarSenha(nova);
        if (msg) return Promise.resolve(erro(msg));
        if (nova === atual) return Promise.resolve(erro('A nova senha precisa ser diferente da atual.'));
        var lista = usuarios(), u = lista.filter(function (x) { return x.email === s.email; })[0];
        return hash(atual, u.salt).then(function (h) {
            if (h !== u.hash) return erro('A senha atual está incorreta.');
            var sal = novoSal();
            return hash(nova, sal).then(function (h2) {
                u.salt = sal; u.hash = h2; u.trocar = false; gravar(K.users, lista);
                return ok({ destino: destinoInicial(u) });
            });
        });
    }

    function atualizarPerfil(d) {
        var s = sessao(); if (!s) return erro('Sessão expirada.');
        var lista = usuarios(), u = lista.filter(function (x) { return x.email === s.email; })[0];
        if (d.nome) u.nome = d.nome.trim();
        u.extra = u.extra || {};
        for (var k in d.extra) u.extra[k] = d.extra[k];
        gravar(K.users, lista);
        return ok({});
    }

    /* ---------- ações do administrador ---------- */
    function exigirAdm() {
        var s = sessao();
        return (s && s.papel === 'adm') ? s : null;
    }
    function podeGerir(adm, alvo) {                                // só o admin primário gerencia outros admins
        if (alvo.primario) return false;
        if (alvo.papel === 'adm') return adm.primario;
        return true;
    }

    function listar() {
        return exigirAdm() ? usuarios().map(publico) : [];
    }

    function criarUsuario(d) {
        var adm = exigirAdm(); if (!adm) return Promise.resolve(erro('Sem permissão.'));
        var email = norm(d.email), papel = d.papel;
        if (['aluno', 'professor', 'adm'].indexOf(papel) < 0) return Promise.resolve(erro('Perfil inválido.'));
        if (papel === 'adm' && !adm.primario) return Promise.resolve(erro('Só o administrador primário cria outros administradores.'));
        if (!String(d.nome || '').trim() || !email) return Promise.resolve(erro('Preencha nome e e-mail.'));
        var senha = d.senha || gerarSenhaProvisoria(), msg = validarSenha(senha);
        if (msg) return Promise.resolve(erro(msg));
        if (usuarios().some(function (u) { return u.email === email; })) return Promise.resolve(erro('Já existe um usuário com esse e-mail.'));
        return montarUsuario({ nome: d.nome.trim(), email: email, papel: papel }, senha, true).then(function (u) {
            var lista = usuarios(); lista.push(u); gravar(K.users, lista);
            return ok({ senha: senha });
        });
    }

    function alterarLista(email, fn) {
        var adm = exigirAdm(); if (!adm) return erro('Sem permissão.');
        email = norm(email);
        var lista = usuarios(), i = -1;
        lista.forEach(function (u, n) { if (u.email === email) i = n; });
        if (i < 0) return erro('Usuário não encontrado.');
        if (lista[i].email === adm.email) return erro('Você não pode fazer isso na própria conta.');
        if (!podeGerir(adm, lista[i])) return erro('Sem permissão para este usuário.');
        fn(lista, i); gravar(K.users, lista);
        return ok({});
    }
    function excluir(email) { return alterarLista(email, function (l, i) { l.splice(i, 1); }); }
    function alternarAtivo(email) { return alterarLista(email, function (l, i) { l[i].ativo = l[i].ativo === false; }); }

    function redefinirSenha(email) {
        var adm = exigirAdm(); if (!adm) return Promise.resolve(erro('Sem permissão.'));
        email = norm(email);
        var lista = usuarios(), u = lista.filter(function (x) { return x.email === email; })[0];
        if (!u) return Promise.resolve(erro('Nenhum usuário com esse e-mail.'));
        if (u.email === adm.email) return Promise.resolve(erro('Para a sua conta, use “Alterar senha”.'));
        if (!podeGerir(adm, u)) return Promise.resolve(erro('Sem permissão para este usuário.'));
        var nova = gerarSenhaProvisoria(), sal = novoSal();
        return hash(nova, sal).then(function (h) {
            u.salt = sal; u.hash = h; u.trocar = true; gravar(K.users, lista);
            return ok({ senha: nova, nome: u.nome });
        });
    }

    /* ---------- proteção das páginas ---------- */
    var aguardando = [], liberado = null;
    function quando(cb) { if (liberado) cb(liberado); else aguardando.push(cb); }

    (function guardar() {
        var papel = document.documentElement.getAttribute('data-papel');
        if (!papel) return;
        document.documentElement.style.visibility = 'hidden';
        pronto.then(function () {
            var s = sessao(), pag = location.pathname.split('/').pop();
            if (!s) { location.replace('login.html?aviso=sessao'); return; }
            if (papel !== 'qualquer' && s.papel !== papel) { location.replace(PAINEIS[s.papel]); return; }
            if (s.trocar && pag !== 'trocar-senha.html') { location.replace('trocar-senha.html'); return; }
            if (s.papel === 'aluno' && !(s.extra && s.extra.questionario) && pag !== 'questionario.html') { location.replace('questionario.html'); return; }
            liberado = s;
            document.documentElement.style.visibility = '';
            aguardando.forEach(function (cb) { cb(s); });
        });
    })();

    // Itens comuns dos painéis: saudação, botão Sair e atalho para trocar a senha
    quando(function (s) {
        function montar() {
            var h1 = document.querySelector('.topo h1');
            if (h1 && /^Olá,/.test(h1.textContent)) h1.textContent = 'Olá, ' + s.nome.split(' ')[0] + '!';
            var nav = document.querySelector('.menu nav');
            if (nav && s.papel !== 'aluno' && !document.getElementById('link-senha')) {
                var a = document.createElement('a');
                a.href = 'trocar-senha.html'; a.id = 'link-senha';
                a.innerHTML = '<span>🔒</span>Alterar senha';
                nav.appendChild(a);
            }
            var btn = document.querySelector('.sair');
            if (btn) btn.addEventListener('click', function (e) {
                e.preventDefault(); sair(); location.href = LOGINS[s.papel];
            });
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
    });

    /* ---------- páginas de login, cadastro e troca de senha ---------- */
    function aviso(el, texto, info) { el.textContent = texto; el.className = 'erro' + (info ? ' info' : ''); el.hidden = false; }

    function ligarLogin() {
        document.addEventListener('DOMContentLoaded', function () {
            var f = $('form-login'), msg = $('erro'), botao = f.querySelector('button[type=submit]');
            if (new URLSearchParams(location.search).get('aviso') === 'sessao') aviso(msg, 'Entre com seu login para acessar essa página.', true);
            pronto.then(function () { var s = sessao(); if (s) location.replace(destinoInicial(s)); });
            var esq = $('esqueci'), inf = $('info-esqueci');
            if (esq && inf) esq.addEventListener('click', function (e) { e.preventDefault(); inf.hidden = !inf.hidden; });
            f.addEventListener('submit', function (e) {
                e.preventDefault(); msg.hidden = true; botao.disabled = true;
                login($('usuario').value, $('senha').value).then(function (r) {
                    if (r.ok) { location.href = r.destino; return; }       // aluno, professor ou administrador: cada um vai para o seu painel
                    aviso(msg, r.erro); botao.disabled = false; $('senha').value = ''; $('senha').focus();
                });
            });
        });
    }

    function ligarCadastro() {
        document.addEventListener('DOMContentLoaded', function () {
            var f = $('form-cadastro'), msg = $('erro'), botao = f.querySelector('button[type=submit]');
            f.addEventListener('submit', function (e) {
                e.preventDefault(); msg.hidden = true;
                if ($('senha').value !== $('confirmar').value) { aviso(msg, 'As senhas não são iguais.'); return; }
                botao.disabled = true;
                var plano = f.querySelector('input[name=plano]:checked');
                registrarAluno({ nome: $('nome').value, email: $('email').value, senha: $('senha').value,
                    extra: { telefone: $('telefone').value, nascimento: $('nascimento').value, vestibular: $('vestibular').value, plano: plano ? plano.value : 'gratis' }
                }).then(function (r) {
                    if (r.ok) location.href = r.destino; else { aviso(msg, r.erro); botao.disabled = false; }
                });
            });
        });
    }

    function ligarTrocaSenha() {
        quando(function (s) {
            function montar() {
                document.body.classList.add('tema-' + s.papel);
                var f = $('form-troca'), msg = $('erro');
                if (s.trocar) { $('texto-troca').textContent = 'Por segurança, crie uma senha só sua antes de continuar. A provisória que você recebeu deixa de valer.'; }
                else { $('texto-troca').textContent = 'Escolha uma nova senha para a sua conta.'; $('voltar').hidden = false; $('voltar').href = PAINEIS[s.papel]; }
                f.addEventListener('submit', function (e) {
                    e.preventDefault(); msg.hidden = true;
                    if ($('nova').value !== $('confirmar').value) { aviso(msg, 'As senhas novas não são iguais.'); return; }
                    mudarSenha($('atual').value, $('nova').value).then(function (r) {
                        if (r.ok) location.href = r.destino; else aviso(msg, r.erro);
                    });
                });
            }
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
        });
    }


    /* ---------- botão de olho (mostrar/ocultar senha) em todo campo de senha ---------- */
    var OLHO_CHEIO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/></svg>';
    var OLHO_RISCADO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3.2"/><line x1="3" y1="3" x2="21" y2="21"/></svg>';

    function olhosDeSenha() {
        Array.prototype.forEach.call(document.querySelectorAll('input[type=password]'), function (inp) {
            if (inp.parentNode.classList.contains('campo-senha')) return;
            var env = document.createElement('div'); env.className = 'campo-senha';
            inp.parentNode.insertBefore(env, inp); env.appendChild(inp);
            var b = document.createElement('button'); b.type = 'button'; b.className = 'ver-senha';
            function estado(visivel) {
                b.innerHTML = visivel ? OLHO_CHEIO : OLHO_RISCADO;
                b.setAttribute('aria-label', visivel ? 'Ocultar senha' : 'Mostrar senha');
                b.setAttribute('aria-pressed', visivel ? 'true' : 'false');
            }
            estado(false);
            b.addEventListener('click', function () {
                var vai = inp.type === 'password';
                inp.type = vai ? 'text' : 'password';
                estado(vai); inp.focus();
            });
            env.appendChild(b);
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', olhosDeSenha); else olhosDeSenha();

    window.Auth = {
        pronto: pronto, quando: quando, sessao: sessao, sair: sair, login: login, registrarAluno: registrarAluno,
        mudarSenha: mudarSenha, atualizarPerfil: atualizarPerfil, validarSenha: validarSenha,
        listar: listar, criarUsuario: criarUsuario, excluir: excluir, alternarAtivo: alternarAtivo, redefinirSenha: redefinirSenha,
        ligarLogin: ligarLogin, ligarCadastro: ligarCadastro, ligarTrocaSenha: ligarTrocaSenha
    };
})();
