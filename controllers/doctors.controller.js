const client = require("../config/db/db.js");

exports.getDoctorsList = async (req, res) => {
    try {
        const data = await client.query(
            `SELECT * FROM animal_doctors 
                WHERE (zipcode ILIKE '${req.body.searchZipCode}' OR zipcode ILIKE '%' || '${req.body.searchZipCode}' || '%')
                AND (city_name ILIKE '${req.body.searchCity}' OR LOWER(city_name) ILIKE '%' || '${req.body.searchCity}' || '%')
                AND profile_permission = true 
                ORDER BY (payment->>'plan'):: int DESC, submit_at DESC 
                OFFSET ${req.body.searchStart} LIMIT ${req.body.searchCount}`
        )
        const totalData = await client.query(
            `SELECT * FROM animal_doctors 
                WHERE (zipcode ILIKE '${req.body.searchZipCode}' OR zipcode ILIKE '%' || '${req.body.searchZipCode}' || '%')
                AND (city_name ILIKE '${req.body.searchCity}' OR LOWER(city_name) ILIKE '%' || '${req.body.searchCity}' || '%')
                AND profile_permission = true 
                ORDER BY (payment->>'plan'):: int DESC, submit_at DESC`
        )
        if (data.rowCount > 0) res.status(200).send({data: data.rows, totalCount:totalData.rowCount});
        else res.status(201).send("No data")
    }
    catch {
        res.status(501).send("error");
    }
}

exports.getItembyId = async (req, res) => {

    try {
        if (req.body.id) {
            const data = await client.query(
                `SELECT * FROM animal_doctors WHERE id = ${req.body.id}`
            );
            if (data.rowCount > 0) {
                res.status(200).send(data.rows[0]);
            }
            else res.status(201).send("no data");
        } else {
            res.status(202).send("id undefined")
        }
    }
    catch {
        res.send("Server error")
    }
}