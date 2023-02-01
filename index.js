import cluster from 'node:cluster';
import { cpus } from 'node:os';
import process from 'node:process';
import reindex from './reindex.js';
import { loadConfig, createAxiosInstance } from './util.js';


const { source, target, ...config } = loadConfig(['./config.json', './config.local.json']);

if (!source || !target || !config.maxCpus) {
    console.error('Invalid configuration');
    process.exit(1);
}

console.log({ source, target, config });

const numCPUs = Math.min(cpus().length, config.maxCpus);

const targetServer = createAxiosInstance(target);

if (cluster.isPrimary) {


    const sourceServer = createAxiosInstance(source);

    let { data: indices } = await sourceServer.request({
        url: '_cat/indices?format=json'
    });

    let { data: targetIndices } = await targetServer.request({
        url: '_cat/indices?format=json'
    })

    indices = indices.filter((index) => !index.index.startsWith('.'));

    console.log(indices.length);

    console.log(`Primary ${process.pid} is running`);

    let indexIndex = 0;

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork({ forkIndex: i });
        worker.on('message', function ({ topic }) {
            if (topic === 'next') {
                worker.send({ topic: 'index', index: indices[indexIndex++], targetIndices });
            }
        })
    }

    cluster.on('fork', (worker) => {
        console.log('worker is dead:', worker.isDead());
    });

    cluster.on('exit', (worker, code, signal) => {
        console.log('worker is dead:', worker.isDead());
    });
} else {
    const { forkIndex } = process.env;

    process.on('message', async function ({ topic, index, targetIndices }) {
        if (topic === 'index') {
            if (!index) {
                process.exit(0);
            }
            console.log(`#### ${index.index} ####`);
            await reindex({ index, targetIndices, targetServer, source, target, config, forkIndex });

            process.send({ topic: 'next' });
        }
    })
    process.send({ topic: 'next' });
}