(function () {
    var $ = function (id) { return document.getElementById(id); };
    var player = $('player'), msg = $('player-msg'), video = $('video');
    var status = $('status'), tempo = $('tempo'), alunos = $('alunos');
    var btnIniciar = $('btn-iniciar'), btnTela = $('btn-tela'), btnQuadro = $('btn-quadro'), btnEncerrar = $('btn-encerrar');
    var quadro = $('quadro'), canvas = $('tela-quadro'), ctx = canvas.getContext('2d');
    var inicio = 0, relogio = null, stream = null;

    function dois(n) { return String(n).padStart(2, '0'); }

    function atualizarTempo() {
        var s = Math.floor((Date.now() - inicio) / 1000);
        tempo.textContent = dois(Math.floor(s / 3600)) + ':' + dois(Math.floor(s % 3600 / 60)) + ':' + dois(s % 60);
    }

    function pararTela() {
        if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
        video.hidden = true;
        video.srcObject = null;
    }

    btnIniciar.addEventListener('click', function () {
        inicio = Date.now();
        relogio = setInterval(atualizarTempo, 1000);
        status.textContent = 'No ar';
        player.classList.add('no-ar');
        msg.textContent = 'Você está no ar. Compartilhe a tela ou abra o quadro branco.';
        alunos.textContent = '12';
        btnIniciar.disabled = true;
        btnTela.disabled = false;
        btnQuadro.disabled = false;
        btnEncerrar.disabled = false;
    });

    btnTela.addEventListener('click', function () {
        if (stream) { pararTela(); btnTela.textContent = 'Compartilhar tela'; return; }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            alert('Seu navegador não permite compartilhar a tela. Use Chrome, Edge ou Firefox no computador.');
            return;
        }
        navigator.mediaDevices.getDisplayMedia({ video: true }).then(function (s) {
            stream = s;
            video.srcObject = s;
            video.hidden = false;
            btnTela.textContent = 'Parar compartilhamento';
            s.getVideoTracks()[0].addEventListener('ended', function () {
                pararTela();
                btnTela.textContent = 'Compartilhar tela';
            });
        }).catch(function () { /* o professor cancelou a escolha da tela */ });
    });

    btnQuadro.addEventListener('click', function () {
        var aberto = quadro.classList.toggle('aberto');
        btnQuadro.textContent = aberto ? 'Fechar quadro' : 'Quadro branco';
    });

    btnEncerrar.addEventListener('click', function () {
        if (!confirm('Encerrar a transmissão para todos os alunos?')) return;
        clearInterval(relogio);
        pararTela();
        status.textContent = 'Offline';
        player.classList.remove('no-ar');
        msg.textContent = 'Transmissão encerrada. Clique em “Iniciar transmissão” para entrar no ar de novo.';
        alunos.textContent = '0';
        quadro.classList.remove('aberto');
        btnQuadro.textContent = 'Quadro branco';
        btnTela.textContent = 'Compartilhar tela';
        btnIniciar.disabled = false;
        btnTela.disabled = true;
        btnQuadro.disabled = true;
        btnEncerrar.disabled = true;
    });

    /* ---- Quadro branco ---- */
    var desenhando = false;
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#11182e';

    function pos(e) {
        var r = canvas.getBoundingClientRect();
        return { x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height };
    }
    canvas.addEventListener('pointerdown', function (e) {
        desenhando = true;
        var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y);
        canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
        if (!desenhando) return;
        var p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke();
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
        canvas.addEventListener(ev, function () { desenhando = false; });
    });
    $('limpar-quadro').addEventListener('click', function () { ctx.clearRect(0, 0, canvas.width, canvas.height); });

    /* ---- Chat ---- */
    $('chat-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var campo = $('chat-texto'), texto = campo.value.trim();
        if (!texto) return;
        var li = document.createElement('li');
        var span = document.createElement('span');
        var forte = document.createElement('strong');
        forte.textContent = 'Você: ';
        span.appendChild(forte);
        span.appendChild(document.createTextNode(texto));
        var em = document.createElement('em');
        var d = new Date();
        em.textContent = dois(d.getHours()) + ':' + dois(d.getMinutes());
        li.appendChild(span); li.appendChild(em);
        $('chat').appendChild(li);
        campo.value = '';
    });
})();
