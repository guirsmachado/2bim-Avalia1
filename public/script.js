const CLIENT_ID = "COLE_AQUI_O_CLIENT_ID.apps.googleusercontent.com";

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");

let svgAtual = "";
let idToken = null;

function iniciarLogin() {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (resposta) => {
      idToken = resposta.credential;
      mensagem.textContent = "Login realizado. Agora escolha um número.";
    },
  });
  google.accounts.id.renderButton(document.getElementById("botao-google"), {
    theme: "outline",
    size: "large",
  });
}

// O script do Google carrega com async, então esperamos ele ficar pronto.
const espera = setInterval(() => {
  if (window.google && google.accounts && google.accounts.id) {
    clearInterval(espera);
    iniciarLogin();
  }
}, 100);

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";

  if (!idToken) {
    mensagem.textContent = "Erro 401: faça login com o Google primeiro.";
    return;
  }

  const numero = Number(campoNumero.value);

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + idToken,
      },
      body: JSON.stringify({ numero }),
    });

    if (resposta.status === 400) {
      mensagem.textContent = "Erro 400: digite um inteiro entre 1 e 100.";
      return;
    }
    if (resposta.status === 401) {
      mensagem.textContent = "Erro 401: sessão inválida ou expirada. Entre com o Google novamente.";
      idToken = null;
      return;
    }
    if (!resposta.ok) {
      mensagem.textContent = "Erro inesperado (" + resposta.status + ").";
      return;
    }

    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
  } catch {
    mensagem.textContent = "Falha de rede ao chamar o servidor.";
  }
});

botaoBaixar.addEventListener("click", () => {
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exemplo.svg";
  link.click();
  URL.revokeObjectURL(url);
});