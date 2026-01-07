CREATE TABLE product_types (
    product_type_id INT AUTO_INCREMENT PRIMARY KEY,
    product_type_name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO product_types (product_type_name)
VALUES
('Laptop'),
('Monitor');

SELECT * FROM product_types;

CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    product_type_id INT NOT NULL,
    CONSTRAINT fk_product_type
        FOREIGN KEY (product_type_id)
        REFERENCES product_types(product_type_id)
        ON DELETE RESTRICT
);

INSERT INTO products (product_name, unit_price, product_type_id)
VALUES
('Dell Inspiron 15', 55000.00, 1),
('HP Pavilion 14', 62000.00, 1),
('Samsung 24 inch Monitor', 12000.00, 2),
('LG 27 inch Monitor', 18000.00, 2);

SELECT * FROM products;

CREATE TABLE sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    amount DECIMAL(10,2) NOT NULL,
    sale_date DATE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    remarks VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON DELETE RESTRICT
);
