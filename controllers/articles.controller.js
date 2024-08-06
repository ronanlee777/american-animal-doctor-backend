const client = require("../config/db/db.js");

exports.search = async (req, res) => {
    try {
        const { searchVal, currentVal, pageSize } = req.body;
        const startVal = (currentVal - 1) * pageSize;
        const data = await client.query(
            `SELECT * FROM articles
            WHERE (title ILIKE '${searchVal}' OR title ILIKE '%' || '${searchVal}' || '%')
            OR (content ILIKE '${searchVal}' OR content ILIKE '%' || '${searchVal}' || '%') 
            OFFSET ${startVal} LIMIT ${pageSize}`
        )
        const totalData = await client.query(
            `SELECT * FROM articles
            WHERE (title ILIKE '${searchVal}' OR title ILIKE '%' || '${searchVal}' || '%')
            OR (content ILIKE '${searchVal}' OR content ILIKE '%' || '${searchVal}' || '%')`
        )
        res.status(200).send({data: data.rows, totalCount:totalData.rowCount});
    }
    catch {
        res.status(501).send("Server Error");
    }
}

exports.addArticle = async (req, res) => {
    try {
        const created_at = new Date();
        const formattedDate = created_at.toISOString();
        await client.query(
            `INSERT INTO articles (title, img_url, content, sub_content, avatar, author, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            ["", "", "", "", "", "", formattedDate]
        )
        const data = await client.query(
            `SELECT * FROM articles`
        )
        res.status(200).send(data.rows);
    }
    catch {
        res.status(501).send("Server Error");
    }
}

exports.getAllArticles = async (req, res) => {
    try {
        const data = await client.query(
            `SELECT * FROM articles`
        )
        res.status(200).send(data.rows);
    }
    catch {
        res.status(501).send("Server Error");
    }
}

exports.remove = async (req, res) => {
    try {
        const { id } = req.body;
        await client.query(
            `DELETE FROM articles WHERE id = ${id}`
        );
        const data = await client.query(
            `SELECT * FROM articles`
        );
        res.status(200).send(data.rows)
    }
    catch {
        res.status(501).send("Server Error");
    }
}

exports.submit = async (req, res) => {
    try {
        console.log(req.body);
        const { id, title, content, sub_content, author, avatar,img_url } = req.body;
        const created_at = new Date();
        const formattedDate = created_at.toISOString();
        await client.query(
            `UPDATE articles 
            SET title = $1, content = $2, sub_content = $3, img_url = $4, author = $5, avatar = $6, created_at = $7
            WHERE id = ${id}`,
            [title, content, sub_content, img_url, author, avatar, formattedDate]
        );
        const data = await client.query(
            `SELECT * FROM articles`
        );
        res.status(200).send(data.rows)
    }
    catch {
        res.status(501).send("Server Error");
    }
}

exports.getById = async (req, res) => {
    try {
        const { id } = req.body;
        const data = await client.query(
            `SELECT * FROM articles WHERE id = ${id}`
        )
        res.status(200).send(data.rows[0]);
    }
    catch {
        res.status(501).send("Server Error");
    }
}

exports.latest = async (req, res) => {
    try {
        const data = await client.query(
            `SELECT * FROM articles ORDER BY created_at DESC LIMIT 6`
        )
        res.status(200).send(data.rows);
    }
    catch {
        res.status(501).send("Server Error");
    }
}