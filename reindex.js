import ElasticDump from 'elasticdump';
import elasticDumpDefaults from './elasticdump-defaults.js';

const delay = (t, val) => new Promise(resolve => setTimeout(resolve, t, val));

const createUrl = ({ host, username, password }) => host.replace('//', `//${encodeURI(username)}:${encodeURI(password)}@`);

const offThrottle = {
    "index": {
        "number_of_replicas": 0,
        "refresh_interval": -1
    }
};

const onThrottle = {
    "index": {
        "number_of_replicas": 2,
        "refresh_interval": "30s"
    }
};

const runDump = function (options) {
    const dumper = new ElasticDump({ ...elasticDumpDefaults, ...options })
    dumper.on('log', function (message) { console.log(message) })
    //dumper.on('debug', function (message) { console.debug(message) })
    dumper.on('error', function (error) { console.log(options); console.error(error) })

    return new Promise((resolve, reject) => {
        dumper.dump(function (error) {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

const reindex = async function ({ index, targetIndices, targetServer, source, target, config, forkIndex }) {
    const indexName = index.index;
    const input = `${createUrl(source)}/${indexName}`;
    const output = `${createUrl(target)}/${indexName}`;
    let existing = targetIndices.find((idx) => idx.index === index.index);
    if (existing) {
        if (config.deleteIfExists !== true && existing["docs.count"] === index["docs.count"]) {
            return;
        }
        console.log(`Deleting... ${indexName}`);
        await targetServer.request({ method: 'DELETE', url: indexName });
    }
    try {
        await runDump({ input, output, type: 'settings', forkIndex });
    } catch (err) {
        console.log(`*** ${indexName} ***`);
        throw err;
    }
    await runDump({ input, output, type: 'mapping' });
    try {
        const { status, statusText, data } = await targetServer.put(`${indexName}/_settings`, offThrottle);
        console.log({ status, statusText, data });
    } catch (err) {
        console.log('Error updating offThrottle');
    }
    await runDump({ input, output, type: 'data', limit: 10000 });
    try {
        await targetServer.put(`${indexName}/_settings`, onThrottle);
    } catch (err) {
        console.log('Error updating onThrottle');
    }
}

export default reindex;