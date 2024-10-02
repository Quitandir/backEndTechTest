export default function monthYearParser(fullDate: Date) {
    // Parse the date
    const date = new Date(fullDate);
    const month = date.getMonth();
    const year = date.getFullYear();
    let year_month;
    if (month < 9) {
        year_month = `${year}-0${month + 1}`
    } else {
        year_month = `${year}-${month + 1}`
    }
    return year_month;
}