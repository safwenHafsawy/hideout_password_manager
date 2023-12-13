-- CREATE USER TABLE
CREATE TABLE IF NOT EXISTS userData (
    id INT NOT NULL PRIMARY KEY,
    username varchar(255) NOT NULL ,
    masterPassword varchar(255) NOT NULL
);

-- CREATE USER  PASSWORDS TABLE

CREATE TABLE IF NOT EXISTS userPasswords (
    id INT NOT NULL PRIMARY KEY,
    platform varchar(255) NOT NULL,
    encryptedPassword TEXT NOT NULL,
    authTags BLOB NOT NULL,
    iv BLOB NOT NULL,
    userId INT NOT NULL,
    
    CONSTRAINT user_fk FOREIGN KEY (userId) REFERENCES userData(id) ON DELETE CASCADE
);
