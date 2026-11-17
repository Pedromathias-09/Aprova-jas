/* Banco de questões (aba dentro de Conteúdos) */
Auth.quando(function () {
    var $ = function (id) { return document.getElementById(id); };
    var D = window.BANCO, LETRAS = ['A', 'B', 'C', 'D', 'E'];
    var MATERIAS = ['Matemática', 'Português', 'Biologia', 'Química', 'Física', 'História', 'Geografia', 'Inglês', 'Redação'];
    var chave = AJ.chave('banco');
    var est = AJ.ler(chave, { resp: {}, salvas: [] });
    var filtro = { materia: '', conteudo: '', estilo: '', dif: '' }, soSalvas = false, lista = D.slice(), idx = 0;

    function salvar() { AJ.gravar(chave, est); }
    function opcao(sel, valor, texto) { var o = document.createElement('option'); o.value = valor; o.textContent = texto; sel.appendChild(o); }

    function montarSelects() {
        var m = $('b-materia'); m.innerHTML = ''; opcao(m, '', 'Todas as matérias');
        MATERIAS.forEach(function (x) { if (D.some(function (q) { return q.materia === x; })) opcao(m, x, x); });
        montarConteudos();
    }
    function montarConteudos() {
        var c = $('b-conteudo'); c.innerHTML = ''; opcao(c, '', 'Todos os conteúdos');
        var vistos = [];
        D.forEach(function (q) { if ((!$('b-materia').value || q.materia === $('b-materia').value) && vistos.indexOf(q.conteudo) < 0) vistos.push(q.conteudo); });
        vistos.forEach(function (x) { opcao(c, x, x); });
    }

    function lerFiltros() {
        filtro.materia = $('b-materia').value; filtro.conteudo = $('b-conteudo').value; filtro.estilo = $('b-estilo').value; filtro.dif = $('b-dif').value;
    }
    function aplicar() {
        lista = D.filter(function (q) {
            return (!filtro.materia || q.materia === filtro.materia) && (!filtro.conteudo || q.conteudo === filtro.conteudo) &&
                   (!filtro.estilo || q.estilo === filtro.estilo) && (!filtro.dif || q.dif === filtro.dif) &&
                   (!soSalvas || est.salvas.indexOf(q.id) >= 0);
        });
        idx = 0; chips(); mostrar();
    }

    function chips() {
        var ul = $('b-chips'); ul.innerHTML = '';
        var itens = [['materia', filtro.materia], ['conteudo', filtro.conteudo], ['estilo', filtro.estilo ? 'Estilo ' + filtro.estilo : ''], ['dif', filtro.dif]];
        if (soSalvas) itens.push(['salvas', 'Só salvas']);
        itens.forEach(function (it) {
            if (!it[1]) return;
            var li = document.createElement('li'), b = document.createElement('button'), x = document.createElement('span');
            b.type = 'button'; b.className = 'chip-filtro'; b.setAttribute('aria-label', 'Remover filtro ' + it[1]);
            b.appendChild(document.createTextNode(it[1])); x.textContent = '×'; b.appendChild(x);
            b.addEventListener('click', function () {
                if (it[0] === 'salvas') { soSalvas = false; $('b-salvas').textContent = '★ Ver salvas'; }
                else { $({ materia: 'b-materia', conteudo: 'b-conteudo', estilo: 'b-estilo', dif: 'b-dif' }[it[0]]).value = ''; if (it[0] === 'materia') montarConteudos(); lerFiltros(); }
                aplicar();
            });
            li.appendChild(b); ul.appendChild(li);
        });
    }

    function resumo() {
        var r = est.resp, ids = Object.keys(r).filter(function (k) { return D.some(function (q) { return q.id === k; }); });
        var ok = ids.filter(function (k) { return r[k].ok; }).length;
        $('b-resumo').textContent = ids.length ? 'Você respondeu ' + ids.length + ' de ' + D.length + ' questões e acertou ' + ok + ' (' + Math.round(ok / ids.length * 100) + '%).' : 'Você ainda não respondeu nenhuma questão do banco.';
    }

    function mostrar() {
        resumo();
        var n = lista.length;
        $('b-total').textContent = n + (n === 1 ? ' questão encontrada' : ' questões encontradas');
        $('b-vazio').hidden = n > 0; $('b-card').hidden = n === 0;
        if (!n) { $('b-vazio').textContent = soSalvas ? 'Você ainda não salvou nenhuma questão com esses filtros.' : 'Nenhuma questão encontrada. Tente limpar os filtros.'; return; }
        var q = lista[idx], r = est.resp[q.id];
        $('b-contador').textContent = 'Questão ' + (idx + 1) + ' de ' + n;
        $('b-titulo').textContent = 'Questão de ' + q.materia;
        var tags = $('b-tags'); tags.innerHTML = '';
        [q.conteudo, 'Estilo ' + q.estilo].forEach(function (t) { var s = document.createElement('span'); s.className = 'tag-azul'; s.textContent = t; tags.appendChild(s); });
        var d = document.createElement('span'); d.className = 'dif ' + { 'Fácil': 'facil', 'Médio': 'medio', 'Difícil': 'dificil' }[q.dif]; d.textContent = q.dif; tags.appendChild(d);
        $('b-apoio').hidden = !q.apoio; $('b-apoio').textContent = q.apoio;
        $('b-enun').textContent = q.enun;
        var box = $('b-alts'); Array.prototype.slice.call(box.querySelectorAll('label')).forEach(function (l) { box.removeChild(l); });
        $('b-legenda').textContent = q.enun;
        q.alts.forEach(function (t, k) {
            var l = document.createElement('label'), i = document.createElement('input'), le = document.createElement('span'), tx = document.createElement('span');
            l.className = 'alt'; i.type = 'radio'; i.name = 'alt'; i.value = k; le.className = 'letra'; le.textContent = LETRAS[k]; tx.textContent = t;
            if (r) {
                i.disabled = true; l.classList.add('travada');
                if (k === q.c) l.classList.add('certa'); else if (k === r.e) l.classList.add('errada');
                if (k === r.e) i.checked = true;
            } else i.addEventListener('change', function () { $('b-responder').disabled = false; $('b-dica').hidden = true; });
            l.appendChild(i); l.appendChild(le); l.appendChild(tx); box.appendChild(l);
        });
        $('b-responder').hidden = !!r; $('b-responder').disabled = true; $('b-dica').hidden = !!r;
        feedback(q, r);
        var on = est.salvas.indexOf(q.id) >= 0;
        $('b-salvar').textContent = on ? '★ Salva' : '☆ Salvar'; $('b-salvar').setAttribute('aria-pressed', on);
        $('b-ant').disabled = idx === 0; $('b-prox').disabled = idx === n - 1;
        var dl = $('b-dl'); dl.innerHTML = '';
        [['Matéria', q.materia], ['Conteúdo', q.conteudo], ['Estilo de prova', q.estilo], ['Dificuldade', q.dif], ['Código', q.id.toUpperCase()]].forEach(function (p) {
            var a = document.createElement('dt'), b = document.createElement('dd'); a.textContent = p[0]; b.textContent = p[1]; dl.appendChild(a); dl.appendChild(b);
        });
        $('b-relato-msg').hidden = true;
    }

    function feedback(q, r) {
        var f = $('b-feedback'); f.hidden = !r; if (!r) return;
        f.className = 'b-feedback ' + (r.ok ? 'ok' : 'erro'); f.innerHTML = '';
        var t = document.createElement('strong'); t.textContent = r.ok ? 'Correto! ' : 'Resposta correta: alternativa ' + LETRAS[q.c] + '. ';
        f.appendChild(t); f.appendChild(document.createTextNode(q.exp));
    }

    $('b-responder').addEventListener('click', function () {
        var q = lista[idx], esc = document.querySelector('#b-alts input:checked'); if (!esc) return;
        est.resp[q.id] = { e: Number(esc.value), ok: Number(esc.value) === q.c }; salvar(); mostrar();
    });
    $('b-ant').addEventListener('click', function () { if (idx > 0) { idx--; mostrar(); } });
    $('b-prox').addEventListener('click', function () { if (idx < lista.length - 1) { idx++; mostrar(); } });
    $('b-salvar').addEventListener('click', function () {
        var id = lista[idx].id, i = est.salvas.indexOf(id);
        if (i >= 0) est.salvas.splice(i, 1); else est.salvas.push(id);
        salvar(); mostrar();
    });
    $('b-salvas').addEventListener('click', function () {
        soSalvas = !soSalvas; $('b-salvas').textContent = soSalvas ? '★ Ver todas' : '★ Ver salvas'; aplicar();
    });
    $('b-materia').addEventListener('change', montarConteudos);
    $('b-form').addEventListener('submit', function (e) { e.preventDefault(); lerFiltros(); aplicar(); });
    $('b-limpar').addEventListener('click', function () {
        ['b-materia', 'b-conteudo', 'b-estilo', 'b-dif'].forEach(function (id) { $(id).value = ''; }); montarConteudos();
        soSalvas = false; $('b-salvas').textContent = '★ Ver salvas'; lerFiltros(); aplicar();
    });

    // Relatar problema
    $('form-relato').addEventListener('submit', function (e) {
        e.preventDefault();
        var relatos = AJ.ler('aj_relatos', []);
        relatos.push({ questao: lista[idx].id, tipo: $('rel-tipo').value, texto: $('rel-texto').value.trim(), quando: new Date().toISOString() });
        AJ.gravar('aj_relatos', relatos); $('form-relato').reset(); $('dlg-relato').close();
        $('b-relato-msg').hidden = false;
    });

    montarSelects(); lerFiltros(); aplicar();

    // Vindo do cronograma: ?materia=Física&conteudo=Cinemática#banco
    var pr = new URLSearchParams(location.search), mat = pr.get('materia'), con = pr.get('conteudo');
    if (mat || location.hash === '#banco') {
        document.querySelector('#cont-area .abas button[data-aba=banco]').click();
        if (mat && MATERIAS.indexOf(mat) >= 0) {
            $('b-materia').value = mat; montarConteudos();
            if (con && D.some(function (q) { return q.materia === mat && q.conteudo === con; })) $('b-conteudo').value = con;
            lerFiltros(); aplicar();
        }
    }
});
