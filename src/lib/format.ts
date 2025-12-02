/**
 * Formata um valor numérico para moeda brasileira (BRL)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada como moeda brasileira
 * @example formatCurrency(1234.56) // "R$ 1.234,56"
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

/**
 * Formata um valor numérico para percentual
 * @param value - Valor numérico a ser formatado (0-1 ou 0-100)
 * @param decimals - Número de casas decimais (padrão: 1)
 * @param divideBy100 - Se deve dividir o valor por 100 (padrão: true)
 * @returns String formatada como percentual
 * @example formatPercent(0.1234) // "12,3%"
 * @example formatPercent(12.34, 1, false) // "12,3%"
 */
export function formatPercent(value: number, decimals: number = 1, divideBy100: boolean = true): string {
    const formattedValue = divideBy100 ? value / 100 : value;
    return new Intl.NumberFormat("pt-BR", {
        style: "percent",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        signDisplay: "exceptZero"
    }).format(formattedValue);
}

/**
 * Formata um valor numérico para número compacto (mil, milhão, etc)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada de forma compacta
 * @example formatCompactNumber(1234567) // "1,2M"
 */
export function formatCompactNumber(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
        notation: "compact",
        compactDisplay: "short",
    }).format(value);
}