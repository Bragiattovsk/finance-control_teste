import { useEffect, useMemo, useState } from "react"
import { formatCurrency } from "@/lib/format"
import { supabase } from "@/lib/supabase"

interface ChartPoint {
    month: number
    year: number
    invested: number
    interest: number
    total: number
    comparisonTotal?: number
}

interface Totals {
    totalInvested: number
    totalInterest: number
    totalAmount: number
}

interface UseCompoundInterestReturn {
    initialAmount: number
    monthlyContribution: number
    annualInterestRate: number
    years: number
    rateType: "MONTHLY" | "YEARLY"
    profitabilityType: "NOMINAL" | "REAL"
    rateMode: "FIXED" | "CDI"
    cdiValue: number
    cdiPercent: number
    isRateLoading: boolean
    rateSource: "MANUAL" | "AUTO"
    fetchError: boolean
    cdiStrategy: "SPOT" | "AVERAGE"
    historicalRate: number
    currentRate: number
    simulationMode: "QUICK" | "ADVANCED"
    dataSource?: "BCB" | "BrasilAPI" | "Fallback" | "UNKNOWN"
    apiSource?: string
    setInitialAmount: (value: number) => void
    setMonthlyContribution: (value: number) => void
    setAnnualInterestRate: (value: number) => void
    setYears: (value: number) => void
    setRateType: (value: "MONTHLY" | "YEARLY") => void
    setProfitabilityType: (value: "NOMINAL" | "REAL") => void
    setRateMode: (value: "FIXED" | "CDI") => void
    setCdiValue: (value: number) => void
    setCdiPercent: (value: number) => void
    setRateSource: (value: "MANUAL" | "AUTO") => void
    setCdiStrategy: (value: "SPOT" | "AVERAGE") => void
    setMode: (mode: "QUICK" | "ADVANCED") => void
    applyPreset: (type: "MILLION" | "HOUSE" | "RETIRE") => void
    effectiveAnnualRate: number
    simulation: {
        chartData: ChartPoint[]
        totals: {
            totalInvested: string
            totalInterest: string
            totalAmount: string
        }
        rawTotals: Totals
        taxRate: number
        taxAmount: number
        netTotal: number
        netInterest: number
    }
}

const round = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 100) / 100

