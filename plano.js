/* Gera o plano de estudos e o cronograma semanal a partir do questionário */
(function () {
    var MAT = ['Matemática', 'Português', 'Biologia', 'Química', 'Física', 'História', 'Geografia', 'Inglês', 'Redação'];
    var BASE = { 'Matemática': 1.2, 'Português': 1.2, 'Biologia': 1, 'Química': 1, 'Física': 1, 'História': 0.8, 'Geografia': 0.8, 'Inglês': 0.6, 'Redação': 1 };
    var FOCO = {
        ENEM:   { 'Redação': .5, 'Matemática': .3, 'Biologia': .2, 'Química': .2, 'Física': .2, 'História': .2, 'Geografia': .2 },
        Fuvest: { 'Português': .5, 'História': .5, 'Geografia': .3, 'Matemática': .3 },
        Unicamp: { 'Matemática': .5, 'Física': .4, 'Química': .4, 'Redação': .3 }
    };
    var TOPICOS = {
        'Matemática': ['Porcentagem e juros', 'Funções do 1º e 2º grau', 'Geometria plana', 'Razão, proporção e regra de três', 'Estatística e probabilidade', 'Geometria espacial'],
        'Português': ['Interpretação de texto', 'Gêneros textuais', 'Concordância e regência', 'Figuras de linguagem', 'Literatura: modernismo', 'Coesão e coerência'],
        'Biologia': ['Citologia', 'Genética: Leis de Mendel', 'Ecologia', 'Fisiologia humana', 'Evolução', 'Botânica'],
        'Química': ['Estequiometria', 'Tabela periódica', 'Soluções e pH', 'Termoquímica', 'Química orgânica', 'Eletroquímica'],
        'Física': ['Cinemática', 'Leis de Newton', 'Energia e trabalho', 'Eletricidade', 'Ondulatória', 'Termologia'],
        'História': ['Brasil Colônia', 'Revolução Industrial', 'Era Vargas', 'Guerras Mundiais', 'Brasil República', 'Ditadura militar'],
        'Geografia': ['Climatologia', 'Urbanização', 'Geopolítica', 'Biomas brasileiros', 'Demografia', 'Globalização'],
        'Inglês': ['Interpretação de textos', 'Tempos verbais', 'Vocabulário e cognatos', 'Phrasal verbs', 'Conectivos', 'Notícias e charges'],
        'Redação': ['Estrutura dissertativa', 'Proposta de intervenção', 'Repertório sociocultural', 'As 5 competências do ENEM', 'Coesão e conectivos', 'Redação completa']
    };
    var HORAS = { ate1: 60, '1a2': 90, '2a4': 180, mais4: 240 };
    var INICIO = { manha: '07:30', tarde: '14:00', noite: '18:30' };
    var DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    var ROTULOS = {
        vestibular: { este: 'Este ano', proximo: 'Próximo ano' },
        horas: { ate1: 'até 1h por dia', '1a2': '1 a 2h por dia', '2a4': '2 a 4h por dia', mais4: 'mais de 4h por dia' },
        horario: { manha: 'manhã', tarde: 'tarde', noite: 'noite' },
        objetivo: { passar: 'Passar este ano', treineiro: 'Treineiro', preparacao: 'Preparação para o próximo ano' }
    };

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function hm(min) { return pad(Math.floor(min / 60)) + ':' + pad(min % 60); }
    function minutos(s) { var p = s.split(':'); return Number(p[0]) * 60 + Number(p[1]); }
    function semanaDoAno() { var d = new Date(), ini = new Date(d.getFullYear(), 0, 1); return Math.floor((d - ini) / 6048e5); }
    function lista(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1]; }

    function objetivoDe(r) { return r.vestibular === 'proximo' ? 'preparacao' : (r.objetivo || 'passar'); }

    function pesos(r, diag) {
        var p = {};
        MAT.forEach(function (m) {
            p[m] = BASE[m] + ((FOCO[r.foco] || {})[m] || 0) + (diag[m] ? 0 : 1.5);
        });
        return p;
    }

    function cotas(p, total) {                       // maior resto: divide os blocos da semana pelo peso de cada matéria
        var soma = MAT.reduce(function (s, m) { return s + p[m]; }, 0), c = {}, usado = 0, sobras = [];
        MAT.forEach(function (m) { var ideal = p[m] / soma * total; c[m] = Math.floor(ideal); usado += c[m]; sobras.push([ideal - c[m], m]); });
        sobras.sort(function (a, b) { return b[0] - a[0]; });
        for (var i = 0; usado < total; i++, usado++) c[sobras[i % sobras.length][1]]++;
        return c;
    }

    function gerar(r, diag) {
        var min = HORAS[r.horas] || 90, inicio = minutos(INICIO[r.horario] || '19:00'), obj = objetivoDe(r);
        var estudo = [0, 1, 2, 3, 4];
        if (min >= 90 || obj === 'passar') estudo.push(5);
        var partes = [], resto = min;
        while (resto > 0) { var l = Math.min(60, resto); partes.push(l); resto -= l; }
        var P = pesos(r, diag), q = cotas(P, partes.length * estudo.length), cont = {}, sem = semanaDoAno();
        var total = {}; MAT.forEach(function (m) { total[m] = 0; });

        var dias = DIAS.map(function (nome, idx) {
            var blocos = [], t = inicio;
            if (estudo.indexOf(idx) >= 0) {
                var usados = {};
                partes.forEach(function (len) {
                    var melhor = null;
                    MAT.forEach(function (m) {
                        if (q[m] > 0 && !usados[m] && (melhor === null || q[m] > q[melhor] || (q[m] === q[melhor] && P[m] > P[melhor]))) melhor = m;
                    });
                    if (melhor === null) MAT.forEach(function (m) { if (q[m] > 0 && (melhor === null || q[m] > q[melhor])) melhor = m; });
                    q[melhor]--; usados[melhor] = true; total[melhor] += len;
                    var n = cont[melhor] || 0; cont[melhor] = n + 1;
                    var topico = TOPICOS[melhor][(sem + n + MAT.indexOf(melhor)) % 6];
                    blocos.push({ ini: hm(t), fim: hm(t + len), mat: melhor, conteudo: topico, topico: (len < 60 ? 'Questões: ' : '') + topico, reforco: !diag[melhor], tipo: 'estudo' });
                    t += len + 10;
                });
            } else if (idx === 5) {
                blocos.push({ ini: hm(t), fim: hm(t + 60), mat: 'Revisão', topico: 'Revisão da semana e das questões erradas', tipo: 'revisao' });
            } else {
                var dur = obj === 'passar' ? (min >= 180 ? 120 : 90) : 60;
                var tit = obj === 'passar' ? 'Mini simulado e revisão dos erros' : obj === 'treineiro' ? 'Simulado de treino, sem pressão de nota' : 'Revisão semanal e planejamento';
                blocos.push({ ini: hm(t), fim: hm(t + dur), mat: obj === 'preparacao' ? 'Revisão' : 'Simulado', topico: tit, tipo: obj === 'preparacao' ? 'revisao' : 'simulado' });
            }
            return { dia: nome, blocos: blocos };
        });

        var totalMin = MAT.reduce(function (s, m) { return s + total[m]; }, 0);
        var prioridades = MAT.filter(function (m) { return total[m] > 0; }).map(function (m) {
            return { mat: m, minutos: total[m], pct: Math.round(total[m] / totalMin * 100), reforco: !diag[m] };
        }).sort(function (a, b) { return b.minutos - a.minutos; });

        var extra = dias.reduce(function (s, d) { return s + d.blocos.filter(function (b) { return b.tipo !== 'estudo'; }).reduce(function (x, b) { return x + (minutos(b.fim) - minutos(b.ini)); }, 0); }, 0);
        return { dias: dias, prioridades: prioridades, horasSemana: Math.round((totalMin + extra) / 6) / 10, objetivo: obj };
    }

    function feedback(nome, r, diag) {
        var ac = MAT.filter(function (m) { return diag[m]; }), er = MAT.filter(function (m) { return !diag[m]; }), n = ac.length, obj = objetivoDe(r);
        var nivel = n <= 3 ? 'Base em construção' : n <= 6 ? 'Em evolução' : 'Bom ritmo';
        var t = nome + ', você acertou ' + n + ' de ' + MAT.length + ' questões. ';
        t += n <= 3 ? 'Isso mostra que a base ainda está sendo construída, e tudo bem: é para isso que o plano existe. '
           : n <= 6 ? 'Você já tem uma boa base e precisa de prática dirigida para evoluir. '
           : 'Excelente ponto de partida: agora o foco é constância, questões e simulados. ';
        if (ac.length) t += 'Seus pontos fortes: ' + lista(ac) + '. ';
        t += er.length ? 'Vamos dar mais atenção a ' + lista(er) + '. ' : 'Como você acertou tudo, o plano mantém todas as matérias em dia. ';
        t += obj === 'passar' ? 'Como o seu objetivo é passar este ano no ' + r.foco + ', o plano inclui mini simulado semanal e revisão dos erros. '
           : obj === 'treineiro' ? 'Como treineiro no ' + r.foco + ', o plano inclui simulados de treino sem pressão de nota para você ganhar experiência de prova. '
           : 'Como a prova do ' + r.foco + ' é só no próximo ano, o plano constrói a base com calma e constância. ';
        t += r.estudando === 'nao' ? 'Como você ainda não começou, o mais importante é criar o hábito: comece pelo primeiro bloco do seu cronograma.'
           : r.estudando === 'comecando' ? 'Você está começando agora, o momento ideal para criar uma rotina.'
           : 'Como você já estuda, o plano organiza tudo em um ciclo semanal para você não se perder.';
        return { texto: t, nivel: nivel, acertos: n, fortes: ac, fracos: er };
    }

    window.Plano = { TOPICOS: TOPICOS, MAT: MAT, ROTULOS: ROTULOS, gerar: gerar, feedback: feedback, objetivoDe: objetivoDe, DIAS: DIAS };
})();
