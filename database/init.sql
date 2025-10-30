IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'AsistenciaDB')
BEGIN
    CREATE DATABASE AsistenciaDB;
END
GO

USE AsistenciaDB;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'employees')
BEGIN
    CREATE TABLE employees (
        id INT PRIMARY KEY IDENTITY(1,1),
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        numeroDocumento VARCHAR(20) NOT NULL UNIQUE
    );
END
GO

    INSERT INTO employees (nombre, apellido, numeroDocumento) VALUES 
    ('Juan', 'Pérez', '12345678'),
    ('María', 'García', '87654321'),
    ('Carlos', 'López', '11223344'),
    ('Ana', 'Martínez', '55667788'),
    ('Luis', 'Rodríguez', '99887766');

GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'attendances')
BEGIN
    CREATE TABLE attendances (
        id INT PRIMARY KEY IDENTITY(1,1),
        employeeId INT NOT NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida')),
        latitud DECIMAL(10, 7) NOT NULL,
        longitud DECIMAL(10, 7) NOT NULL,
        horaRegistro DATETIME NOT NULL,
        createdAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (employeeId) REFERENCES employees(id)
    );
END
GO

GO
