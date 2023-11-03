import { FastifyInstance } from 'fastify'
import { prisma } from "./prisma"


export async function appRoutes(app:FastifyInstance){
    app.post('/habits',async () => {
        
    })
}