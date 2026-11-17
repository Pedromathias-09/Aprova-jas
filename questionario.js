/* Questionário de entrada: etapa 1 (sobre o aluno) e etapa 2 (diagnóstico por matéria) */
Auth.quando(function (usuario) {
    var $ = function (id) { return document.getElementById(id); };

    var P1 = [
        { id: 'vestibular', t: 'Você pretende fazer vestibular este ano ou no próximo?', op: [['este', 'Este ano'], ['proximo', 'No próximo ano']] },
        { id: 'estudando', t: 'Você está estudando para passar na prova?', op: [['sim', 'Sim, já estou estudando'], ['comecando', 'Estou começando agora'], ['nao', 'Ainda não comecei']] },
        { id: 'horas', t: 'Quantas horas por dia, na sua rotina, você consegue dedicar aos estudos?', op: [['ate1', 'Até 1 hora'], ['1a2', 'De 1 a 2 horas'], ['2a4', 'De 2 a 4 horas'], ['mais4', 'Mais de 4 horas']] },
        { id: 'foco', t: 'Se você for fazer algum vestibular, qual é o seu foco principal?', op: [['ENEM', 'ENEM'], ['Fuvest', 'Fuvest'], ['Unicamp', 'Unicamp']] },
        { id: 'objetivo', t: 'Você quer passar este ano ou vai como treineiro?', op: [['passar', 'Quero passar este ano'], ['treineiro', 'Vou como treineiro, para ganhar experiência']],
          so: function (r) { return r.vestibular === 'este'; } },
        { id: 'horario', t: 'Qual é o melhor horário de estudo para você?', op: [['manha', 'Manhã (a partir das 7h30)'], ['tarde', 'Tarde (a partir das 14h)'], ['noite', 'Noite (a partir das 18h30)']] }
    ];

    var P2 = [
        { mat: 'Matemática', t: 'Um produto de R$ 200 recebe 20% de desconto. Qual é o preço final?', op: ['R$ 140', 'R$ 160', 'R$ 180', 'R$ 240'], c: 1 },
        { mat: 'Português', t: 'Em “Os alunos chegaram cedo, mas ninguém os esperava”, a palavra “mas” indica:', op: ['Adição', 'Causa', 'Oposição', 'Conclusão'], c: 2 },
        { mat: 'Biologia', t: 'Qual organela é a principal responsável pela respiração celular?', op: ['Ribossomo', 'Mitocôndria', 'Lisossomo', 'Complexo de Golgi'], c: 1 },
        { mat: 'Química', t: 'Qual é o pH de uma solução neutra a 25 °C?', op: ['0', '10', '7', '14'], c: 2 },
        { mat: 'Física', t: 'Qual é a unidade de força no Sistema Internacional?', op: ['Joule', 'Newton', 'Watt', 'Pascal'], c: 1 },
        { mat: 'História', t: 'A Revolução Industrial começou em qual país?', op: ['França', 'Alemanha', 'Estados Unidos', 'Inglaterra'], c: 3 },
        { mat: 'Geografia', t: 'Qual é o maior bioma brasileiro em extensão?', op: ['Cerrado', 'Amazônia', 'Mata Atlântica', 'Caatinga'], c: 1 },
        { mat: 'Inglês', t: 'Choose the correct option: “She ___ to school every day.”', op: ['go', 'going', 'goes', 'gone'], c: 2 },
        { mat: 'Redação', t: 'Na redação do ENEM, a proposta de intervenção deve apresentar:', op: ['Apenas a opinião do autor', 'Agente, ação, meio, finalidade e detalhamento', 'Três citações de autores famosos', 'Um resumo dos textos motivadores'], c: 1 }
    ];

    var resp = {}, esc = {}, i = 0;
    var nome = usuario.nome.split(' ')[0];

    function passos() {
        var l = [];
        P1.forEach(function (q) { if (!q.so || q.so(resp)) l.push({ tipo: 'p1', q: q }); });
        l.push({ tipo: 'intro' });
        P2.forEach(function (q) { l.push({ tipo: 'p2', q: q }); });
        return l;
    }

    function mostrar() {
        var lista = passos(), p = lista[i], n1 = lista.filter(function (x) { return x.tipo === 'p1'; }).length;
        $('tela-pergunta').hidden = false; $('tela-feedback').hidden = true;
        var pct = Math.round(i / lista.length * 100);
        $('q-barra').style.width = pct + '%'; document.querySelector('.q-progresso').setAttribute('aria-valuenow', pct);
        var op = $('q-opcoes');
        Array.prototype.slice.call(op.querySelectorAll('label')).forEach(function (l) { op.removeChild(l); });
        $('q-voltar').style.visibility = i === 0 ? 'hidden' : 'visible';

        if (p.tipo === 'intro') {
            $('q-etapa').textContent = 'Etapa 2 de 2';
            $('q-sub').textContent = 'Etapa 2 de 2 · Diagnóstico';
            $('q-titulo').textContent = 'Agora vamos ver como você está em cada matéria';
            $('q-texto').hidden = false;
            $('q-texto').textContent = 'São 9 perguntas rápidas, uma de cada matéria. Não é prova e não vale nota: serve só para montar um plano que dê mais tempo ao que você mais precisa. Se não souber, use “Não sei” sem medo.';
            $('q-proxima').disabled = false; $('q-proxima').textContent = 'Começar etapa 2 →';
            return;
        }
        $('q-texto').hidden = true; $('q-proxima').textContent = 'Próxima →';
        var q = p.q, atual, opcoes;
        if (p.tipo === 'p1') {
            var pos = lista.filter(function (x) { return x.tipo === 'p1'; }).indexOf(p) + 1;
            $('q-etapa').textContent = 'Etapa 1 de 2';
            $('q-sub').textContent = 'Etapa 1 de 2 · Pergunta ' + pos + ' de ' + n1;
            $('q-titulo').textContent = q.t; atual = resp[q.id];
            opcoes = q.op.map(function (o) { return { v: o[0], t: o[1] }; });
        } else {
            var pos2 = P2.indexOf(q) + 1;
            $('q-etapa').textContent = 'Etapa 2 de 2';
            $('q-sub').textContent = 'Etapa 2 de 2 · ' + q.mat + ' (' + pos2 + ' de ' + P2.length + ')';
            $('q-titulo').textContent = q.t; atual = esc[q.mat];
            opcoes = q.op.map(function (t, k) { return { v: String(k), t: String.fromCharCode(65 + k) + ') ' + t }; });
            opcoes.push({ v: '-1', t: 'Não sei', ns: true });
        }
        $('q-legenda').textContent = q.t;
        opcoes.forEach(function (o) {
            var l = document.createElement('label'), r = document.createElement('input');
            r.type = 'radio'; r.name = 'opcao'; r.value = o.v;
            if (atual !== undefined && String(atual) === o.v) r.checked = true;
            r.addEventListener('change', function () {
                if (p.tipo === 'p1') resp[q.id] = o.v; else esc[q.mat] = Number(o.v);
                $('q-proxima').disabled = false;
            });
            if (o.ns) l.className = 'nao-sei';
            l.appendChild(r); l.appendChild(document.createTextNode(o.t)); op.appendChild(l);
        });
        $('q-proxima').disabled = atual === undefined;
    }

    $('q-proxima').addEventListener('click', function () {
        var lista = passos();
        if (i < lista.length - 1) { i++; mostrar(); } else finalizar();
    });
    $('q-voltar').addEventListener('click', function () { if (i > 0) { i--; mostrar(); } });
    $('f-refazer').addEventListener('click', function () { resp = {}; esc = {}; i = 0; mostrar(); });

    function finalizar() {
        var diag = {}; P2.forEach(function (q) { diag[q.mat] = esc[q.mat] === q.c; });
        var fb = Plano.feedback(nome, resp, diag), plano = Plano.gerar(resp, diag);
        Auth.atualizarPerfil({ extra: { questionario: { resp: resp, diag: diag, feedback: fb.texto, nivel: fb.nivel, acertos: fb.acertos, quando: new Date().toISOString() } } });

        $('tela-pergunta').hidden = true; $('tela-feedback').hidden = false;
        $('q-etapa').textContent = 'Concluído'; $('q-barra').style.width = '100%';
        document.querySelector('.q-progresso').setAttribute('aria-valuenow', 100);
        $('f-titulo').textContent = 'Seu feedback, ' + nome;
        $('f-acertos').textContent = fb.acertos; $('f-nivel').textContent = fb.nivel; $('f-texto').textContent = fb.texto;
        var ul = $('f-materias'); ul.innerHTML = '';
        Plano.MAT.forEach(function (m) {
            var li = document.createElement('li'); li.className = diag[m] ? 'ok' : 'ruim';
            var a = document.createElement('span'), b = document.createElement('span');
            a.textContent = m; b.textContent = diag[m] ? '✓ Acertou' : 'Reforçar'; li.appendChild(a); li.appendChild(b); ul.appendChild(li);
        });
        var R = Plano.ROTULOS, chips = [
            'Foco: ' + resp.foco, 'Objetivo: ' + R.objetivo[Plano.objetivoDe(resp)], 'Estudo: ' + R.horas[resp.horas], 'Período: ' + R.horario[resp.horario],
            plano.horasSemana + 'h por semana'
        ];
        var c = $('f-chips'); c.innerHTML = '';
        chips.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; c.appendChild(li); });
        window.scrollTo(0, 0);
    }

    mostrar();
});
