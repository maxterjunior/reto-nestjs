IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'AsistenciaDB')
BEGIN
    CREATE DATABASE AsistenciaDB;
END
GO

USE AsistenciaDB;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'shifts')
BEGIN
    CREATE TABLE shifts (
        id INT PRIMARY KEY IDENTITY(1,1),
        nombre VARCHAR(100) NOT NULL,
        horaInicio TIME NOT NULL,
        horaFin TIME NOT NULL,
        toleranciaMinutos INT NOT NULL,
        createdAt DATETIME DEFAULT GETDATE()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'employees')
BEGIN
    CREATE TABLE employees (
        id INT PRIMARY KEY IDENTITY(1,1),
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        numeroDocumento VARCHAR(20) NOT NULL UNIQUE,
        shiftId INT NULL,
        FOREIGN KEY (shiftId) REFERENCES shifts(id)
    );
END
GO

-- Insertar turnos de ejemplo
INSERT INTO shifts (nombre, horaInicio, horaFin, toleranciaMinutos) VALUES 
    ('Turno Mañana', '08:00:00', '16:00:00', 15),
    ('Turno Tarde', '14:00:00', '22:00:00', 15),
    ('Turno Noche', '22:00:00', '08:00:00', 15);

GO

-- Insertar empleados de ejemplo
INSERT INTO employees (nombre, apellido, numeroDocumento, shiftId) VALUES 
    ('Juan', 'Pérez', '12345678', 1),
    ('María', 'García', '87654321', 1),
    ('Carlos', 'López', '11223344', 2),
    ('Ana', 'Martínez', '55667788', 2),
    ('Luis', 'Rodríguez', '99887766', 3);

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
