const express = require("express")
const app = express()
const pg = require("pg")
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/the_acme_flavors_db')

app.use(express.json());
app.use(require('morgan')('dev'))


// GET /api/flavors: Returns an array of flavors.
app.get('/api/flavors', async (req, res, next)=>{
    try {
        const SQL = `
            SELECT * from flavors ORDER BY created_at DESC;
        `
        const response = await client.query(SQL)
        res.send(response.rows)
    } catch (error) {
        next(error)
    }
})

// GET /api/flavors/:id: Returns a single flavor.
app.get('/api/flavors/:id', async(req, res, next)=>{
    try {
        const SQL = `
            SELECT * from flavors WHERE id = $1;
        `
        const response = await client.query(SQL, [req.params.id]);
        res.send(response.rows)
    } catch (error) {
        next(error)
    }
})

// POST /api/flavors: Has the flavor to create as the payload, and returns the created flavor.
app.post('/api/flavors', async(req, res, next)=>{
    try {
        const SQL = `
            INSERT INTO flavors(name)
            VALUES($1)
            RETURNING *
        `
        const response = await client.query(SQL, [req.body.name])
        res.send(response.rows[0])
    } catch (error) {
        next(error)
    }
})

// DELETE /api/flavors/:id: Returns nothing.
app.delete('/api/flavors/:id', async(req, res, next)=>{
    try {
        const SQL = `
        DELETE from flavors
        WHERE id=$1
        `;
        const response = await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
})

// PUT /api/flavors/:id: Has the updated flavor as the payload, and returns the updated flavor.
app.put('/api/flavors/:id', async(req, res, next)=>{
    try {
        const SQL = `
            UPDATE flavors
            SET name = $1, is_favorite = $2, updated_at = now() WHERE id = $3 RETURNING *
        `
        const response = await client.query(SQL, [req.body.name, req.body.is_favorite, req.params.id])
        res.send(response.rows[0])
    } catch (error) {
        next(error)
    }
})

const init = async () => {
    await client.connect();
    console.log("connected to database")
    let SQL = `
        DROP TABLE IF EXISTS flavors;
        CREATE TABLE flavors(
            id SERIAL PRIMARY KEY,
            name VARCHAR(50),
            is_favorite BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now()
        )
    `
    await client.query(SQL)
    console.log("Tables created")

    SQL = `
        INSERT INTO flavors(name, is_favorite) VALUES('matcha', true);
        INSERT INTO flavors(name, is_favorite) VALUES('chocolate', true);
        INSERT INTO flavors(name, is_favorite) VALUES('vanilla', false);
        INSERT INTO flavors(name, is_favorite) VALUES('strawberry', false);
        INSERT INTO flavors(name, is_favorite) VALUES('mint chocolate', true);
    `
    await client.query(SQL)
    console.log("data seeded")
    const port = process.env.PORT || 3000
    app.listen(port, () => console.log(`listening on port ${port}`))
}

init();