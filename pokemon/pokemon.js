// ===== BASE DE DONNÉES =====
let allPokemons = [];

fetch('pokemonbdd.json')
    .then(res => res.json())
    .then(data => allPokemons = data)
    .catch(err => console.error("Erreur chargement Pokémon:", err));

// ===== LOCAL STORAGE =====
function savePlayerData(player){ localStorage.setItem(`player_${player.username}`, JSON.stringify(player)); }
function loadPlayerData(username){ const data = localStorage.getItem(`player_${username}`); return data ? JSON.parse(data) : null; }

// ===== LOGIN / SIGNUP =====
const loginBtn = document.getElementById('loginBtn');
loginBtn.addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const message = document.getElementById('login-message');
    if(!username || !password){ message.textContent="Remplis tous les champs !"; return; }

    let player = loadPlayerData(username);
    if(!player){
        player = {username,password,coins:50,pokemons:[
            {id:1,lvl:1,dispo:true,inactiveTurns:0},{id:2,lvl:1,dispo:true,inactiveTurns:0},{id:3,lvl:1,dispo:true,inactiveTurns:0}
        ]};
        savePlayerData(player); message.textContent="Compte créé ! Bienvenue " + username;
    } else if(player.password!==password){ message.textContent="Mot de passe incorrect !"; return; }
    else message.textContent="Bienvenue " + username;

    window.currentPlayer = player;
    showGameScreen();
    swipeToGame();
});

// ===== GAME SCREEN =====
const loginScreen = document.getElementById('login-screen');
const gameScreen = document.getElementById('game-screen');
function showGameScreen(){
    loginScreen.classList.remove('active');
    gameScreen.classList.add('active');
    document.getElementById('player-name').textContent = window.currentPlayer.username;
    document.getElementById('coins').textContent = window.currentPlayer.coins;
    renderPokemonBook();
    renderShop();
    renderPlayerPokemons();
}
function swipeToGame(){
    // Animation scroll vertical
    loginScreen.style.transition = "all 0.8s ease";
    loginScreen.style.transform = "translateY(-100vh)";
    setTimeout(()=>{
        loginScreen.classList.add('hidden');
        loginScreen.style.transform = ""; // reset pour prochaine connexion
    }, 800);
}

// ===== POKÉDEX =====
const bookDiv = document.getElementById('pokemon-book');
function renderPokemonBook(){
    bookDiv.innerHTML='';
    allPokemons.forEach(p=>{
        const owned = window.currentPlayer.pokemons.find(pp=>pp.id===p.id);
        const card = document.createElement('div');
        card.classList.add('book-card');
        card.textContent = p.name + (owned ? ` (Lvl ${owned.lvl} | PV:${p.pv} ATK:${p.atk})` : "");
        bookDiv.appendChild(card);
    });
}

// ===== PLAYER POKÉMON LIST =====
const playerPokemonsDiv = document.getElementById('player-pokemons');
let selectedPokemon = null;
function renderPlayerPokemons(){
    playerPokemonsDiv.innerHTML='';
    window.currentPlayer.pokemons.forEach(p=>{
        const pokeData = allPokemons.find(ap=>ap.id===p.id);
        if(p.dispo){
            const card = document.createElement('div');
            card.classList.add('pokemon-card');
            card.textContent = `${pokeData.name} (Lvl:${p.lvl} PV:${pokeData.pv} ATK:${pokeData.atk})`;
            card.addEventListener('click', ()=> selectedPokemon = p);
            playerPokemonsDiv.appendChild(card);
        }
    });
}

// ===== BOUTIQUE =====
const shopBtn = document.getElementById('shopBtn');
const shopDiv = document.getElementById('shop');
const closeShopBtn = document.getElementById('closeShopBtn');
shopBtn.addEventListener('click', ()=> shopDiv.classList.remove('hidden'));
closeShopBtn.addEventListener('click', ()=> shopDiv.classList.add('hidden'));

const shopItemsDiv = document.getElementById('shop-items');
function renderShop(){
    shopItemsDiv.innerHTML='';
    allPokemons.forEach(p=>{
        const owned = window.currentPlayer.pokemons.find(pp=>pp.id===p.id);
        const price = 50 + (p.rarity||1)*50 + (p.lvl||1)*20;
        const card = document.createElement('div');
        card.classList.add('shop-card');
        card.textContent = p.name + (owned ? " (Déjà)" : ` (Lvl 1) - ${price} pièces`);
        card.addEventListener('click', ()=>{
            if(owned){ alert("Tu possèdes déjà ce Pokémon !"); return; }
            if(window.currentPlayer.coins>=price){
                window.currentPlayer.coins-=price;
                window.currentPlayer.pokemons.push({id:p.id,lvl:1,dispo:true,inactiveTurns:0});
                document.getElementById('coins').textContent=window.currentPlayer.coins;
                renderPokemonBook(); renderShop(); alert(`${p.name} ajouté !`);
                savePlayerData(window.currentPlayer);
            } else alert("Pas assez de pièces !");
        });
        shopItemsDiv.appendChild(card);
    });
}

// ===== MODE DÉFI =====
const challengeBtn = document.getElementById('challengeBtn');
const challengeResult = document.getElementById('challenge-result');
challengeBtn.addEventListener('click', ()=>{
    if(!selectedPokemon){ alert("Sélectionne un Pokémon !"); return; }
    const enemy = allPokemons[Math.floor(Math.random()*allPokemons.length)];
    const enemyLvl = Math.floor(Math.random() * 10) + 1; // Lvl aléatoire entre 1 et 10 pour l'ennemi
    const playerPower = (selectedPokemon.lvl * 1.5) + (allPokemons[selectedPokemon.id-1].atk||5) + Math.random()*15;
    const enemyPower = (enemyLvl * 2) + (enemy.atk||5) + Math.random()*20; // Ennemis plus forts

    // Pour rendre les défaites plus fréquentes et équilibrer le jeu, même si le joueur a plus de puissance, il y a une chance de défaite
    const playerWins = playerPower >= enemyPower && Math.random() < 0.6; // 60% chance de victoire si puissance supérieure, sinon défaite

    if(playerWins){
        challengeResult.textContent=`🎉 Victoire ! +10 pièces`;
        window.currentPlayer.coins+=10;
        selectedPokemon.lvl+=1;
    } else {
        // Défaite : Le Pokémon devient inactif pendant 3 tours
        selectedPokemon.inactiveTurns = 3;
        selectedPokemon.dispo = false;
        challengeResult.textContent=`💀 Défaite ! Ton Pokémon ${allPokemons[selectedPokemon.id-1].name} est inactif pendant 3 tours !`;
        selectedPokemon = null; // Réinitialiser la sélection
    }
    
    // Après chaque défi, décrémenter les tours inactifs de tous les Pokémons
    window.currentPlayer.pokemons.forEach(p => {
        if (p.inactiveTurns > 0) {
            p.inactiveTurns -= 1;
            if (p.inactiveTurns <= 0) {
                p.dispo = true;
            }
        }
    });
    
    document.getElementById('coins').textContent=window.currentPlayer.coins;
    renderPokemonBook();
    renderPlayerPokemons(); // Re-rendre la liste des Pokémon pour refléter les changements
    savePlayerData(window.currentPlayer);
});

// ===== DÉCONNEXION =====
document.getElementById('logoutBtn').addEventListener('click', ()=>{
    // Sauvegarde automatique avant déconnexion
    if(window.currentPlayer) savePlayerData(window.currentPlayer);

    // Reset complet de la page (recharge la page entière)
    location.reload();
});