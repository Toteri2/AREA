const { Pool } = require('pg');
const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const ITERATIONS = parseInt(process.env.BENCHMARK_ITERATIONS) || 1000;
const WARMUP = parseInt(process.env.BENCHMARK_WARMUP) || 100;

function percentile(arr, p) {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
}

async function benchmarkPostgres() {
    const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
    const client = await pool.connect();

    console.log('PostgreSQL SELECT Benchmark');

    const userId = uuidv4();
    await client.query('INSERT INTO users (id, email, name, password) VALUES ($1, $2, $3, $4)',
        [userId, 'bench@test.com', 'Bench User', 'password123']);

    const flowId = uuidv4();
    await client.query('BEGIN');
    await client.query('INSERT INTO flows (id, user_id, name) VALUES ($1, $2, $3)',
        [flowId, userId, 'Test Flow']);
    await client.query('INSERT INTO triggers (id, flow_id, type, config) VALUES ($1, $2, $3, $4)',
        [uuidv4(), flowId, 'webhook', '{}']);
    for (let i = 0; i < 3; i++) {
        await client.query('INSERT INTO actions (id, flow_id, ordinal, service, config) VALUES ($1, $2, $3, $4, $5)',
            [uuidv4(), flowId, i, 'discord', '{}']);
    }
    await client.query('COMMIT');

    const times = [];

    console.log('  Warmup...');
    for (let i = 0; i < WARMUP; i++) {
        await selectFlowPostgres(client, flowId);
    }

    console.log(`  Running ${ITERATIONS} iterations...`);
    for (let i = 0; i < ITERATIONS; i++) {
        const start = performance.now();
        await selectFlowPostgres(client, flowId);
        const end = performance.now();
        times.push(end - start);
        if (i % 100 === 0) process.stdout.write('.');
    }
    console.log('\n');

    client.release();
    await pool.end();

    return {
        database: 'PostgreSQL',
        operation: 'SELECT',
        iterations: ITERATIONS,
        median: percentile(times, 50).toFixed(2),
        p95: percentile(times, 95).toFixed(2),
        p99: percentile(times, 99).toFixed(2),
        min: Math.min(...times).toFixed(2),
        max: Math.max(...times).toFixed(2),
    };
}

async function selectFlowPostgres(client, flowId) {
    await client.query(`
        SELECT f.*, t.*, a.*
        FROM flows f
        LEFT JOIN triggers t ON t.flow_id = f.id
        LEFT JOIN actions a ON a.flow_id = f.id
        WHERE f.id = $1
    `, [flowId]);
}

async function benchmarkMySQL() {
    const connection = await mysql.createConnection(process.env.MYSQL_URL);

    console.log('MySQL SELECT Benchmark');

    const userId = uuidv4();
    await connection.execute('INSERT INTO users (id, email, name, password) VALUES (?, ?, ?, ?)',
        [userId, 'bench@test.com', 'Bench User', 'password123']);

    const flowId = uuidv4();
    await connection.beginTransaction();
    await connection.execute('INSERT INTO flows (id, user_id, name) VALUES (?, ?, ?)',
        [flowId, userId, 'Test Flow']);
    await connection.execute('INSERT INTO `triggers` (id, flow_id, type, config) VALUES (?, ?, ?, ?)',
        [uuidv4(), flowId, 'webhook', '{}']);
    for (let i = 0; i < 3; i++) {
        await connection.execute('INSERT INTO actions (id, flow_id, ordinal, service, config) VALUES (?, ?, ?, ?, ?)',
            [uuidv4(), flowId, i, 'discord', '{}']);
    }
    await connection.commit();

    const times = [];

    console.log('  Warmup...');
    for (let i = 0; i < WARMUP; i++) {
        await selectFlowMySQL(connection, flowId);
    }

    console.log(`  Running ${ITERATIONS} iterations...`);
    for (let i = 0; i < ITERATIONS; i++) {
        const start = performance.now();
        await selectFlowMySQL(connection, flowId);
        const end = performance.now();
        times.push(end - start);
        if (i % 100 === 0) process.stdout.write('.');
    }
    console.log('\n');

    await connection.end();

    return {
        database: 'MySQL',
        operation: 'SELECT',
        iterations: ITERATIONS,
        median: percentile(times, 50).toFixed(2),
        p95: percentile(times, 95).toFixed(2),
        p99: percentile(times, 99).toFixed(2),
        min: Math.min(...times).toFixed(2),
        max: Math.max(...times).toFixed(2),
    };
}

