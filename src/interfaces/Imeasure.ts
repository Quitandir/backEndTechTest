interface IMeasure {
    customer_code: string,
    measure_type: string,
    measure_id: string,
    measure_datetime: Date,
    measure_year_month: string,
    measure_value: number,
    confirmed: boolean
}

export default IMeasure;