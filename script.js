const API_KEY = "5894c4007b32ea49eb419b6ccffdcfcf";
const content = document.getElementById("content");

const tituloInput = document.getElementById("titulo");
const generoInput = document.getElementById("genero");
const imagemInput = document.getElementById("imagem");
const descricaoInput = document.getElementById("descricao");
const cadastrarBtn = document.getElementById("cadastrarBtn");

let filmes = [];

// 1. Quando o DOM estiver carregado, ligue o form
document.addEventListener("DOMContentLoaded", async () => {
    await carregarGeneros(); // ← aqui
    const form = document.getElementById("buscaForm");
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        searchMedia();
    });

    cadastrarBtn.addEventListener("click", (e) => {
        e.preventDefault();
        registrarManual();
    });

    //carregarFilmesManuais();
    fetchTrending();
});

function fetchTrending() {
    fetch(
        `https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}&language=pt-BR`
    )
        .then((res) => res.json())
        .then((data) => {
            filmes = data.results.slice(0, 5); // apenas os da API
            inserirFilmes(filmes);
        })
        .catch(console.error);
}

function searchMedia() {
    const query = document.getElementById("searchInput").value.trim();
    if (!query) return;
    fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}` +
            `&language=pt-BR&query=${encodeURIComponent(query)}`
    )
        .then((res) => res.json())
        .then((data) => {
            const filmesManuais = JSON.parse(
                localStorage.getItem("filmesManuais") || "[]"
            );
            filmes = [...filmesManuais, ...data.results.slice(0, 5)];

            inserirFilmes(filmes);
        })
        .catch(console.error);
}

let mapaGeneros = {};

async function carregarGeneros() {
    try {
        const resposta = await fetch(
            `https://api.themoviedb.org/3/genre/movie/list?language=pt-BR&api_key=${API_KEY}`
        );
        const dados = await resposta.json();
        dados.genres.forEach((g) => {
            mapaGeneros[g.id] = g.name;
        });
    } catch (erro) {
        console.error("Erro ao carregar gêneros:", erro);
    }
}

function inserirFilmes(lista) {
    content.innerHTML = "";

    lista.forEach((filme) => {
        const card = document.createElement("div");
        card.className = "card";

        // Determina a URL da imagem
        const imageSrc = filme.imagem
            ? filme.imagem
            : filme.poster_path
            ? `https://image.tmdb.org/t/p/w200${filme.poster_path}`
            : "imagem-placeholder.png";

        // Título
        const title = filme.title || filme.name;

        //Gênero

        let genero = "Gênero não disponível";

        if (filme.genero) {
            genero = filme.genero; // manual
        } else if (filme.genre_ids && Array.isArray(filme.genre_ids)) {
            genero = filme.genre_ids
                .map((id) => mapaGeneros[id])
                .filter(Boolean)
                .join(", ");
        }

        //Descriçao
        let descricaoCompleta =
            filme.descricao || filme.overview || "Descrição não disponível.";
        let descricao =
            descricaoCompleta.length > 50
                ? descricaoCompleta.slice(0, 50) + "..."
                : descricaoCompleta;

        // Monta o HTML do card
        card.innerHTML = `
      <img src="${imageSrc}" alt="${title}">
      <h3>${title}</h3>
      ${
          genero
              ? `<p class="genero"><strong>Gênero:</strong> ${genero}</p>`
              : ""
      }

      ${descricao ? `<p class="descricao">${descricao}</p>` : ""}
      <div class="botoes">
  <button class="gostei" onclick="gostei('${filme.id}')">Gostei</button>
  <button class="nao-gostei" onclick="naoGostei('${
      filme.id
  }')">Não Gostei</button>
</div>
<div class="votos">
  <p id="votosGostei-${filme.id}">Votos Positivos: ${getGostei(filme.id)}</p>
  <p id="votosNaoGostei-${filme.id}">Votos Negativos: ${getNaoGostei(
            filme.id
        )}</p>
</div>

    `;

        content.appendChild(card);
    });

    atualizarTotais();
}

function gostei(id) {
    const v = getGostei(id) + 1;
    localStorage.setItem(`votosGostei-${id}`, v);
    document.getElementById(
        `votosGostei-${id}`
    ).innerText = `Votos Positivos: ${v}`;
    atualizarTotais();
}

function naoGostei(id) {
    const v = getNaoGostei(id) + 1;
    localStorage.setItem(`votosNaoGostei-${id}`, v);
    document.getElementById(
        `votosNaoGostei-${id}`
    ).innerText = `Votos Negativos: ${v}`;
    atualizarTotais();
}

function getGostei(id) {
    return parseInt(localStorage.getItem(`votosGostei-${id}`) || "0", 10);
}

function getNaoGostei(id) {
    return parseInt(localStorage.getItem(`votosNaoGostei-${id}`) || "0", 10);
}

function atualizarTotais() {
    let totalGostei = 0;
    let totalNaoGostei = 0;

    filmes.forEach((f) => {
        totalGostei += getGostei(f.id);
        totalNaoGostei += getNaoGostei(f.id);
    });

    document.getElementById(
        "totalGostei"
    ).innerText = `Votos Positivos: ${totalGostei}`;
    document.getElementById(
        "totalNaoGostei"
    ).innerText = `Votos Negativos: ${totalNaoGostei}`;
}

function registrarManual() {
    const titulo = tituloInput.value.trim();
    const genero = generoInput.value.trim();
    const imagem = imagemInput.value.trim();
    const descricao = descricaoInput.value.trim();

    if (!titulo || !genero || !imagem) {
        alert("Preencha título, gênero e URL da imagem.");
        return;
    }

    const id = `manual-${Date.now()}`;
    const novoItem = {
        id,
        name: titulo,
        poster_path: null,
        imagem,
        genero,
        descricao,
    };

    // Salva no localStorage sem exibir
    const filmesManuais = JSON.parse(
        localStorage.getItem("filmesManuais") || "[]"
    );
    filmesManuais.push(novoItem);
    localStorage.setItem("filmesManuais", JSON.stringify(filmesManuais));

    // Limpa o formulário
    tituloInput.value = "";
    generoInput.value = "";
    imagemInput.value = "";
    descricaoInput.value = "";
}

function salvarFilmesManuais() {
    const filmesManuais = filmes.filter((f) =>
        f.id.toString().startsWith("manual-")
    );
    localStorage.setItem("filmesManuais", JSON.stringify(filmesManuais));
}

function carregarFilmesManuais() {
    const salvos = localStorage.getItem("filmesManuais");
    if (salvos) {
        // Apenas carrega os filmes manuais na memória, sem exibir
        const filmesManuais = JSON.parse(salvos);
        // filmes = [...filmesManuais]; ← Remova isso
        // inserirFilmes(filmes); ← Remova isso
    }
}
