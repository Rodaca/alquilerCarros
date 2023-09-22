import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
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
const automovil = db.collection('automovil');

/* Mostrar todos los clientes registrados en la base de datos. */
router.get('/cliente/all', async (req, res) => {
  try {
    await client.connect();
    const result = await cliente.find().toArray();
    res.json(result)
    client.close();
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

//Obtener todos los automóviles disponibles para alquiler.
router.get('/alquiler/filtro/Disponible', async (req, res) => {
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
    res.status(404).json({ message: error.message });
  }
});

/* Listar todos los alquileres activos junto con los datos de los clientes relacionados. */
router.get('/alquiler/filtro/Pendiente', async (req, res) => {
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
    res.status(404).json({ message: error.message });
  }
});

/* Mostrar todas las reservas pendientes con los datos del cliente y el automóvil reservado. */
router.get('/reserva/filtro/Pendiente', async (req, res) => {
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
    res.status(404).json({ message: error.message });
  }
});

/* Obtener los detalles del alquiler con el ID_Alquiler específico. */
router.get('/alquiler/filtro/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await client.connect();
    const result = await alquiler.find({ _id: new ObjectId(id) }).toArray();
    res.json(result)
    client.close();
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

/* Listar los empleados con el cargo de "Vendedor" */
router.get('/empleado/filtro/Vendedor', async (req, res) => {
  try {
    await client.connect();
    const result = await empleado.find({ Cargo: "Vendedor" }).toArray();
    res.json(result)
    client.close();
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

/* Mostrar la cantidad total de automóviles disponibles en cada sucursal. */
router.get('/sucursal_automovil/total/automovil', async (req, res) => {
  try {
    await client.connect();
    const result = await sucursal.aggregate([
      {
        $lookup: {
          from: "sucursal_automovil",
          localField: "_id",
          foreignField: "ID_Sucursal",
          as: "sucursal_automovil"
        }
      },
      {
        $unwind: "$sucursal_automovil"
      },
      {
        $group: {
          _id: "$_id",
          Total_automoviles: {
            $sum: "$sucursal_automovil.Cantidad_Disponible"
          },
          Sucursal: {
            $first: "$$ROOT" // Conserva la información de orders
          }
        }
      },
      {
        $project: {
          "_id": 0,
          "Total_automoviles": 1,
          "Sucursal.Nombre": 1,
          "Sucursal.Direccion": 1,
          "Sucursal.Telefono": 1,

        }
      }
    ]).toArray();
    res.json(result)
    client.close();
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

/* Obtener el costo total de un alquiler específico. */
router.get('/alquiler/CostoTotal/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await client.connect();
    const result = await alquiler.find({ _id: new ObjectId(id) }).toArray();
    const resultTotal = result[0].CostoTotal;
    res.json(resultTotal)
    client.close();
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

/* Listar los clientes con el DNI específico. */
router.get('/cliente/filtro/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await client.connect();
    const result = await cliente.find({ _id: new ObjectId(id) }).toArray();
    res.json(result)
    client.close();
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

/* Obtener los detalles del alquiler que tiene fecha de inicio en '2023-07-05'. */
router.get('/alquiler/filtro/FechaInicio/:dato', async (req, res) => {
  try {
    const dato = req.params.dato;
    await client.connect();
    const result = await alquiler.find({ FechaInicio: dato }).toArray();
    res.json(result)
    client.close();
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

/* Listar las reservas pendientes realizadas por un cliente específico. */
router.get('/reserva/filtro/Pendiente/cliente/:id', async (req, res) => {
  try {
    await client.connect();
    const id = req.params.id;
    const result = await reserva.find(
      { ID_Cliente: new ObjectId(id), Estado: "Pendiente" }
    ).toArray();
    res.json(result)
    client.close();
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});
/* Mostrar los empleados con cargo de "Gerente" o "Asistente". */
router.get('/empleado/filtro/Gerente/Asistente', async (req, res) => {
  try {
    await client.connect();
    const result = await empleado.find({
      $or: [{ Cargo: "Asistente" }, { Cargo: "Gerente" }]
    }).toArray();
    res.json(result)
    client.close();
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

/* Obtener los datos de los clientes que realizaron almenos un alquiler. */
router.get('/cliente/filtro', async (req, res) => {
  try {
    await client.connect();
    const result = await cliente.aggregate([
      {
        $lookup: {
          from: "alquiler",
          localField: "_id",
          foreignField: "ID_Cliente",
          as: "alquiler"
        }
      },
      {
        $match: {
          "alquileres": {$not: { $size: 0 } }
        }
      },
      {
        $unwind: "$alquiler"
      },
      {
        "$project": {
            "_id":1,
            "Nombre": 1,
            "Apellido": 1,
            "CC": 1,
            "Direccion": 1,
            "Telefono": 1,
            "Email": 1
        }
    }
    ]).toArray();
    res.json(result)
    client.close();
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

/* Listar todos los automóviles ordenados por marca y modelo. */
router.get('/automovil/orden/automovil/marca', async (req, res)=>{
  try {
      await client.connect();
      const result = await automovil.find()
      .sort({ "Marca": 1, "Modelo": 1 })
      .toArray();
      res.json(result)
      client.close();
  } catch (error) {
      res.status(404).json({message: error.message});
  }
});

/* Mostrar la cantidad total de automóviles en cada sucursal junto con su dirección. */
router.get('/sucursal_automovil/total/automovil/direccion', async (req, res) => {
  try {
    await client.connect();
    const result = await sucursal.aggregate([
      {
        $lookup: {
          from: "sucursal_automovil",
          localField: "_id",
          foreignField: "ID_Sucursal",
          as: "sucursal_automovil"
        }
      },
      {
        $unwind: "$sucursal_automovil"
      },
      {
        $group: {
          _id: "$_id",
          Total_automoviles: {
            $sum: "$sucursal_automovil.Cantidad_Disponible"
          },
          Sucursal: {
            $first: "$$ROOT" // Conserva la información de orders
          }
        }
      },
      {
        $project: {
          "_id": 0,
          "Total_automoviles": 1,
          "Sucursal.Nombre": 1,
          "Sucursal.Direccion": 1,

        }
      }
    ]).toArray();
    res.json(result)
    client.close();
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

/* Obtener la cantidad total de alquileres registrados en la base de datos. */
router.get('/alquiler/contar', async (req, res)=>{
  try {
      await client.connect();
      const result = await alquiler.countDocuments();
      res.json(result)
      client.close();
  } catch (error) {
      res.status(404).json({message: error.message});
  }
});
/* Mostrar los automóviles con capacidad iguala 5 personas y que estén disponibles. */
router.get('/automovil/filtro/capacidad/:dato', async (req, res)=>{
  try {
      await client.connect();
      const dato = parseInt(req.params.dato);
      
      const result = await automovil.aggregate([
        {
          $lookup: {
            from: "alquiler",
            localField: "_id",
            foreignField: "ID_Automovil",
            as: "alquiler"
          }
        },
        {
          $match: {
            $and: [
              { "Capacidad": dato },
              { "alquiler.Estado": "Finalizado" }
            ]
          }
        },
        {
          $unwind: "$alquiler"
        },
        {
          "$project": {
              "_id":0,
              "Modelo":1,
              "Capacidad":1,
              "alquiler.Estado":1
          }
      }
          
        

      ]).toArray();
      res.json(result)
      client.close();
  } catch (error) {
      res.status(404).json({message: error.message});
  }
});
/* Listar los alquileres con fecha de inicio entre '2023-07-05' y '2023-07-10'. */
router.get('/alquiler/all', async (req, res) => {
  try {
    await client.connect();
    const result = await alquiler.find(
      {
        "FechaInicio": {
          $gte: "2023-07-05", 
          $lte: "2023-07-10" 
        }
      }
    ).toArray();
    res.json(result)
    client.close();
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

export default router;
