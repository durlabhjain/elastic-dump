import fs from 'fs';
import axios from 'axios';
import Agent from "agentkeepalive";

const loadConfig = (files, defaultConfig) => {
    const finalConfig = { ...defaultConfig };   // beware this does shallow copy
    for (const file of files) {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file);
            Object.assign(finalConfig, JSON.parse(content))
        }
    }
    return finalConfig;
}

const httpAgent = new Agent({
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 60000,
    rejectUnauthorized: false,
    freeSocketTimeout: 30000,
});

const httpsAgent = new Agent.HttpsAgent({
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 60000,
    rejectUnauthorized: false,
    freeSocketTimeout: 30000,
});

const createAxiosInstance = ({ host, username, password }) => {
    return axios.create({

        baseURL: host,
        httpsAgent,
        httpAgent,
        auth: {
            username: username,
            password: password
        }
    });
};

export {
    loadConfig,
    createAxiosInstance
};