import axios from 'axios';
const apiKey = "036386b34f954747a739577b5bcb77d3"

export const api = axios.create({
  baseURL: "https://api.clarifai.com",
  headers: {
    Authorization: `Bearer ${apiKey}`,
  },
})