
<h1>Caixeiro Viajante</h1>

<p>
O problema do caixeiro-viajante é um dos problemas mais abordados na computação em áreas como: inteligência artificial, redes ou arquitetura de computadores. 
Esse trabalho tem como objetivo implementar o problema do caixeiro viajante através de 3 soluções distintas, no qual o usuário é livre para realização de testes com grafo de sua escolha.
As abordagens envolvem soluções:
</p>
<ul>
  <li>MST</li>
  <li>Algoritmo Genético</li>
  <li>Brute Force</li>
</ul>
<p>
 O objetivo é percorrer todos nós do grafo retornando ao nó inicial matemáticamente o problema é descrito como:
</p>

$$
\min \sum_{i=1}^{n-1} d(v_i,v_{i+1}) + d(v_n,v_1)
$$
onde:
$$
v_i \text{é a cidade visitada na posição i}
$$
$$
d(v_i,v_j) \text{é a distância entre as cidades } v_i \text{ e } v_j
$$
$$
\text{O objetivo é minimizar a distância total percorrida}
$$
$$
\text{O último termo } d(v_n, v_1) \text{ garante o retorno a cidade inicial}
$$

<h1>Algoritmo 2-aproximativo para TSP métrico</h1>

<p>
  O algoritmo de aproximação por Árvore Geradora Mínima (AGM) constrói uma árvore de menor custo que conecta todas as cidades e utiliza um percurso sobre essa árvore para gerar a rota do caixeiro viajante. Embora não encontre necessariamente a solução ótima, garante uma solução com custo de, no máximo, duas vezes o valor ótimo para instâncias métricas do problema, sendo uma alternativa eficiente para grafos maiores.
</p>

<h1>Algoritmo Genético - Metaheurística</h1>

<p>
O Algoritmo Genético busca encontrar boas soluções para o Problema do Caixeiro Viajante simulando o processo de evolução natural. Cada indivíduo da população representa uma rota que visita todas as cidades.
A cada geração, as melhores rotas são selecionadas e combinadas para gerar novas soluções. Pequenas alterações aleatórias (mutações) também são aplicadas para aumentar a diversidade da população e evitar mínimos locais.
Após várias gerações, o algoritmo retorna a melhor rota encontrada. Embora não garanta a solução ótima, geralmente produz resultados de alta qualidade em um tempo muito menor que métodos exatos.
</p>

<h1>Força-bruta</h1>

<p>
O algoritmo de força bruta para o Problema do Caixeiro Viajante gera todas as rotas possíveis entre as cidades, calcula o custo de cada uma e seleciona a de menor valor. Essa abordagem garante a solução ótima, porém possui alta complexidade computacional, de ordem $O((n−1)!)$, tornando-se viável apenas para problemas com poucas cidades.
<p>


<h1>Tecnologias</h1>
<p align="left">

 <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" />
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white"/>
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/D3.JS-%23000000?style=for-the-badge&logo=D3&logoColor=#ff823e"/>
</p>

<h1>Estrutura do Projeto</h1>

```text
.
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   └── Header.tsx
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .gitignore
├── package.json
└── package-lock.json
```

<h1>Clonar o Projeto</h1>
<p>Para clonar o projeto digite o comando abaixo</p>


```
git clone https://github.com/joaoAngelo2/Caixeiro-Viajante
```


<h1>Video de Exemplo</h1>
<p align="center">
  <a href="https://youtu.be/28v7C2DNb10">
    <img src="https://img.youtube.com/vi/28v7C2DNb10/maxresdefault.jpg" width="700">
  </a>
</p>

<h1>Aplicação</h1>

[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?logo=vercel)](https://meu-projeto.vercel.app)
