const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const { API_KEY, SEARCH_ENGINE_ID } = require('./keys');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

function cleanFilename(filename) {
    return filename.replace(/[\\/*?:"<>|]/g, '');
}

function buildPayload(query, start = 1, num = 10, dateRestrict = 'm1', params = {}) {
    return {
        key: API_KEY,
        q: query,
        cx: SEARCH_ENGINE_ID,
        start: start,
        num: num,
        dateRestrict: dateRestrict,
        ...params
    };
}

async function makeRequest(payload) {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', { params: payload });

    if (response.status !== 200) {
        throw new Error('Request Failed');
    }

    return response.data;
}

async function main(query, resultTotal = 10) {
    const items = [];
    const rem = resultTotal % 10;
    const pages = rem > 0 ? Math.floor(resultTotal / 10) + 1 : resultTotal / 10;

    for (let i = 0; i < pages; i++) {
        const start = (i + 1) * 10;
        const num = (pages === i + 1 && rem > 0) ? rem : 10;
        const payload = buildPayload(query, start, num);
        const response = await makeRequest(payload);
        items.push(...response.items);
    }

    return items.map(item => item.link);
}

app.get('/', (req, res) => {
    res.send(`
        <form action="/search" method="post">
            <label for="query">Search Query:</label>
            <input type="text" id="query" name="query">
            <button type="submit">Search</button>
        </form>
    `);
});

const fs = require('fs');
app.post('/search', async (req, res) => {
    try {
        const { query } = req.body;
        const results = await main(query, 10);

        // Write results to a text file
        fs.writeFile('search_results.txt', results.join('\n'), (err) => {
            if (err) {
                console.error('Error writing to file', err);
            } else {
                console.log('Results successfully written to search_results.txt');
            }
        });
        res.send(`
            <h1>Search Results for "${query}"</h1>
            <ul>
                ${results.map(link => `<li><a href="${link}">${link}</a></li>`).join('')}
            </ul>
            <a href="/">Back</a>
        `);
    } catch (error) {
        res.status(500).send('An error occurred while processing your request.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
