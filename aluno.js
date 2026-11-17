/* Comportamentos comuns das telas do aluno (abas, filtros e diálogos) */
(function () {
    document.addEventListener('click', function (e) {
        var abrir = e.target.closest('[data-abrir]');
        if (abrir) {
            var d = document.getElementById(abrir.getAttribute('data-abrir'));
            if (d && d.showModal) { document.dispatchEvent(new CustomEvent('abrir-dialogo', { detail: { dialogo: d, origem: abrir } })); d.showModal(); }
            return;
        }
        var fechar = e.target.closest('[data-fechar]');
        if (fechar) { fechar.closest('dialog').close(); return; }
        var b = e.target.closest('.abas button');
        if (b) trocarAba(b);
    });

    function trocarAba(b) {
        var abas = b.closest('.abas');
        abas.querySelectorAll('button').forEach(function (x) { x.classList.remove('ativa'); x.setAttribute('aria-selected', 'false'); });
        b.classList.add('ativa'); b.setAttribute('aria-selected', 'true');
        var raiz = document.querySelector(abas.getAttribute('data-alvo') || 'main');
        var filtro = b.getAttribute('data-filtro'), painel = b.getAttribute('data-aba');
        if (filtro !== null) {
            raiz.querySelectorAll('[data-grupo]').forEach(function (el) {
                var g = (el.getAttribute('data-grupo') || '').split(' ');
                el.hidden = !(filtro === 'todas' || g.indexOf(filtro) >= 0);
            });
        }
        if (painel) {
            raiz.querySelectorAll('[data-painel]').forEach(function (el) { el.hidden = el.getAttribute('data-painel') !== painel; });
        }
        document.dispatchEvent(new CustomEvent('aba', { detail: { aba: painel || filtro } }));
    }

    // Armazenamento simples por aluno (fica só neste navegador)
    window.AJ = {
        ler: function (k, p) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : p; } catch (e) { return p; } },
        gravar: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
        chave: function (nome) { var s = window.Auth && Auth.sessao(); return 'aj_' + nome + '_' + (s ? s.email : 'anon'); }
    };
})();
