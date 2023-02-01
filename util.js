import fs from 'fs';
import axios from 'axios';
import https from 'https';

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

const createAxiosInstance = ({ host, username, password }) => {
    return axios.create({
        baseURL: host,
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        }),
        auth: {
            username: username,
            password: password
        }
    });
};

export default {
    loadConfig,
    createAxiosInstance
};