async function selectFlowMySQL(connection, flowId) {
    await connection.execute(`
        SELECT f.*, t.*, a.*
        FROM flows f
        LEFT JOIN \`triggers\` t ON t.flow_id = f.id
        LEFT JOIN actions a ON a.flow_id = f.id
        WHERE f.id = ?
    `, [flowId]);
}

async function benchmarkMongo() {
    const client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    const db = client.db();

    console.log('MongoDB SELECT Benchmark');

    const userId = uuidv4();
    await db.collection('users').insertOne({ _id: userId, email: 'bench@test.com', name: 'Bench User', password: 'password123' });

    const flowId = uuidv4();
    await db.collection('flows').insertOne({ _id: flowId, user_id: userId, name: 'Test Flow' });
    await db.collection('triggers').insertOne({ _id: uuidv4(), flow_id: flowId, type: 'webhook', config: {} });
    for (let i = 0; i < 3; i++) {
        await db.collection('actions').insertOne({ _id: uuidv4(), flow_id: flowId, ordinal: i, service: 'discord', config: {} });
    }

    const times = [];

    console.log('  Warmup...');
    for (let i = 0; i < WARMUP; i++) {
        await selectFlowMongo(db, flowId);
    }

    console.log(`  Running ${ITERATIONS} iterations...`);
    for (let i = 0; i < ITERATIONS; i++) {
        const start = performance.now();
        await selectFlowMongo(db, flowId);
        const end = performance.now();
        times.push(end - start);
        if (i % 100 === 0) process.stdout.write('.');
    }
    console.log('\n');

    await client.close();

    return {
        database: 'MongoDB',
        operation: 'SELECT',
        iterations: ITERATIONS,
        median: percentile(times, 50).toFixed(2),
        p95: percentile(times, 95).toFixed(2),
        p99: percentile(times, 99).toFixed(2),
        min: Math.min(...times).toFixed(2),
        max: Math.max(...times).toFixed(2),
    };
}

async function selectFlowMongo(db, flowId) {
    await db.collection('flows').aggregate([
        { $match: { _id: flowId } },
        { $lookup: { from: 'triggers', localField: '_id', foreignField: 'flow_id', as: 'trigger' } },
        { $lookup: { from: 'actions', localField: '_id', foreignField: 'flow_id', as: 'actions' } }
    ]).toArray();
}

(async () => {
    console.log('============================================================');
    console.log('SELECT BENCHMARK');
    console.log('============================================================\n');

    const results = [];

    results.push(await benchmarkPostgres());
    results.push(await benchmarkMySQL());
    results.push(await benchmarkMongo());

    console.log('============================================================\n');
    console.log('RESULTS\n');
    console.table(results);

    const sorted = results.sort((a, b) => parseFloat(a.median) - parseFloat(b.median));
    console.log(`Winner: ${sorted[0].database} (${sorted[0].median}ms median)\n`);

    const fastest = parseFloat(sorted[0].median);
    console.log('Performance Comparison:');
    sorted.forEach((r, i) => {
        if (i === 0) return;
        const ratio = (parseFloat(r.median) / fastest).toFixed(1);
        console.log(`  ${sorted[0].database} is ${ratio}x faster than ${r.database}`);
    });

    process.exit(0);
})();
