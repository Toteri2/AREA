# Benchmark Performance - PostgreSQL vs MySQL vs MongoDB

Scripts de benchmark pour comparer les performances des 3 bases de données sur des transactions ACID typiques d'AREA (création flow + trigger + actions).

📖 **Documentation complète :** [GitBook](https://epitech-26.gitbook.io/area/)

---

## Lancer le benchmark

### 1. Démarrer les bases de données
```bash
docker-compose up -d
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Lancer le benchmark
```bash
npm run benchmark:insert
```

---

## Arrêter les containers

```bash
docker-compose down
```

---

## Test réalisé

**Test réalisé :** Création atomique d'un flow complet en transaction ACID
- 1 flow
- 1 trigger
- 3 actions

**Mesure :** Temps d'exécution médian sur 100 itérations pour chaque base de données.

**Résultats obtenus :**
- PostgreSQL : ~5ms 🏆
- MySQL : ~11ms
- MongoDB : ~6ms
