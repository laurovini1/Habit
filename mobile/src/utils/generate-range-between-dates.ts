import dayjs from 'dayjs'

export function generateDatesFromYearStart(){
    const startDate = dayjs().startOf('year')
    const endDate = new Date()

    let dateRenge = []
    let compareDate = startDate

    while(compareDate.isBefore(endDate)){
        dateRenge.push(compareDate.toDate())
        compareDate = compareDate.add(1, 'day')
    }   
    return dateRenge
}