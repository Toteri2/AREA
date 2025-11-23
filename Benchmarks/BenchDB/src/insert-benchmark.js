const { Pool } = require('pg');
const mysql = require('mysql2/promise');
const { MongoClient, ObjectId } = require('mongodb');
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

    console.log('PostgreSQL INSERT Benchmark');

    const userId = uuidv4();
    await client.query('INSERT INTO users (id, email, name, password) VALUES ($1, $2, $3, $4)',
        [userId, 'bench@test.com', 'Bench User', 'password123']);
    const times = [];

    console.log('  Warmup...');
    for (let i = 0; i < WARMUP; i++) {
        await insertFlowPostgres(client, userId);
    }

    console.log(`  Running ${ITERATIONS} iterations...`);
    for (let i = 0; i < ITERATIONS; i++) {
        const start = performance.now();
        await insertFlowPostgres(client, userId);
        const end = performance.now();
        times.push(end - start);

        if (i % 100 === 0) process.stdout.write('.');
    }
    console.log('\n');

    client.release();
    await pool.end();

    return {
        database: 'PostgreSQL',
        operation: 'INSERT',
        iterations: ITERATIONS,
        median: percentile(times, 50).toFixed(2),
        p95: percentile(times, 95).toFixed(2),
        p99: percentile(times, 99).toFixed(2),
        min: Math.min(...times).toFixed(2),
        max: Math.max(...times).toFixed(2),
    };
}

async function insertFlowPostgres(client, userId) {
    await client.query('BEGIN');

    const flowId = uuidv4();
    await client.query(
        'INSERT INTO flows (id, user_id, name, description) VALUES ($1, $2, $3, $4)',
        [flowId, userId, 'Test Flow', 'Benchmark flow']
    );

    const triggerId = uuidv4();
    await client.query(
        'INSERT INTO triggers (id, flow_id, type, config) VALUES ($1, $2, $3, $4)',
        [triggerId, flowId, 'webhook', JSON.stringify({ method: 'POST' })]
    );

    for (let i = 0; i < 3; i++) {
        const actionId = uuidv4();
        await client.query(
            'INSERT INTO actions (id, flow_id, ordinal, service, config) VALUES ($1, $2, $3, $4, $5)',
            [actionId, flowId, i, 'discord', JSON.stringify({ channel: '#test' })]
        );
    }

    await client.query('COMMIT');
}

async function benchmarkMySQL() {
    const connection = await mysql.createConnection(process.env.MYSQL_URL);

    console.log('MySQL INSERT Benchmark');

    const userId = uuidv4();
    await connection.execute(
        'INSERT INTO users (id, email, name, password) VALUES (?, ?, ?, ?)',
        [userId, 'bench@test.com', 'Bench User', 'password123']
    );

    const times = [];

    console.log('  Warmup...');
    for (let i = 0; i < WARMUP; i++) {
        await insertFlowMySQL(connection, userId);
    }

    console.log(`  Running ${ITERATIONS} iterations...`);
    for (let i = 0; i < ITERATIONS; i++) {
        const start = performance.now();
        await insertFlowMySQL(connection, userId);
        const end = performance.now();
        times.push(end - start);

        if (i % 100 === 0) process.stdout.write('.');
    }
    console.log('\n');

    await connection.end();

    return {
        database: 'MySQL',
        operation: 'INSERT',
        iterations: ITERATIONS,
        median: percentile(times, 50).toFixed(2),
        p95: percentile(times, 95).toFixed(2),
        p99: percentile(times, 99).toFixed(2),
        min: Math.min(...times).toFixed(2),
        max: Math.max(...times).toFixed(2),
    };
}

async function insertFlowMySQL(connection, userId) {
    await connection.beginTransaction();

    const flowId = uuidv4();
    await connection.execute(
        'INSERT INTO flows (id, user_id, name, description) VALUES (?, ?, ?, ?)',
        [flowId, userId, 'Test Flow', 'Benchmark flow']
    );

    const triggerId = uuidv4();
    await connection.execute(
        'INSERT INTO triggers (id, flow_id, type, config) VALUES (?, ?, ?, ?)',
        [triggerId, flowId, 'webhook', JSON.stringify({ method: 'POST' })]
    );

    for (let i = 0; i < 3; i++) {
        const actionId = uuidv4();
        await connection.execute(
            'INSERT INTO actions (id, flow_id, ordinal, service, config) VALUES (?, ?, ?, ?, ?)',
            [actionId, flowId, i, 'discord', JSON.stringify({ channel: '#test' })]
        );
    }

    await connection.commit();
}

async function benchmarkMongo() {
    const client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    const db = client.db();

    console.log('MongoDB INSERT Benchmark');

    const userId = new ObjectId();
    await db.collection('users').insertOne({
        _id: userId,
        email: 'bench@test.com',
        name: 'Bench User',
        password: 'password123',
    });

    const times = [];

    console.log('  Warmup...');
    for (let i = 0; i < WARMUP; i++) {
        await insertFlowMongo(client, db, userId);
    }

    console.log(`  Running ${ITERATIONS} iterations...`);
    for (let i = 0; i < ITERATIONS; i++) {
        const start = performance.now();
        await insertFlowMongo(client, db, userId);
        const end = performance.now();
        times.push(end - start);

        if (i % 100 === 0) process.stdout.write('.');
    }
    console.log('\n');

    await client.close();

    return {
        database: 'MongoDB',
        operation: 'INSERT',
        iterations: ITERATIONS,
        median: percentile(times, 50).toFixed(2),
        p95: percentile(times, 95).toFixed(2),
        p99: percentile(times, 99).toFixed(2),
        min: Math.min(...times).toFixed(2),
        max: Math.max(...times).toFixed(2),
    };
}

async function insertFlowMongo(client, db, userId) {
    const session = client.startSession();

    try {
        await session.withTransaction(async () => {
            const flowId = new ObjectId();

            await db.collection('flows').insertOne({
                _id: flowId,
                userId,
                name: 'Test Flow',
                description: 'Benchmark flow',
            }, { session });

            await db.collection('triggers').insertOne({
                _id: new ObjectId(),
                flowId,
                type: 'webhook',
                config: { method: 'POST' },
            }, { session });

            const actions = [];
            for (let i = 0; i < 3; i++) {
                actions.push({
                    _id: new ObjectId(),
                    flowId,
                    ordinal: i,
                    service: 'discord',
                    config: { channel: '#test' },
                });
            }
            await db.collection('actions').insertMany(actions, { session });
        });
    } finally {
        await session.endSession();
    }
}

async function runBenchmarks() {
    console.log('\nINSERT Benchmark\n');
    console.log('='.repeat(60));
    console.log('\n');

    const results = [];

    try {
        results.push(await benchmarkPostgres());
    } catch (err) {
        console.error('PostgreSQL failed:', err);
    }

    try {
        results.push(await benchmarkMySQL());
    } catch (err) {
        console.error('MySQL failed:', err);
    }

    try {
        results.push(await benchmarkMongo());
    } catch (err) {
        console.error('MongoDB failed:', err);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\nRESULTS\n');
    console.table(results);

    const winner = results.reduce((best, curr) =>
        parseFloat(curr.median) < parseFloat(best.median) ? curr : best
    );

    console.log(`\nWinner: ${winner.database} (${winner.median}ms median)`);
}

runBenchmarks().catch(console.error);