export function useCompoundInterest(
    initialAmount: number = 5000,
    monthlyContribution: number = 500,
    annualInterestRate: number = 12,
    years: number = 5,
    defaultRateType: "MONTHLY" | "YEARLY" = "YEARLY",
    defaultProfitability: "NOMINAL" | "REAL" = "NOMINAL",
    defaultRateMode: "FIXED" | "CDI" = "FIXED",
    defaultCdiValue: number = 12.15,
    defaultCdiPercent: number = 100
): UseCompoundInterestReturn {
    const [initialAmountState, setInitialAmount] = useState<number>(initialAmount)
    const [monthlyContributionState, setMonthlyContribution] = useState<number>(monthlyContribution)
    const [annualInterestRateState, setAnnualInterestRate] = useState<number>(annualInterestRate)
    const [yearsState, setYears] = useState<number>(years)
    const [rateType, setRateType] = useState<"MONTHLY" | "YEARLY">(defaultRateType)
    const [profitabilityType, setProfitabilityType] = useState<"NOMINAL" | "REAL">(defaultProfitability)
    const [rateMode, setRateMode] = useState<"FIXED" | "CDI">(defaultRateMode)
    const [cdiValueState, setCdiValue] = useState<number>(defaultCdiValue)
    const [cdiPercentState, setCdiPercent] = useState<number>(defaultCdiPercent)
    const [isRateLoading, setIsRateLoading] = useState<boolean>(false)
    const [rateSource, setRateSource] = useState<"MANUAL" | "AUTO">("MANUAL")
    const [fetchError, setFetchError] = useState<boolean>(false)
    const [cdiStrategy, setCdiStrategy] = useState<"SPOT" | "AVERAGE">("SPOT")
    const [historicalRate, setHistoricalRate] = useState<number>(0)
    const [currentRate, setCurrentRate] = useState<number>(0)
    const [simulationMode, setSimulationMode] = useState<"QUICK" | "ADVANCED">("QUICK")
    const [dataSource, setDataSource] = useState<"BCB" | "BrasilAPI" | "Fallback" | "UNKNOWN">("UNKNOWN")
    const [apiSource, setApiSource] = useState<string>("")

    const { chartData, totals, effectiveAnnualRate, taxRate, taxAmount, netTotal, netInterest } = useMemo(() => {
        const calculateTaxRates = (months: number) => {
            const days = months * 30
            const iofRate = months < 1 ? 50 : 0
            let irRate = 15
            if (days <= 180) irRate = 22.5
            else if (days <= 360) irRate = 20
            else if (days <= 720) irRate = 17.5
            else irRate = 15
            return { iofRate, irRate }
        }
        const activeCdiRate = cdiStrategy === "SPOT" ? currentRate : historicalRate
        const effectiveAnnualRateCalc = simulationMode === "QUICK"
            ? annualInterestRateState
            : (rateMode === "CDI"
                ? ((rateSource === "MANUAL" ? cdiValueState : activeCdiRate) * (cdiPercentState / 100))
                : (rateType === "MONTHLY"
                    ? (Math.pow(1 + annualInterestRateState / 100, 12) - 1) * 100
                    : annualInterestRateState))

        const r = Math.pow(1 + effectiveAnnualRateCalc / 100, 1 / 12) - 1
        const months = Math.max(0, Math.floor(yearsState * 12))

        const data: ChartPoint[] = []

        let lastTotal = initialAmountState
        let lastTotalComp = initialAmountState

        const oppositeCdiRate = cdiStrategy === "SPOT" ? historicalRate : currentRate
        const comparisonAnnualRate = simulationMode === "QUICK"
            ? effectiveAnnualRateCalc
            : (rateMode === "CDI"
                ? (oppositeCdiRate * (cdiPercentState / 100))
                : (rateType === "MONTHLY"
                    ? (Math.pow(1 + annualInterestRateState / 100, 12) - 1) * 100
                    : annualInterestRateState))
        const rComp = Math.pow(1 + comparisonAnnualRate / 100, 1 / 12) - 1

        for (let m = 0; m <= months; m++) {
            const invested = initialAmountState + monthlyContributionState * m

            const base = m === 0 ? initialAmountState : lastTotal + monthlyContributionState
            let totalAccumulated = r === 0 ? invested : round(base * (1 + r))
            if (r === 0) {
                totalAccumulated = invested
            }

            const interest = totalAccumulated - invested

            const baseComp = m === 0 ? initialAmountState : lastTotalComp + monthlyContributionState
            let totalComp = rComp === 0 ? invested : round(baseComp * (1 + rComp))
            if (rComp === 0) {
                totalComp = invested
            }

            const monthNumber = (m % 12) + 1
            const yearNumber = Math.floor(m / 12)

            data.push({
                month: monthNumber,
                year: yearNumber,
                invested: round(invested),
                interest: round(interest),
                total: round(totalAccumulated),
                comparisonTotal: round(totalComp),
            })

            lastTotal = totalAccumulated
            lastTotalComp = totalComp
        }

        const last = data[data.length - 1] || { invested: 0, interest: 0, total: 0 }

        const rawTotals: Totals = {
            totalInvested: round(last.invested),
            totalInterest: round(last.interest),
            totalAmount: round(last.total),
        }

        const { irRate } = calculateTaxRates(months)
        const taxRate = irRate
        const taxAmount = round(last.interest * (taxRate / 100))
        const netTotal = round(last.total - taxAmount)
        const netInterest = round(last.interest - taxAmount)
        return { chartData: data, totals: rawTotals, effectiveAnnualRate: effectiveAnnualRateCalc, taxRate, taxAmount, netTotal, netInterest }
    }, [initialAmountState, monthlyContributionState, annualInterestRateState, yearsState, rateType, rateMode, cdiValueState, cdiPercentState, cdiStrategy, currentRate, historicalRate, rateSource, simulationMode])

    useEffect(() => {
        let mounted = true
        const fetchRates = async () => {
            try {
                setIsRateLoading(true)
                const { data, error } = await supabase.functions.invoke("get-financial-rates", { body: {} })
                if (error) throw error
                if (mounted && data) {
                    const curr = Number(data.current_rate)
                    const avg24 = Number(data.historical_average_24m)
                    if (Number.isFinite(curr)) setCurrentRate(curr)
                    if (Number.isFinite(avg24)) setHistoricalRate(avg24)
                    if (cdiStrategy === "SPOT" && Number.isFinite(curr)) setCdiValue(curr)
                    const srcRaw = typeof data.source === "string" ? (data.source as string) : "UNKNOWN"
                    setApiSource(srcRaw)
                    if (srcRaw === "Fallback") {
                        setRateSource("MANUAL")
                        console.warn("Usando taxa de segurança (12.15%)")
                    } else {
                        setRateSource("AUTO")
                    }
                    const mapped = srcRaw === "BCB" || srcRaw === "BrasilAPI" || srcRaw === "Fallback" ? (srcRaw as "BCB" | "BrasilAPI" | "Fallback") : "UNKNOWN"
                    setDataSource(mapped)
                    setFetchError(false)
                }
            } catch (err) {
                console.error(err)
                if (mounted) {
                    setRateSource("MANUAL")
                    setDataSource("Fallback")
                    setApiSource("Fallback")
                    setFetchError(true)
                }
            } finally {
                if (mounted) setIsRateLoading(false)
            }
        }
        fetchRates()
        return () => {
            mounted = false
        }
    }, [cdiStrategy])

    const applyPreset = (type: "MILLION" | "HOUSE" | "RETIRE") => {
        if (type === "MILLION") {
            setInitialAmount(10000)
            setMonthlyContribution(2500)
            setAnnualInterestRate(12)
            setYears(15)
            setRateType("YEARLY")
        } else if (type === "HOUSE") {
            setInitialAmount(20000)
            setMonthlyContribution(3000)
            setAnnualInterestRate(10)
            setYears(8)
            setRateType("YEARLY")
        } else if (type === "RETIRE") {
            setInitialAmount(0)
            setMonthlyContribution(1000)
            setAnnualInterestRate(12)
            setYears(30)
            setRateType("YEARLY")
        }
    }

    const setMode = (mode: "QUICK" | "ADVANCED") => {
        setSimulationMode(mode)
        if (mode === "QUICK") {
            setRateMode("FIXED")
            setCdiStrategy("SPOT")
            setRateType("YEARLY")
        }
    }

    return {
        initialAmount: initialAmountState,
        monthlyContribution: monthlyContributionState,
        annualInterestRate: annualInterestRateState,
        years: yearsState,
        rateType,
        profitabilityType,
        rateMode,
        cdiValue: cdiValueState,
        cdiPercent: cdiPercentState,
        isRateLoading,
        rateSource,
        fetchError,
        cdiStrategy,
        historicalRate,
        currentRate,
        simulationMode,
        dataSource,
        apiSource,
        setInitialAmount,
        setMonthlyContribution,
        setAnnualInterestRate,
        setYears,
        setRateType,
        setProfitabilityType,
        setRateMode,
        setCdiValue,
        setCdiPercent,
        setRateSource,
        setCdiStrategy,
        setMode,
        applyPreset,
        effectiveAnnualRate,
        simulation: {
            chartData,
            totals: {
                totalInvested: formatCurrency(totals.totalInvested),
                totalInterest: formatCurrency(totals.totalInterest),
                totalAmount: formatCurrency(totals.totalAmount),
            },
            rawTotals: totals,
            taxRate,
            taxAmount,
            netTotal,
            netInterest,
        },
    }
}
