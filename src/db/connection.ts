import mysql, { Pool } from "mysql2/promise";

export let pool: Pool;

export const init = () => {
    try {
        pool = mysql.createPool({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DB,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.debug("Database connected!");
    } catch (error) {
        console.error("[Error]: ", error);
        throw new Error("Fail to connect database!");
    }
};

export const migration = async () => {
    try {
        // table Restaurant
        await pool.query(
            `
            CREATE TABLE IF NOT EXISTS restaurant (
                id char(36) not null,
                name varchar(255) not null,
                address varchar(255) not null,
                phone_number varchar(255) not null,
                rating float not null,
                primary key (id)
            )
        `
        );
        // table Food
        await pool.query(
            `
            CREATE TABLE IF NOT EXISTS food (
                id char(36) not null,
                name varchar(255) not null,
                description text not null,
                price decimal(10,2) not null,
                restaurant_id char(36) not null,
                primary key (id),
                foreign key (restaurant_id) references restaurants(id)
            )
        `
        );
    } catch (err) {
        console.error("[Error]: ", err);
        throw err;
    }
};