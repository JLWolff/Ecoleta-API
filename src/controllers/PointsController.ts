import { Request, Response, response, request, json } from 'express';
import knex from '../connection';


class PointsController {
    create(req: Request, res: Response){
        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items,
        } = req.body;
    
        const point = {
            image: req.file.filename,
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
        }

        knex.transaction( trx => {
            trx.insert(point).into('points')
            .returning('id')
            .then(pointId => {
                const point_id = pointId[0];
                const pointItems = items
                .split(',')
                .map((item:string) => Number(item.trim()))
                .map((item_id: number) =>{
                    return {
                        item_id,
                        point_id,
                    }
                })
               return trx.insert(pointItems).into('point_items')
               .then(user => {
                    return res.json({
                        id: point_id,
                        ...point,
                    })
                })
            })
            .then(trx.commit)
            .catch(err => res.status(400).json('erro na linha 36'))
               
        })
    
        .catch(err => res.status(400).json('deu merda total'));
    
        // const pointItems = items
        //     .split(',')
        //     .map((item:string) => Number(item.trim()))
        //     .map((item_id: number) =>{
        //         return {
        //             item_id,
        //             point_id,
        //         }
        //     })
    
        // await trx('point_items').insert(pointItems);

        // await trx.commit();
    
        // return res.json({ 
        //     id: point_id, 
        //     ...point,
        // })
    }

    async show(req: Request, res: Response){
        const { id } = req.params;

        const point = await knex('points').where('id', id).first();

        if(!point){
            return res.status(400).json({message: 'Point not found'});
        }

        const serializedPoint = {
               ...point,
                image_url: `http://192.168.1.14/uploads/${point.image}`
            }
        //SELECT * FROM items
        //JOIN point_items ON items.id = point_items.item_id
        //WHERE point_item.point_id = {id}

        const items = await knex('items')
        .join('point_items', 'items.id', '=', 'point_items.item_id')
        .where('point_items.point_id', id)
        .select('items.title');

        return res.json({point: serializedPoint, items});
    }

    async index(req: Request, res: Response){
        const { city, uf, items } = req.query;

        const parsedItems = String(items)
        .split(',')
        .map(item => Number(item.trim()));

        const points = await knex('points')
            .join('point_items', 'points.id', '=', 'point_items.point_id')
            .whereIn('point_items.item_id', parsedItems)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('points.*');

        const serializedPoints = points.map(point => {
            return { 
               ...point,
                image_url: `http://192.168.1.14:3333/uploads/${point.image}`
            }
        })
    
        return res.json(serializedPoints)    

      
    }
}

export default PointsController;