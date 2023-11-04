import { FastifyInstance } from 'fastify'
import { z } from "zod" /**Biblioteca para tipagem automática. */
import dayjs, { Dayjs} from "dayjs" /**Biblioteca para trabalhar com datas. */
import { prisma } from "./prisma"

export async function appRoutes(app:FastifyInstance){
    app.post('/habits',async (request) => {
        const createHabitBody = z.object({
            title: z.string(),
            weekDays: z.array(
                z.number().min(0).max(6)
            )
        })
                
        const { title, weekDays } = createHabitBody.parse(request.body)

        const today = dayjs().startOf('day').toDate()/**Método startOf zera o horário da data. */

        await prisma.habit.create({ /**Função para popular tabela. */
            data:{
                title,
                created_at: today,
                weekDays: {
                    create: weekDays.map(weekDay => {
                        return{
                            week_day: weekDay,
                        }
                    })
                }
            }
        })
    })

    app.get('/day',async (request) => {
        const getDayParams = z.object({
            date: z.coerce.date() /**Método "z.coerce" recebe a string do front e converte em date. */
        })

        const { date } = getDayParams.parse(request.query)

        const parsedDate = dayjs(date).startOf('day')
        const weekDay = dayjs(date).get('day')

        //Todos hábitos posíveis.
        //Hábitos qu já foram completados.

        const possibleHabits = await prisma.habit.findMany({
            where:{
                created_at:{
                    lte: date,
                },
                weekDays:{
                    some:{
                        week_day: weekDay,
                    }
                }
            }
        })

        const day = await prisma.day.findUnique({
            where:{
                date:parsedDate.toDate(),
            },
            include: {
                dayHabits: true,
            }
        })
        
        const completedHabits = day?.dayHabits.map(dayHabit =>{
            return dayHabit.habit_id
        })

        return{
            possibleHabits,
            completedHabits,
        }

    })
}