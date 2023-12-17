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
        await pool.query(
            `
            CREATE TABLE IF NOT EXISTS USER (
                id char(36) not null,
                name varchar(255) not null,
                email varchar(255) not null unique,
                password varchar(255) not null,
                membership_type ENUM('standard', 'premium') DEFAULT 'standard',
                primary key (id)
            )
        `
        );

        // table Restaurant
        await pool.query(
            `
            CREATE TABLE IF NOT EXISTS RESTAURANT (
                id char(36) not null,
                name varchar(255) not null,
                address varchar(255) not null,
                phone_number varchar(255) not null,
                rating decimal(2,1) not null,
                open_time time not null,
                close_time time not null,
                primary key (id)
            )
        `
        );
        // table Food
        await pool.query(
            `
            CREATE TABLE IF NOT EXISTS FOOD (
                id char(36) not null,
                name varchar(255) not null,
                description text not null,
                price decimal(10,2) not null,
                discount_price decimal(10,2) not null,
                quantity int not null default 1,
                image varchar(255) not null,
                restaurant_id char(36) not null,
                primary key (id),
                foreign key (restaurant_id) references RESTAURANT(id)
            )
        `
        );
        // table Order
        await pool.query(
            `
            CREATE TABLE IF NOT EXISTS ORDERS (
                id char(36) not null,
                user_id char(36) not null,
                restaurant_id char(36) not null,
                order_date date not null,
                primary key (id),
                foreign key (user_id) references USER(id),
                foreign key (restaurant_id) references RESTAURANT(id)
            )
        `
        );
        // table Order Detail
        await pool.query(
            `
            CREATE TABLE IF NOT EXISTS ORDER_DETAIL (
                id char(36) not null,
                order_id char(36) not null,
                food_id char(36) not null,
                quantity int not null,
                primary key (id),
                foreign key (order_id) references ORDERS(id),
                foreign key (food_id) references FOOD(id)
            )
        `
        );
        // table Order History
        await pool.query(
            `
            CREATE TABLE IF NOT EXISTS ORDER_HISTORY (
                id char(36) not null,
                user_id char(36) not null,
                restaurant_id char(36) not null,
                order_date date not null,
                status ENUM('success', 'failed') not null,
                primary key (id),
                foreign key (user_id) references USER(id)
            )
        `
        );
        // table Order History Detail
        await pool.query(
            `
            CREATE TABLE IF NOT EXISTS ORDER_HISTORY_DETAIL (
                id char(36) not null,
                order_history_id char(36) not null,
                food_id char(36) not null,
                quantity int not null,
                primary key (id),
                foreign key (order_history_id) references ORDER_HISTORY(id),
                foreign key (food_id) references FOOD(id)
            )
        `
        );  
    } catch (err) {
        console.error("[Error]: ", err);
        throw err;
    }
};