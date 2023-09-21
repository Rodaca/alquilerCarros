import express from 'express';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const client = new MongoClient(process.env.MONGO_URI);

const db = client.db('Reserva_Coches');
const alquiler = db.collection('alquiler');
const cliente = db.collection('cliente');

/* Mostrar todos los clientes registrados en la base de datos. */
router.get('/cliente/all', async (req, res)=>{
    try {
        await client.connect();
        const result = await cliente.find().toArray();
        res.json(result)
        client.close();
    } catch (error) {
        res.status(404).json({message: error.message});
    }
});

//Obtener todos los automóviles disponibles para alquiler.
router.get('/alquiler/filtroDisponible', async (req, res)=>{
    try {
        await client.connect();
        const result = await alquiler.aggregate([
            {
              $match: {
                Estado: "Finalizado"
              }
            },
            {
              $lookup: {
                from: "automovil",
                localField: "ID_Automovil",
                foreignField: "_id",
                as: "Automovil"
              }
            },
            {
              $unwind: "$Automovil"
            },
            {
              $project: {
                _id: 0,
                "Automovil.Marca": 1,
                "Automovil.Modelo": 1,
                "Automovil.Anio": 1,
                "Automovil.Tipo": 1,
                "Automovil.Capacidad": 1,
                "Automovil.Precio_Diario": 1,
                "Estado": 1,
              }
            }
          ]).toArray();
        res.json(result)
        client.close();
    } catch (error) {
        res.status(404).json({message: error.message});
    }
});

/* Listar todos los alquileres activos junto con los datos de los
clientes relacionados. */
router.get('/alquiler/filtroPendiente', async (req, res)=>{
    try {
        await client.connect();
        const result = await alquiler.aggregate([
            {
              $match: {
                Estado: "Pendiente"
              }
            },
            {
              $lookup: {
                from: "cliente",
                localField: "ID_Cliente",
                foreignField: "_id",
                as: "Cliente"
              }
            },
            {
              $unwind: "$Cliente"
            },
            {
              $project: {
                _id: 0,
                "Cliente.Nombre": 1,
                "Cliente.Apellido": 1,
                "Cliente.CC": 1,
                "Cliente.Tipo": 1,
                "Cliente.Direccion": 1,
                "Cliente.Telefono": 1,
                "Cliente.Email": 1,
                "FechaInicio": 1,
                "FechaFin": 1,
                "CostoTotal": 1,
              }
            }
          ]).toArray();
        res.json(result)
        client.close();
    } catch (error) {
        res.status(404).json({message: error.message});
    }
});

/* Mostrar todas las reservas pendientes con los datos del cliente y el automóvil reservado. */


export default router;