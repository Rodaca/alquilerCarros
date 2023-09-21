import express from 'express';
import { MongoClient,ObjectId } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const client = new MongoClient(process.env.MONGO_URI);

const db = client.db('Reserva_Coches');
const alquiler = db.collection('alquiler');
const cliente = db.collection('cliente');
const reserva = db.collection('reserva');
const empleado = db.collection('empleado');
const sucursal = db.collection('sucursal');
const sucursal_automovil=db.collection('sucursal_automovil');

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
router.get('/alquiler/filtro/Disponible', async (req, res)=>{
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

/* Listar todos los alquileres activos junto con los datos de los clientes relacionados. */
router.get('/alquiler/filtro/Pendiente', async (req, res)=>{
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
router.get('/reserva/filtro/Pendiente', async (req, res)=>{
  try {
      await client.connect();
      const result = await reserva.aggregate([
        {
          $match: { Estado: "Pendiente" } // Filtra las reservas pendientes
        },
        {
          $lookup: {
            from: "cliente",
            localField: "ID_Cliente",
            foreignField: "_id",
            as: "cliente"
          }
        },
        {
          $unwind: "$cliente" // Desnormaliza el resultado del $lookup de clientes
        },
        {
          $lookup: {
            from: "automovil",
            localField: "ID_Automovil",
            foreignField: "_id",
            as: "automovil"
          }
        },
        {
          $unwind: "$automovil" // Desnormaliza el resultado del $lookup de automoviles
        },
        {
          $project: {
            _id: 0,
            "cliente.Nombre": 1,
            "cliente.Apellido": 1,
            "cliente.CC": 1,
            "cliente.Tipo": 1,
            "cliente.Direccion": 1,
            "cliente.Telefono": 1,
            "cliente.Email": 1,
            "automovil.Marca": 1,
            "automovil.Modelo": 1,
            "automovil.Anio": 1,
            "automovil.Tipo": 1,
            "automovil.Capacidad": 1,
            "automovil.Precio_Diario": 1,
          }
        }
      ]).toArray();
      res.json(result)
      client.close();
  } catch (error) {
      res.status(404).json({message: error.message});
  }
});

/* Obtener los detalles del alquiler con el ID_Alquiler específico. */
router.get('/alquiler/filtro/:id', async (req, res)=>{
  try {
      const id = req.params.id;
      await client.connect();
      const result = await alquiler.find({ _id: new ObjectId(id) }).toArray();
      res.json(result)
      client.close();
  } catch (error) {
      res.status(404).json({message: error.message});
  }
});

/* Listar los empleados con el cargo de "Vendedor" */
router.get('/empleado/filtro/Vendedor', async (req, res)=>{
  try {
      await client.connect();
      const result = await empleado.find({ Cargo: "Vendedor" }).toArray();
      res.json(result)
      client.close();
  } catch (error) {
      res.status(404).json({message: error.message});
  }
});

/* Mostrar la cantidad total de automóviles disponibles en cada sucursal. */
router.get('/sucursal_automovil/total/automovil', async (req, res)=>{
  try {
      await client.connect();
      const result = await sucursal_automovil.aggregate([
        {
          $group: {
            _id: "$ID_Sucursal",
            totalAutomoviles: { $sum: "$Cantidad_Disponible" }
          }
        },
        {
          $lookup: {
            from: "sucursal",
            localField: "ID_Sucursal",
            foreignField: "_id",
            as: "sucursal"
          }
        },
        {
          $unwind: "$sucursal"
        },
        {
          $project: {
            totalAutomoviles:1
          }
        }
      ]).toArray();
      res.json(result)
      client.close();
  } catch (error) {
      res.status(404).json({message: error.message});
  }
});










export default router;
/* 
router.get('/tabla/filtro/', async (req, res)=>{
    try {
        await client.connect();
        const result = await tabla.find().toArray();
        res.json(result)
        client.close();
    } catch (error) {
        res.status(404).json({message: error.message});
    }
});
 */