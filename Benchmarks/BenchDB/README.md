# Benchmark Performance - PostgreSQL vs MySQL vs MongoDB

Benchmark scripts to compare the performance of the 3 databases on typical AREA ACID transactions (flow + trigger + actions creation).

**Full documentation:** [GitBook](https://epitech-26.gitbook.io/area/)

---

## Run the benchmark

### 1. Start the databases
```bash
docker-compose up -d
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the benchmark
```bash
npm run benchmark:insert
```

---

## Stop the containers

```bash
docker-compose down
```

---

## Test performed

**Test performed:** Atomic creation of a complete flow in an ACID transaction
- 1 flow
- 1 trigger
- 3 actions

**Measurement:** Median execution time over 100 iterations for each database.

**Results obtained:**
- PostgreSQL: ~5ms 🏆
- MySQL: ~11ms
- MongoDB: ~6ms

---

## Full Analysis and Final Choice

**[See detailed analysis and complete justification](docs/verdict.md)**

**Summary:** PostgreSQL 16 was selected for AREA thanks to its superior performance on ACID transactions (2.2x faster than MySQL), native JSONB support for flexible service configurations, and optimal integration with TypeORM/NestJS.
