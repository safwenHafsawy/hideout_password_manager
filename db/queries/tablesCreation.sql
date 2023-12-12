-- CREATE USER TABLE
CREATE TABLE IF NOT EXISTS userData (
    username varchar(255) NOT NULL PRIMARY KEY,
    masterPassword varchar(255) NOT NULL
);

-- CREATE USER  PASSWORDS TABLE

CREATE TABLE IF NOT EXISTS userPasswords (
    id INT NOT NULL PRIMARY KEY,
    platform varchar(255) NOT NULL,
    username varchar(255) NOT NULL,
    CONSTRAINT user_fk FOREIGN KEY (username) REFERENCES userData(username)
);
