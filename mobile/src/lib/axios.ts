import axios from "axios";

export const api = axios.create({
    baseURL: 'http://172.20.133.9:3333'
});